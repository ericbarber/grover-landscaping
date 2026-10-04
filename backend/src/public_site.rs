use reqwest::Url;
use std::{env, fmt, fs, path::PathBuf};

const SHARE_IMAGE_PATH: &str = "/brand/grover-landscape-home-hero.webp";
const SHARE_IMAGE_ALT: &str = "Landscape care team working in a Southwestern garden at sunrise";

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub struct PublicRouteMetadata {
    pub path: &'static str,
    pub title: &'static str,
    pub description: &'static str,
    pub headline: &'static str,
}

pub const PUBLIC_ROUTES: [PublicRouteMetadata; 5] = [
    PublicRouteMetadata {
        path: "/",
        title: "Clearer yard care for homeowners | Grover",
        description: "See what’s planned, what was completed, and what your yard may need next—without chasing an update.",
        headline: "Your yard. Every visit. One clear story.",
    },
    PublicRouteMetadata {
        path: "/for-landscaping-companies",
        title: "Landscaping operations software | Grover",
        description: "Connect daily planning, field progress, customer-ready proof, and follow-through in one calm operating view.",
        headline: "Plan the day. Guide the crew. Prove the work.",
    },
    PublicRouteMetadata {
        path: "/for-yard-owners",
        title: "Clearer yard care for homeowners | Grover",
        description: "See what’s planned, what was completed, and what your yard may need next—without chasing an update.",
        headline: "Your yard. Every visit. One clear story.",
    },
    PublicRouteMetadata {
        path: "/for-property-managers",
        title: "Landscaping oversight for property managers | Grover",
        description: "Review service status and delivered completion evidence across the properties you are authorized to access.",
        headline: "Keep your entire property portfolio in view.",
    },
    PublicRouteMetadata {
        path: "/for-crew-leads",
        title: "Field workflow for landscaping crews | Grover",
        description: "Give crews the route, service details, and evidence requirements they need without the office back-and-forth.",
        headline: "Know the next stop—and what done looks like.",
    },
];

#[derive(Debug)]
pub enum PublicSiteError {
    Configuration(String),
    Template(String),
    Io(std::io::Error),
}

impl fmt::Display for PublicSiteError {
    fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::Configuration(message) | Self::Template(message) => formatter.write_str(message),
            Self::Io(error) => write!(formatter, "{error}"),
        }
    }
}

impl std::error::Error for PublicSiteError {}

impl From<std::io::Error> for PublicSiteError {
    fn from(error: std::io::Error) -> Self {
        Self::Io(error)
    }
}

#[derive(Clone, Debug)]
pub struct PublicSite {
    index_template: String,
    robots_policy: String,
    origin: Url,
}

impl PublicSite {
    pub fn from_environment(
        frontend_dist: PathBuf,
        production: bool,
    ) -> Result<Self, PublicSiteError> {
        let origin = match env::var("PUBLIC_APP_URL") {
            Ok(value) if !value.trim().is_empty() => value,
            _ if !production => "http://localhost:5173".to_string(),
            _ => {
                return Err(PublicSiteError::Configuration(
                    "PUBLIC_APP_URL is required when APP_ENV=production".to_string(),
                ));
            }
        };
        Self::new(frontend_dist, &origin, production)
    }

    pub fn new(
        frontend_dist: PathBuf,
        public_app_url: &str,
        production: bool,
    ) -> Result<Self, PublicSiteError> {
        let origin = Url::parse(public_app_url).map_err(|_| {
            PublicSiteError::Configuration(
                "PUBLIC_APP_URL must be an absolute HTTP(S) origin".to_string(),
            )
        })?;
        let is_exact_origin = origin.path() == "/"
            && origin.query().is_none()
            && origin.fragment().is_none()
            && origin.username().is_empty()
            && origin.password().is_none();
        let allowed_scheme = if production {
            origin.scheme() == "https"
        } else {
            matches!(origin.scheme(), "http" | "https")
        };
        if !is_exact_origin || !allowed_scheme {
            return Err(PublicSiteError::Configuration(if production {
                "PUBLIC_APP_URL must be an exact HTTPS origin in production".to_string()
            } else {
                "PUBLIC_APP_URL must be an exact HTTP(S) origin".to_string()
            }));
        }
        let index_template = fs::read_to_string(frontend_dist.join("index.html"))?;
        let robots_policy = fs::read_to_string(frontend_dist.join("robots.txt"))?;
        validate_template(&index_template)?;
        Ok(Self {
            index_template,
            robots_policy,
            origin,
        })
    }

