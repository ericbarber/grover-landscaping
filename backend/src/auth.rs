use crate::access_control::{
    can_deliver_completion_report, can_manage_crew_assignments, can_manage_property_portfolios,
    can_manage_schedule, can_review_completion_report, can_submit_completion_report,
    can_view_crew_route, can_view_customer_property_portfolios, AccessRole,
};
use axum::{
    extract::{Request, State},
    http::{header::AUTHORIZATION, HeaderMap, Method, StatusCode},
    middleware::Next,
    response::{IntoResponse, Response},
    Json,
};
use jsonwebtoken::{
    decode, decode_header,
    jwk::{Jwk, JwkSet},
    Algorithm, DecodingKey, Validation,
};
use serde::{Deserialize, Serialize};
use std::{fmt, sync::Arc, time::Duration};
use tokio::sync::RwLock;

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "snake_case")]
pub enum PublicAuthMode {
    Disabled,
    Cognito,
}

#[derive(Clone, Debug, Serialize)]
pub struct PublicAuthConfig {
    pub mode: PublicAuthMode,
    pub issuer_url: Option<String>,
    pub client_id: Option<String>,
    pub login_domain: Option<String>,
}

#[derive(Clone, Debug)]
pub struct AuthPrincipal {
    pub subject: String,
    pub username: String,
    pub roles: Vec<AccessRole>,
}

#[derive(Clone)]
pub struct AuthService {
    backend: AuthBackend,
    public_config: PublicAuthConfig,
}

#[derive(Clone)]
enum AuthBackend {
    Disabled,
    Cognito(Arc<CognitoJwtVerifier>),
    #[cfg(test)]
    RejectAll,
}

struct CognitoJwtVerifier {
    issuer_url: String,
    client_id: String,
    jwks_url: String,
    http_client: reqwest::Client,
    jwks: RwLock<JwkSet>,
}

#[derive(Clone, Debug, Deserialize)]
struct CognitoAccessTokenClaims {
    sub: String,
    #[serde(default)]
    username: Option<String>,
    client_id: String,
    token_use: String,
    #[serde(rename = "cognito:groups", default)]
    groups: Vec<String>,
    #[serde(rename = "exp")]
    _exp: usize,
    iss: String,
}

#[derive(Debug)]
pub enum AuthError {
    Configuration(String),
    Http(reqwest::Error),
    Jwt(jsonwebtoken::errors::Error),
    MissingBearerToken,
    MissingSigningKey,
    InvalidToken(String),
}

impl fmt::Display for AuthError {
    fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::Configuration(message) | Self::InvalidToken(message) => {
                formatter.write_str(message)
            }
            Self::Http(error) => write!(formatter, "failed to load Cognito signing keys: {error}"),
            Self::Jwt(error) => write!(formatter, "invalid access token: {error}"),
            Self::MissingBearerToken => formatter.write_str("a Bearer access token is required"),
            Self::MissingSigningKey => formatter.write_str("the token signing key was not found"),
        }
    }
}

impl std::error::Error for AuthError {}

impl From<reqwest::Error> for AuthError {
    fn from(error: reqwest::Error) -> Self {
        Self::Http(error)
    }
}

impl From<jsonwebtoken::errors::Error> for AuthError {
    fn from(error: jsonwebtoken::errors::Error) -> Self {
        Self::Jwt(error)
    }
}

impl AuthService {
    pub async fn from_env(production: bool) -> Result<Self, AuthError> {
        let mode = std::env::var("AUTH_MODE")
            .unwrap_or_else(|_| if production { "cognito" } else { "disabled" }.to_string());

        match mode.as_str() {
            "disabled" if production => Err(AuthError::Configuration(
                "AUTH_MODE=disabled is not permitted in production".to_string(),
            )),
            "disabled" => Ok(Self::disabled()),
            "cognito" => {
                let issuer_url = required_env("COGNITO_ISSUER_URL")?;
                let client_id = required_env("COGNITO_CLIENT_ID")?;
                let login_domain = required_env("COGNITO_LOGIN_DOMAIN")?;

                if production
                    && (!issuer_url.starts_with("https://")
                        || !login_domain.starts_with("https://"))
                {
                    return Err(AuthError::Configuration(
                        "production Cognito URLs must use HTTPS".to_string(),
                    ));
                }

                let verifier = CognitoJwtVerifier::new(&issuer_url, &client_id).await?;
                Ok(Self {
                    backend: AuthBackend::Cognito(Arc::new(verifier)),
                    public_config: PublicAuthConfig {
                        mode: PublicAuthMode::Cognito,
                        issuer_url: Some(issuer_url.trim_end_matches('/').to_string()),
                        client_id: Some(client_id),
                        login_domain: Some(login_domain.trim_end_matches('/').to_string()),
                    },
                })
            }
            unsupported => Err(AuthError::Configuration(format!(
                "unsupported AUTH_MODE: {unsupported}"
            ))),
        }
    }

