use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq, Eq)]
pub struct PropertyPortfolio {
    pub id: String,
    pub account_id: String,
    pub organization_id: String,
    pub display_name: String,
    pub portfolio_type: String,
}

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq, Eq)]
pub struct PortfolioPropertyLink {
    pub id: String,
    pub portfolio_id: String,
    pub property_id: String,
    pub organization_id: String,
}

pub fn is_valid_portfolio_type(portfolio_type: &str) -> bool {
    matches!(
        portfolio_type,
        "individual_owner" | "property_management_company" | "hoa" | "commercial_client"
    )
}

#[cfg(test)]
mod tests {
    use super::is_valid_portfolio_type;

    #[test]
    fn accepts_supported_portfolio_types() {
        assert!(is_valid_portfolio_type("individual_owner"));
        assert!(is_valid_portfolio_type("property_management_company"));
        assert!(is_valid_portfolio_type("hoa"));
        assert!(is_valid_portfolio_type("commercial_client"));
    }

    #[test]
    fn rejects_unknown_portfolio_types() {
        assert!(!is_valid_portfolio_type("crew_owned"));
        assert!(!is_valid_portfolio_type("unknown"));
    }
}