    pub fn render(&self, request_path: &str) -> Result<Option<String>, PublicSiteError> {
        let normalized = normalize_public_path(request_path);
        let Some(metadata) = PUBLIC_ROUTES
            .iter()
            .find(|metadata| metadata.path == normalized)
        else {
            return Ok(None);
        };
        let mut html = self.index_template.clone();
        let canonical_url = self.absolute_url(metadata.path)?;
        let share_image_url = self.absolute_url(SHARE_IMAGE_PATH)?;

        replace_title(&mut html, metadata.title)?;
        set_head_tag(
            &mut html,
            "<meta name=\"description\"",
            &format!(
                "<meta name=\"description\" content=\"{}\" />",
                escape_html(metadata.description)
            ),
        )?;
        for (prefix, tag) in [
            (
                "<meta property=\"og:title\"",
                format!(
                    "<meta property=\"og:title\" content=\"{}\" />",
                    escape_html(metadata.title)
                ),
            ),
            (
                "<meta property=\"og:description\"",
                format!(
                    "<meta property=\"og:description\" content=\"{}\" />",
                    escape_html(metadata.description)
                ),
            ),
            (
                "<meta property=\"og:url\"",
                format!("<meta property=\"og:url\" content=\"{canonical_url}\" />"),
            ),
            (
                "<meta property=\"og:image\"",
                format!("<meta property=\"og:image\" content=\"{share_image_url}\" />"),
            ),
            (
                "<meta property=\"og:image:alt\"",
                format!(
                    "<meta property=\"og:image:alt\" content=\"{}\" />",
                    escape_html(SHARE_IMAGE_ALT)
                ),
            ),
            (
                "<meta name=\"twitter:title\"",
                format!(
                    "<meta name=\"twitter:title\" content=\"{}\" />",
                    escape_html(metadata.title)
                ),
            ),
            (
                "<meta name=\"twitter:description\"",
                format!(
                    "<meta name=\"twitter:description\" content=\"{}\" />",
                    escape_html(metadata.description)
                ),
            ),
            (
                "<meta name=\"twitter:image\"",
                format!("<meta name=\"twitter:image\" content=\"{share_image_url}\" />"),
            ),
            (
                "<link rel=\"canonical\"",
                format!("<link rel=\"canonical\" href=\"{canonical_url}\" />"),
            ),
        ] {
            set_head_tag(&mut html, prefix, &tag)?;
        }

        let summary = format!(
            "<div id=\"root\"><main data-public-entry-summary=\"{}\"><h1>{}</h1><p>{}</p></main></div>",
            escape_html(metadata.path),
            escape_html(metadata.headline),
            escape_html(metadata.description),
        );
        if !html.contains("<div id=\"root\"></div>") {
            return Err(PublicSiteError::Template(
                "frontend index is missing the empty root element".to_string(),
            ));
        }
        html = html.replacen("<div id=\"root\"></div>", &summary, 1);
        Ok(Some(html))
    }

    pub fn sitemap(&self) -> Result<String, PublicSiteError> {
        let mut entries = String::new();
        for metadata in PUBLIC_ROUTES {
            entries.push_str("  <url><loc>");
            entries.push_str(&self.absolute_url(metadata.path)?);
            entries.push_str("</loc></url>\n");
        }
        Ok(format!(
            "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">\n{entries}</urlset>\n"
        ))
    }

    pub fn robots(&self) -> Result<String, PublicSiteError> {
        let mut policy = self.robots_policy.clone();
        if !policy.ends_with('\n') {
            policy.push('\n');
        }
        policy.push_str(&format!(
            "\nSitemap: {}\n",
            self.absolute_url("/sitemap.xml")?
        ));
        Ok(policy)
    }

    fn absolute_url(&self, path: &str) -> Result<String, PublicSiteError> {
        self.origin
            .join(path.trim_start_matches('/'))
            .map(|url| url.to_string())
            .map_err(|_| {
                PublicSiteError::Configuration("public URL could not be composed".to_string())
            })
    }
}

fn validate_template(html: &str) -> Result<(), PublicSiteError> {
    for required in ["<title>", "</title>", "</head>", "<div id=\"root\"></div>"] {
        if !html.contains(required) {
            return Err(PublicSiteError::Template(format!(
                "frontend index is missing required marker: {required}"
            )));
        }
    }
    Ok(())
}

fn normalize_public_path(path: &str) -> &str {
    if path == "/" {
        path
    } else {
        path.trim_end_matches('/')
    }
}