    pub fn disabled() -> Self {
        Self {
            backend: AuthBackend::Disabled,
            public_config: PublicAuthConfig {
                mode: PublicAuthMode::Disabled,
                issuer_url: None,
                client_id: None,
                login_domain: None,
            },
        }
    }

    #[cfg(test)]
    pub fn rejecting() -> Self {
        Self {
            backend: AuthBackend::RejectAll,
            public_config: PublicAuthConfig {
                mode: PublicAuthMode::Cognito,
                issuer_url: Some("https://issuer.example.test/pool".to_string()),
                client_id: Some("test-client".to_string()),
                login_domain: Some("https://login.example.test".to_string()),
            },
        }
    }

    pub fn public_config(&self) -> PublicAuthConfig {
        self.public_config.clone()
    }

    async fn authenticate(&self, headers: &HeaderMap) -> Result<AuthPrincipal, AuthError> {
        match &self.backend {
            AuthBackend::Disabled => Ok(AuthPrincipal {
                subject: "local-development-user".to_string(),
                username: "Local Developer".to_string(),
                roles: vec![AccessRole::OrganizationOwner],
            }),
            AuthBackend::Cognito(verifier) => {
                let token = bearer_token(headers)?;
                verifier.verify(token).await
            }
            #[cfg(test)]
            AuthBackend::RejectAll => {
                bearer_token(headers)?;
                Err(AuthError::InvalidToken("test token rejected".to_string()))
            }
        }
    }
}

impl CognitoJwtVerifier {
    async fn new(issuer_url: &str, client_id: &str) -> Result<Self, AuthError> {
        let issuer_url = issuer_url.trim_end_matches('/').to_string();
        let jwks_url = format!("{issuer_url}/.well-known/jwks.json");
        let http_client = reqwest::Client::builder()
            .timeout(Duration::from_secs(10))
            .build()?;
        let jwks = fetch_jwks(&http_client, &jwks_url).await?;

        Ok(Self {
            issuer_url,
            client_id: client_id.to_string(),
            jwks_url,
            http_client,
            jwks: RwLock::new(jwks),
        })
    }

    async fn verify(&self, token: &str) -> Result<AuthPrincipal, AuthError> {
        let header = decode_header(token)?;
        if header.alg != Algorithm::RS256 {
            return Err(AuthError::InvalidToken(
                "access token must use RS256".to_string(),
            ));
        }
        let key_id = header.kid.ok_or_else(|| {
            AuthError::InvalidToken("access token is missing a key id".to_string())
        })?;
        let jwk = self.signing_key(&key_id).await?;
        let decoding_key = DecodingKey::from_jwk(&jwk)?;
        let mut validation = Validation::new(Algorithm::RS256);
        validation.set_issuer(&[self.issuer_url.as_str()]);
        validation.validate_aud = false;

        let token_data = decode::<CognitoAccessTokenClaims>(token, &decoding_key, &validation)?;
        let claims = token_data.claims;

        if claims.token_use != "access" {
            return Err(AuthError::InvalidToken(
                "an access token is required".to_string(),
            ));
        }
        if claims.client_id != self.client_id {
            return Err(AuthError::InvalidToken(
                "access token was issued for a different client".to_string(),
            ));
        }
        if claims.iss != self.issuer_url {
            return Err(AuthError::InvalidToken(
                "access token issuer does not match".to_string(),
            ));
        }

        let roles = claims
            .groups
            .iter()
            .filter_map(|group| AccessRole::from_cognito_group(group))
            .collect();

        Ok(AuthPrincipal {
            username: claims.username.unwrap_or_else(|| claims.sub.clone()),
            subject: claims.sub,
            roles,
        })
    }

    async fn signing_key(&self, key_id: &str) -> Result<Jwk, AuthError> {
        if let Some(key) = self.jwks.read().await.find(key_id).cloned() {
            return Ok(key);
        }

        let refreshed = fetch_jwks(&self.http_client, &self.jwks_url).await?;
        let key = refreshed.find(key_id).cloned();
        *self.jwks.write().await = refreshed;

        key.ok_or(AuthError::MissingSigningKey)
    }
}

