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
  environment         = "dev"
  callback_urls       = ["http://localhost:5173/auth/callback"]
  logout_urls         = ["http://localhost:5173/"]
  mfa_configuration   = "OPTIONAL"
  deletion_protection = false
}