fn replace_title(html: &mut String, title: &str) -> Result<(), PublicSiteError> {
    let Some(start) = html.find("<title>") else {
        return Err(PublicSiteError::Template(
            "frontend index is missing its title".to_string(),
        ));
    };
    let content_start = start + "<title>".len();
    let Some(relative_end) = html[content_start..].find("</title>") else {
        return Err(PublicSiteError::Template(
            "frontend index has an incomplete title".to_string(),
        ));
    };
    html.replace_range(
        content_start..content_start + relative_end,
        &escape_html(title),
    );
    Ok(())
}

fn set_head_tag(html: &mut String, prefix: &str, replacement: &str) -> Result<(), PublicSiteError> {
    if let Some(start) = html.find(prefix) {
        let Some(relative_end) = html[start..].find('>') else {
            return Err(PublicSiteError::Template(format!(
                "frontend index has an incomplete head tag: {prefix}"
            )));
        };
        html.replace_range(start..=start + relative_end, replacement);
        return Ok(());
    }
    let Some(head_end) = html.find("</head>") else {
        return Err(PublicSiteError::Template(
            "frontend index is missing its head".to_string(),
        ));
    };
    html.insert_str(head_end, &format!("    {replacement}\n  "));
    Ok(())
}

fn escape_html(value: &str) -> String {
    value
        .replace('&', "&amp;")
        .replace('<', "&lt;")
        .replace('>', "&gt;")
        .replace('"', "&quot;")
}

#[cfg(test)]
mod tests {
    use super::{PublicSite, PUBLIC_ROUTES};
    use std::{fs, time::SystemTime};

    fn fixture() -> (PublicSite, std::path::PathBuf) {
        let suffix = SystemTime::now()
            .duration_since(SystemTime::UNIX_EPOCH)
            .unwrap()
            .as_nanos();
        let directory = std::env::temp_dir().join(format!("grover-public-site-{suffix}"));
        fs::create_dir_all(&directory).unwrap();
        fs::write(
            directory.join("index.html"),
            "<!doctype html><html><head><title>Fallback</title><meta name=\"description\" content=\"Fallback\" /><meta property=\"og:title\" content=\"Fallback\" /><meta property=\"og:description\" content=\"Fallback\" /><meta property=\"og:image\" content=\"/image.webp\" /><meta name=\"twitter:title\" content=\"Fallback\" /><meta name=\"twitter:description\" content=\"Fallback\" /><meta name=\"twitter:image\" content=\"/image.webp\" /></head><body><div id=\"root\"></div></body></html>",
        )
        .unwrap();
        fs::write(directory.join("robots.txt"), "User-agent: *\nAllow: /\n").unwrap();
        let site = PublicSite::new(directory.clone(), "https://grover.example", true).unwrap();
        (site, directory)
    }

    #[test]
    fn renders_every_public_route_with_initial_copy_and_absolute_metadata() {
        let (site, directory) = fixture();
        for metadata in PUBLIC_ROUTES {
            let html = site.render(metadata.path).unwrap().unwrap();
            assert!(html.contains(metadata.headline), "{}", metadata.path);
            assert!(html.contains(metadata.description), "{}", metadata.path);
            assert!(html.contains(&format!(
                "https://grover.example{}",
                if metadata.path == "/" {
                    "/"
                } else {
                    metadata.path
                }
            )));
            assert!(html.contains("https://grover.example/brand/grover-landscape-home-hero.webp"));
        }
        assert!(site.render("/app").unwrap().is_none());
        fs::remove_dir_all(directory).unwrap();
    }

    #[test]
    fn emits_only_public_routes_in_the_sitemap_and_absolute_sitemap_in_robots() {
        let (site, directory) = fixture();
        let sitemap = site.sitemap().unwrap();
        assert_eq!(sitemap.matches("<url>").count(), PUBLIC_ROUTES.len());
        assert!(!sitemap.contains("/app"));
        assert!(!sitemap.contains("invitation"));
        assert!(site
            .robots()
            .unwrap()
            .contains("Sitemap: https://grover.example/sitemap.xml"));
        fs::remove_dir_all(directory).unwrap();
    }

    #[test]
    fn production_origin_must_be_an_exact_https_origin() {
        let (_site, directory) = fixture();
        for invalid in [
            "http://grover.example",
            "https://grover.example/path",
            "https://user@grover.example",
            "https://grover.example/?campaign=one",
        ] {
            assert!(PublicSite::new(directory.clone(), invalid, true).is_err());
        }
        assert!(PublicSite::new(directory.clone(), "https://grover.example", true).is_ok());
        fs::remove_dir_all(directory).unwrap();
    }
}