async fn fetch_jwks(client: &reqwest::Client, url: &str) -> Result<JwkSet, AuthError> {
    Ok(client
        .get(url)
        .send()
        .await?
        .error_for_status()?
        .json::<JwkSet>()
        .await?)
}

fn required_env(name: &str) -> Result<String, AuthError> {
    std::env::var(name)
        .ok()
        .filter(|value| !value.trim().is_empty())
        .ok_or_else(|| AuthError::Configuration(format!("{name} is required for Cognito auth")))
}

fn bearer_token(headers: &HeaderMap) -> Result<&str, AuthError> {
    headers
        .get(AUTHORIZATION)
        .and_then(|value| value.to_str().ok())
        .and_then(|value| value.strip_prefix("Bearer "))
        .filter(|token| !token.is_empty())
        .ok_or(AuthError::MissingBearerToken)
}

#[derive(Serialize)]
struct AuthFailureResponse {
    error: &'static str,
    message: &'static str,
}

pub async fn require_api_auth(
    State(auth): State<AuthService>,
    mut request: Request,
    next: Next,
) -> Response {
    let path = request.uri().path();
    if !is_protected_api_path(path) || is_public_path(path, request.method()) {
        return next.run(request).await;
    }

    let principal = match auth.authenticate(request.headers()).await {
        Ok(principal) => principal,
        Err(error) => {
            tracing::warn!(reason = %error, path, "API authentication rejected");
            return (
                StatusCode::UNAUTHORIZED,
                [("www-authenticate", "Bearer realm=\"Grover Landscaping\"")],
                Json(AuthFailureResponse {
                    error: "authentication_required",
                    message: "A valid sign-in session is required.",
                }),
            )
                .into_response();
        }
    };

    if !is_authorized(&principal, request.method(), path) {
        tracing::warn!(
            subject = %principal.subject,
            username = %principal.username,
            path,
            "API authorization rejected"
        );
        return (
            StatusCode::FORBIDDEN,
            Json(AuthFailureResponse {
                error: "access_denied",
                message: "Your account does not have access to this operation.",
            }),
        )
            .into_response();
    }

    request.extensions_mut().insert(principal);
    next.run(request).await
}

fn is_protected_api_path(path: &str) -> bool {
    path == "/me/access"
        || path == "/jobs"
        || path.starts_with("/jobs/")
        || path.starts_with("/accounts/")
        || path == "/completion-reports"
        || path.starts_with("/completion-reports/")
        || path == "/notifications"
        || path.starts_with("/notifications/")
        || path == "/property-portfolios"
        || path.starts_with("/property-portfolios/")
        || path.starts_with("/properties/")
        || path.starts_with("/crews/")
        || path == "/day-plans"
        || path.starts_with("/day-plans/")
        || path.starts_with("/shared-bids/")
}

fn is_public_path(path: &str, method: &Method) -> bool {
    matches!(
        path,
        "/health" | "/health/live" | "/health/ready" | "/auth/config"
    ) || (*method == Method::GET && path.starts_with("/reports/"))
        || (path.starts_with("/shared-bids/")
            && (*method == Method::GET || *method == Method::POST))
}

