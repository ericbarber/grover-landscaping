/// Customer-visible application name.
///
/// Compatibility-sensitive crate, service, database, storage, and deployment
/// identifiers deliberately keep their existing namespace when this changes.
pub const APP_DISPLAY_NAME: &str = "Grover";

pub fn authentication_realm() -> String {
    format!("Bearer realm=\"{APP_DISPLAY_NAME}\"")
}

#[cfg(test)]
mod tests {
    use super::{authentication_realm, APP_DISPLAY_NAME};

    #[test]
    fn composes_customer_visible_authentication_realm_from_display_name() {
        assert_eq!(
            authentication_realm(),
            format!("Bearer realm=\"{APP_DISPLAY_NAME}\"")
        );
    }
}
