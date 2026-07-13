data "aws_region" "current" {}

locals {
  resource_name = "${var.application_name}-${var.environment}-photos"
  bucket_name   = coalesce(var.bucket_name, local.resource_name)
  key_prefix    = trimsuffix(trim(var.key_prefix, "/"), "/")
}

resource "aws_s3_bucket" "this" {
  bucket = local.bucket_name

  tags = merge(var.tags, {
    Application = var.application_name
    Environment = var.environment
    ManagedBy   = "terraform"
    DataClass   = "photo-evidence"
  })
}

resource "aws_s3_bucket_public_access_block" "this" {
  bucket = aws_s3_bucket.this.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_ownership_controls" "this" {
  bucket = aws_s3_bucket.this.id

  rule {
    object_ownership = "BucketOwnerEnforced"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "this" {
  bucket = aws_s3_bucket.this.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_versioning" "this" {
  bucket = aws_s3_bucket.this.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_cors_configuration" "this" {
  bucket = aws_s3_bucket.this.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "HEAD", "PUT"]
    allowed_origins = var.cors_allowed_origins
    expose_headers  = ["ETag"]
    max_age_seconds = 300
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "this" {
  bucket = aws_s3_bucket.this.id

  rule {
    id     = "abort-incomplete-photo-uploads"
    status = "Enabled"

    filter {
      prefix = local.key_prefix
    }

    abort_incomplete_multipart_upload {
      days_after_initiation = 1
    }
  }

  rule {
    id     = "archive-and-expire-photo-evidence"
    status = "Enabled"

    filter {
      prefix = local.key_prefix
    }

    transition {
      days          = var.archive_after_days
      storage_class = var.archive_storage_class
    }

    expiration {
      days = var.delete_after_days
    }

    noncurrent_version_expiration {
      noncurrent_days = var.noncurrent_delete_after_days
    }
  }
}
