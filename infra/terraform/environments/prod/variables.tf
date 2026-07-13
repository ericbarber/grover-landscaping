variable "aws_region" {
  description = "AWS region for production Cognito resources."
  type        = string
  default     = "us-east-1"
}

variable "application_url" {
  description = "Public HTTPS origin for the production application."
  type        = string

  validation {
    condition     = startswith(var.application_url, "https://")
    error_message = "application_url must use HTTPS."
  }
}

variable "enable_photo_storage" {
  description = "Whether to provision the production S3 bucket for direct photo evidence uploads."
  type        = bool
  default     = false
}

variable "photo_bucket_name" {
  description = "Optional explicit production photo bucket name."
  type        = string
  default     = null
}

variable "photo_key_prefix" {
  description = "S3 key prefix used by the API for production photo evidence."
  type        = string
  default     = "photos"
}

variable "photo_archive_after_days" {
  description = "Days before production photo evidence transitions to archive storage."
  type        = number
  default     = 365
}

variable "photo_archive_storage_class" {
  description = "S3 storage class used for archived production photo evidence."
  type        = string
  default     = "GLACIER_IR"
}

variable "photo_delete_after_days" {
  description = "Days before production photo evidence is deleted."
  type        = number
  default     = 2555
}

variable "photo_noncurrent_delete_after_days" {
  description = "Days before noncurrent production photo object versions are deleted."
  type        = number
  default     = 30
}