fn is_authorized(principal: &AuthPrincipal, method: &Method, path: &str) -> bool {
    if principal.roles.is_empty() {
        return false;
    }

    let can_view_route = principal.roles.iter().any(can_view_crew_route);
    let can_manage_routes = principal.roles.iter().any(can_manage_schedule);
    let can_review_reports = principal.roles.iter().any(can_review_completion_report);
    let can_deliver_reports = principal.roles.iter().any(can_deliver_completion_report);
    let can_submit_reports = principal.roles.iter().any(can_submit_completion_report);
    let can_manage_portfolios = principal.roles.iter().any(can_manage_property_portfolios);
    let can_manage_assignments = principal.roles.iter().any(can_manage_crew_assignments);
    let can_view_customer_portfolios = principal
        .roles
        .iter()
        .any(can_view_customer_property_portfolios);

    if path == "/me/access" {
        return *method == Method::GET;
    }

    if path == "/completion-reports" {
        return *method == Method::GET && can_review_reports;
    }

    if path == "/notifications" {
        return *method == Method::GET && can_review_reports;
    }

    if path.starts_with("/notifications/") && path.ends_with("/retry") {
        return *method == Method::POST && can_review_reports;
    }

    if path.starts_with("/notifications/") && path.ends_with("/resolve") {
        return *method == Method::POST && can_review_reports;
    }

    if path.starts_with("/completion-reports/") && path.ends_with("/review") {
        return *method == Method::POST && can_review_reports;
    }

    if path.starts_with("/completion-reports/") && path.ends_with("/request-changes") {
        return *method == Method::POST && can_review_reports;
    }

    if path.starts_with("/completion-reports/") && path.ends_with("/resubmit") {
        return *method == Method::POST && can_submit_reports;
    }

    if path.starts_with("/completion-reports/") && path.ends_with("/deliver") {
        return *method == Method::POST && can_deliver_reports;
    }

    if path.starts_with("/completion-reports/") && path.ends_with("/delivery-notifications") {
        return *method == Method::POST && can_deliver_reports;
    }

    if path.starts_with("/accounts/") && path.ends_with("/property-portfolios") {
        return *method == Method::GET && can_manage_portfolios;
    }

    if path.starts_with("/accounts/") && path.ends_with("/customer-property-portfolio") {
        return *method == Method::GET && can_view_customer_portfolios;
    }

    if path == "/property-portfolios" {
        return *method == Method::POST && can_manage_portfolios;
    }

    if path.starts_with("/property-portfolios/") && path.ends_with("/properties") {
        return *method == Method::POST && can_manage_portfolios;
    }

    if path.starts_with("/properties/") && path.ends_with("/crew-assignments") {
        return (*method == Method::GET || *method == Method::POST) && can_manage_assignments;
    }

    if path.starts_with("/crews/") && path.ends_with("/property-assignments/active") {
        return *method == Method::GET && can_manage_assignments;
    }

    if path.starts_with("/day-plans/") && (path.ends_with("/bids") || path.ends_with("/bid")) {
        return can_manage_routes;
    }

    if path.starts_with("/day-plans/") && path.ends_with("/status") {
        return can_view_route;
    }

    if path.starts_with("/day-plans/") && path.ends_with("/amendments") {
        return can_view_route || can_manage_routes;
    }

    if path == "/day-plans" || path.starts_with("/day-plans/") {
        return *method == Method::GET && can_view_route || can_manage_routes;
    }

    can_view_route
}

#[cfg(test)]
mod tests {
    use super::{is_authorized, is_public_path, require_api_auth, AuthPrincipal, AuthService};
    use crate::access_control::AccessRole;
    use axum::{
        body::Body,
        http::{Method, Request, StatusCode},
        middleware,
        routing::get,
        Router,
    };
    use tower::ServiceExt;

    fn principal(role: AccessRole) -> AuthPrincipal {
        AuthPrincipal {
            subject: "test-user".to_string(),
            username: "test@example.com".to_string(),
            roles: vec![role],
        }
    }

    #[test]
    fn manager_can_change_day_plans() {
        assert!(is_authorized(
            &principal(AccessRole::Manager),
            &Method::POST,
            "/day-plans"
        ));
    }

    #[test]
    fn crew_member_cannot_change_day_plan_structure() {
        assert!(!is_authorized(
            &principal(AccessRole::CrewMember),
            &Method::DELETE,
            "/day-plans/plan-1/stops/stop-1"
        ));
    }

    #[test]
    fn crew_member_can_update_stop_progress() {
        assert!(is_authorized(
            &principal(AccessRole::CrewMember),
            &Method::POST,
            "/day-plans/plan-1/stops/stop-1/status"
        ));
    }

    #[test]
    fn crew_member_can_update_job_add_on_progress() {
        assert!(is_authorized(
            &principal(AccessRole::CrewMember),
            &Method::PUT,
            "/jobs/job-1/add-ons/add-on-1/status"
        ));
    }

    #[test]
    fn crew_member_can_submit_day_plan_amendments() {
        assert!(is_authorized(
            &principal(AccessRole::CrewMember),
            &Method::POST,
            "/day-plans/plan-1/amendments"
        ));
    }

    #[test]
    fn only_managers_can_review_day_plan_amendments() {
        let path = "/day-plans/plan-1/amendments/amendment-1/review";

        assert!(is_authorized(
            &principal(AccessRole::Manager),
            &Method::PUT,
            path
        ));
        assert!(!is_authorized(
            &principal(AccessRole::CrewMember),
            &Method::PUT,
            path
        ));
    }

    #[test]
    fn only_managers_can_access_project_bids() {
        let path = "/day-plans/plan-1/bids";

        assert!(is_authorized(
            &principal(AccessRole::Manager),
            &Method::GET,
            path
        ));
        assert!(!is_authorized(
            &principal(AccessRole::CrewMember),
            &Method::GET,
            path
        ));
    }

