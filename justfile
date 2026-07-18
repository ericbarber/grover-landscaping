set shell := ["bash", "-cu"]

backend_dir := "backend"
frontend_dir := "frontend"
terraform_dir := "infra/terraform"
terraform_dev_dir := "infra/terraform/environments/dev"
terraform_prod_dir := "infra/terraform/environments/prod"
image_name := "grover-landscaping:local"

# List available recipes.
default:
  @just --list

# Copy the example environment file when .env does not exist.
env-init:
  @test -f .env || cp .env.example .env

# Install frontend dependencies.
install-frontend:
  cd {{frontend_dir}} && npm ci

# Install all local project dependencies managed by this repository.
install: install-frontend

# Start the full local Docker Compose stack.
up: env-init
  docker compose up --build

# Start the full local Docker Compose stack in the background.
up-detached: env-init
  docker compose up --build -d

# Stop the local Docker Compose stack.
down:
  docker compose down

# Validate Docker Compose configuration.
docker-config:
  docker compose config --quiet

# Build the production Docker image locally.
docker-build:
  docker build --tag {{image_name}} .

# Apply local PostgreSQL migrations through Docker Compose.
migrate:
  bash scripts/apply-local-migrations.sh

# Run the backend API locally.
dev-backend:
  cd {{backend_dir}} && cargo run

# Run the frontend dev server locally.
dev-frontend:
  cd {{frontend_dir}} && npm run dev

# Start the local fallback app on the workstation's Tailscale address for phone review.
mobile-review:
  bash scripts/mobile-review.sh

# Check Rust formatting.
backend-fmt:
  cd {{backend_dir}} && cargo fmt --all -- --check

# Run Rust clippy with CI-equivalent warnings.
backend-lint:
  cd {{backend_dir}} && cargo clippy --all-targets --all-features -- -D warnings

# Run Rust tests.
backend-test:
  cd {{backend_dir}} && cargo test --all

# Run all backend checks.
backend-check: backend-fmt backend-lint backend-test

# Type-check the frontend.
frontend-typecheck:
  cd {{frontend_dir}} && npm run typecheck

# Run frontend tests.
frontend-test:
  cd {{frontend_dir}} && npm test

# Build the frontend.
frontend-build:
  cd {{frontend_dir}} && npm run build

# Run all frontend checks.
frontend-check: frontend-typecheck frontend-test frontend-build

# Check Terraform formatting.
terraform-fmt:
  terraform fmt -check -recursive {{terraform_dir}}

# Initialize the development Terraform environment without a backend.
terraform-init-dev:
  terraform -chdir={{terraform_dev_dir}} init -backend=false

# Initialize the production Terraform environment without a backend.
terraform-init-prod:
  terraform -chdir={{terraform_prod_dir}} init -backend=false

# Validate the development Terraform environment.
terraform-validate-dev: terraform-init-dev
  terraform -chdir={{terraform_dev_dir}} validate

# Validate the production Terraform environment.
terraform-validate-prod: terraform-init-prod
  terraform -chdir={{terraform_prod_dir}} validate

# Run all Terraform checks.
terraform-check: terraform-fmt terraform-validate-dev terraform-validate-prod

# Run the main local validation suite.
check: backend-check frontend-check terraform-check docker-config

# Run the expanded local CI suite, including the production image build.
ci-local: check docker-build
