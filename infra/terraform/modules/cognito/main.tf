data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

locals {
  resource_name = "${var.application_name}-${var.environment}"
  domain_prefix = "${var.application_name}-${var.environment}-${data.aws_caller_identity.current.account_id}"
  roles = toset([
    "OrganizationOwner",
    "Manager",
    "CrewLead",
    "CrewMember",
    "PropertyOwner",
    "PropertyManager",
    "SupportAdmin",
  ])
}

resource "aws_cognito_user_pool" "this" {
  name                = "${local.resource_name}-users"
  user_pool_tier      = "ESSENTIALS"
  username_attributes = ["email"]

  auto_verified_attributes = ["email"]
  mfa_configuration        = var.mfa_configuration
  deletion_protection      = var.deletion_protection ? "ACTIVE" : "INACTIVE"

  username_configuration {
    case_sensitive = false
  }

  password_policy {
    minimum_length                   = 12
    require_lowercase                = true
    require_numbers                  = true
    require_symbols                  = true
    require_uppercase                = true
    temporary_password_validity_days = 3
  }

  software_token_mfa_configuration {
    enabled = true
  }

  account_recovery_setting {
    recovery_mechanism {
      name     = "verified_email"
      priority = 1
    }
  }

  admin_create_user_config {
    allow_admin_create_user_only = true
  }

  verification_message_template {
    default_email_option = "CONFIRM_WITH_CODE"
  }

  email_configuration {
    email_sending_account = "COGNITO_DEFAULT"
  }

  user_attribute_update_settings {
    attributes_require_verification_before_update = ["email"]
  }

  tags = merge(var.tags, {
    Application = var.application_name
    Environment = var.environment
    ManagedBy   = "terraform"
  })
}

resource "aws_cognito_user_pool_client" "spa" {
  name         = "${local.resource_name}-spa"
  user_pool_id = aws_cognito_user_pool.this.id

  generate_secret                      = false
  allowed_oauth_flows_user_pool_client = true
  allowed_oauth_flows                  = ["code"]
  allowed_oauth_scopes                 = ["openid", "email", "profile"]
  supported_identity_providers         = ["COGNITO"]
  callback_urls                        = var.callback_urls
  logout_urls                          = var.logout_urls
  default_redirect_uri                 = var.callback_urls[0]

  prevent_user_existence_errors = "ENABLED"
  enable_token_revocation       = true

  access_token_validity  = 60
  id_token_validity      = 60
  refresh_token_validity = 7

  token_validity_units {
    access_token  = "minutes"
    id_token      = "minutes"
    refresh_token = "days"
  }

  read_attributes = [
    "email",
    "email_verified",
    "name",
    "preferred_username",
  ]

  write_attributes = [
    "name",
    "preferred_username",
  ]
}

resource "aws_cognito_user_pool_domain" "this" {
  domain       = local.domain_prefix
  user_pool_id = aws_cognito_user_pool.this.id
}

resource "aws_cognito_user_group" "roles" {
  for_each = local.roles

  name         = each.value
  user_pool_id = aws_cognito_user_pool.this.id
  description  = "Grover Landscaping ${each.value} application role"
}
