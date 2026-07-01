terraform {
  required_version = ">= 1.8.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.49"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

module "cognito" {
  source = "../../modules/cognito"

  application_name    = "grover-landscaping"
  environment         = "prod"
  callback_urls       = ["${trimsuffix(var.application_url, "/")}/auth/callback"]
  logout_urls         = ["${trimsuffix(var.application_url, "/")}/"]
  mfa_configuration   = "ON"
  deletion_protection = true
}
