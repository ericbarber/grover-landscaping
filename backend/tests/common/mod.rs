use grover_landscaping_api::db::DatabaseConfig;

pub fn database_config() -> Option<DatabaseConfig> {
    let config = DatabaseConfig::from_env();

    if config.is_none() && std::env::var_os("CI").is_some() {
        panic!("DATABASE_URL is required for PostgreSQL integration tests in CI");
    }

    config
}