    #[test]
    fn only_completion_report_reviewers_can_start_manager_review() {
        let path = "/completion-reports/report-1/review";

        assert!(is_authorized(
            &principal(AccessRole::Manager),
            &Method::POST,
            path
        ));
        assert!(is_authorized(
            &principal(AccessRole::OrganizationOwner),
            &Method::POST,
            path
        ));
        assert!(!is_authorized(
            &principal(AccessRole::CrewMember),
            &Method::POST,
            path
        ));
    }

    #[test]
    fn only_completion_report_reviewers_can_list_manager_report_queue() {
        let path = "/completion-reports";
        let method = Method::GET;

        assert!(is_authorized(
            &principal(AccessRole::Manager),
            &method,
            path,
        ));
        assert!(is_authorized(
            &principal(AccessRole::OrganizationOwner),
            &method,
            path,
        ));
        assert!(!is_authorized(
            &principal(AccessRole::CrewMember),
            &method,
            path,
        ));
        assert!(!is_authorized(
            &principal(AccessRole::PropertyOwner),
            &method,
            path,
        ));
    }

    #[test]
    fn only_completion_report_reviewers_can_list_notification_history() {
        let path = "/notifications";
        let method = Method::GET;

        assert!(is_authorized(
            &principal(AccessRole::Manager),
            &method,
            path,
        ));
        assert!(is_authorized(
            &principal(AccessRole::OrganizationOwner),
            &method,
            path,
        ));
        assert!(!is_authorized(
            &principal(AccessRole::CrewMember),
            &method,
            path,
        ));
        assert!(!is_authorized(
            &principal(AccessRole::PropertyOwner),
            &method,
            path,
        ));
    }

    #[test]
    fn only_completion_report_reviewers_can_retry_notifications() {
        let path = "/notifications/notification-1/retry";
        let method = Method::POST;

        assert!(is_authorized(
            &principal(AccessRole::Manager),
            &method,
            path,
        ));
        assert!(is_authorized(
            &principal(AccessRole::OrganizationOwner),
            &method,
            path,
        ));
        assert!(!is_authorized(
            &principal(AccessRole::CrewMember),
            &method,
            path,
        ));
        assert!(!is_authorized(
            &principal(AccessRole::PropertyOwner),
            &method,
            path,
        ));
    }

    #[test]
    fn only_completion_report_reviewers_can_resolve_notifications() {
        let path = "/notifications/notification-1/resolve";
        let method = Method::POST;

        assert!(is_authorized(
            &principal(AccessRole::Manager),
            &method,
            path,
        ));
        assert!(is_authorized(
            &principal(AccessRole::OrganizationOwner),
            &method,
            path,
        ));
        assert!(!is_authorized(
            &principal(AccessRole::CrewMember),
            &method,
            path,
        ));
        assert!(!is_authorized(
            &principal(AccessRole::PropertyOwner),
            &method,
            path,
        ));
    }

    #[test]
    fn only_completion_report_reviewers_can_request_changes() {
        let path = "/completion-reports/report-1/request-changes";

        assert!(is_authorized(
            &principal(AccessRole::Manager),
            &Method::POST,
            path
        ));
        assert!(is_authorized(
            &principal(AccessRole::SupportAdmin),
            &Method::POST,
            path
        ));
        assert!(!is_authorized(
            &principal(AccessRole::CrewLead),
            &Method::POST,
            path
        ));
    }

    #[test]
    fn completion_report_submitters_can_resubmit_changes() {
        let path = "/completion-reports/report-1/resubmit";

        assert!(is_authorized(
            &principal(AccessRole::CrewMember),
            &Method::POST,
            path
        ));
        assert!(is_authorized(
            &principal(AccessRole::CrewLead),
            &Method::POST,
            path
        ));
        assert!(is_authorized(
            &principal(AccessRole::Manager),
            &Method::POST,
            path
        ));
        assert!(!is_authorized(
            &principal(AccessRole::PropertyOwner),
            &Method::POST,
            path
        ));
    }

    #[test]
    fn only_completion_report_deliverers_can_deliver() {
        let path = "/completion-reports/report-1/deliver";

        assert!(is_authorized(
            &principal(AccessRole::Manager),
            &Method::POST,
            path
        ));
        assert!(is_authorized(
            &principal(AccessRole::OrganizationOwner),
            &Method::POST,
            path
        ));
        assert!(!is_authorized(
            &principal(AccessRole::CrewMember),
            &Method::POST,
            path
        ));
    }

