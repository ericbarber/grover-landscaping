/// Customer-visible application name.
///
/// Compatibility-sensitive crate, service, database, storage, and deployment
/// identifiers deliberately keep their existing namespace when this changes.
pub const APP_DISPLAY_NAME: &str = "Grover";

pub fn app_page_title(title: &str) -> String {
    format!("{title} | {APP_DISPLAY_NAME}")
}

#[cfg(test)]
mod tests {
    use super::{app_page_title, APP_DISPLAY_NAME};

    #[test]
    fn composes_customer_visible_page_titles_from_the_display_name() {
        assert_eq!(
            app_page_title("Residential property care"),
            format!("Residential property care | {APP_DISPLAY_NAME}")
        );
    }
}
