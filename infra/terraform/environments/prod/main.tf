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

module "photo_storage" {
  count  = var.enable_photo_storage ? 1 : 0
  source = "../../modules/s3-photos"

  application_name             = "grover-landscaping"
  environment                  = "prod"
  bucket_name                  = var.photo_bucket_name
  key_prefix                   = var.photo_key_prefix
  cors_allowed_origins         = [trimsuffix(var.application_url, "/")]
  archive_after_days           = var.photo_archive_after_days
  archive_storage_class        = var.photo_archive_storage_class
  delete_after_days            = var.photo_delete_after_days
  noncurrent_delete_after_days = var.photo_noncurrent_delete_after_days
}
