use grover_landscaping_api::db::{DatabaseConfig, JobRepository};
use std::io;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    let config = DatabaseConfig::from_env().ok_or_else(|| {
        io::Error::new(
            io::ErrorKind::InvalidInput,
            "DATABASE_URL is required to apply migrations",
        )
    })?;

    JobRepository::connect(&config).await?;
    println!("Database migrations are current.");

    Ok(())
}
