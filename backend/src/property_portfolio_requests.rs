use serde::{Deserialize, Serialize};

use crate::property_portfolios::is_valid_portfolio_type;

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq, Eq)]
pub struct CreatePropertyPortfolioRequest {
    pub account_id: String,
    pub organization_id: String,
    pub display_name: String,
    pub portfolio_type: String,
}

pub fn is_valid_create_property_portfolio_request(
    request: &CreatePropertyPortfolioRequest,
) -> bool {
    !request.account_id.trim().is_empty()
        && !request.organization_id.trim().is_empty()
        && !request.display_name.trim().is_empty()
        && is_valid_portfolio_type(&request.portfolio_type)
}

#[cfg(test)]
mod tests {
    use super::{is_valid_create_property_portfolio_request, CreatePropertyPortfolioRequest};

    fn valid_request() -> CreatePropertyPortfolioRequest {
        CreatePropertyPortfolioRequest {
            account_id: "account_1001".to_string(),
            organization_id: "org_demo_landscaping".to_string(),
            display_name: "Sample owner homes".to_string(),
            portfolio_type: "individual_owner".to_string(),
        }
    }

    #[test]
    fn accepts_complete_create_portfolio_request() {
        assert!(is_valid_create_property_portfolio_request(&valid_request()));
    }

    #[test]
    fn requires_display_name() {
        let mut request = valid_request();
        request.display_name = "  ".to_string();

        assert!(!is_valid_create_property_portfolio_request(&request));
    }

    #[test]
    fn requires_supported_portfolio_type() {
        let mut request = valid_request();
        request.portfolio_type = "unsupported_type".to_string();

        assert!(!is_valid_create_property_portfolio_request(&request));
    }
}