    #[test]
    fn only_completion_report_deliverers_can_queue_delivery_notifications() {
        let path = "/completion-reports/report-1/delivery-notifications";

        assert!(is_authorized(
            &principal(AccessRole::Manager),
            &Method::POST,
            path
        ));
        assert!(is_authorized(
            &principal(AccessRole::OrganizationOwner),
            &Method::POST,
            path
        ));
        assert!(!is_authorized(
            &principal(AccessRole::CrewMember),
            &Method::POST,
            path
        ));
    }

    #[test]
    fn portfolio_managers_can_access_property_portfolio_routes() {
        assert!(is_authorized(
            &principal(AccessRole::Manager),
            &Method::POST,
            "/property-portfolios"
        ));
        assert!(is_authorized(
            &principal(AccessRole::PropertyManager),
            &Method::POST,
            "/property-portfolios/portfolio_1001/properties"
        ));
        assert!(is_authorized(
            &principal(AccessRole::OrganizationOwner),
            &Method::GET,
            "/accounts/acct_1001/property-portfolios"
        ));
        assert!(!is_authorized(
            &principal(AccessRole::CrewMember),
            &Method::POST,
            "/property-portfolios"
        ));
        assert!(!is_authorized(
            &principal(AccessRole::PropertyOwner),
            &Method::POST,
            "/property-portfolios/portfolio_1001/properties"
        ));
    }

    #[test]
    fn customer_portfolio_reads_allow_customer_and_manager_roles() {
        let path = "/accounts/acct_1001/customer-property-portfolio";

        assert!(is_authorized(
            &principal(AccessRole::PropertyOwner),
            &Method::GET,
            path
        ));
        assert!(is_authorized(
            &principal(AccessRole::PropertyManager),
            &Method::GET,
            path
        ));
        assert!(is_authorized(
            &principal(AccessRole::Manager),
            &Method::GET,
            path
        ));
        assert!(!is_authorized(
            &principal(AccessRole::CrewMember),
            &Method::GET,
            path
        ));
        assert!(!is_authorized(
            &principal(AccessRole::PropertyOwner),
            &Method::POST,
            path
        ));
    }

    #[test]
    fn crew_assignment_managers_can_access_property_assignment_routes() {
        assert!(is_authorized(
            &principal(AccessRole::Manager),
            &Method::POST,
            "/properties/property_1001/crew-assignments"
        ));
        assert!(is_authorized(
            &principal(AccessRole::OrganizationOwner),
            &Method::GET,
            "/properties/property_1001/crew-assignments"
        ));
        assert!(is_authorized(
            &principal(AccessRole::SupportAdmin),
            &Method::GET,
            "/crews/crew_1001/property-assignments/active"
        ));
        assert!(!is_authorized(
            &principal(AccessRole::CrewMember),
            &Method::POST,
            "/properties/property_1001/crew-assignments"
        ));
        assert!(!is_authorized(
            &principal(AccessRole::PropertyManager),
            &Method::GET,
            "/crews/crew_1001/property-assignments/active"
        ));
    }

    #[test]
    fn shared_bid_reads_and_decisions_are_public_token_operations() {
        assert!(is_public_path("/shared-bids/token-1", &Method::GET));
        assert!(is_public_path(
            "/shared-bids/token-1/decision",
            &Method::POST
        ));
    }

    #[test]
    fn customer_role_cannot_read_unscoped_job_routes() {
        assert!(!is_authorized(
            &principal(AccessRole::PropertyOwner),
            &Method::GET,
            "/jobs"
        ));
    }

    #[tokio::test]
    async fn protected_api_rejects_a_missing_bearer_token() {
        let app = Router::new().route("/jobs", get(|| async { "ok" })).layer(
            middleware::from_fn_with_state(AuthService::rejecting(), require_api_auth),
        );

        let response = app
            .oneshot(Request::builder().uri("/jobs").body(Body::empty()).unwrap())
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::UNAUTHORIZED);
        assert!(response.headers().contains_key("www-authenticate"));
    }

    #[tokio::test]
    async fn frontend_routes_remain_public_for_the_sign_in_screen() {
        let app = Router::new().route("/", get(|| async { "sign in" })).layer(
            middleware::from_fn_with_state(AuthService::rejecting(), require_api_auth),
        );

        let response = app
            .oneshot(Request::builder().uri("/").body(Body::empty()).unwrap())
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);
    }
}
