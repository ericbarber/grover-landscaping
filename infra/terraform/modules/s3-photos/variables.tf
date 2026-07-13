variable "application_name" {
  description = "Application name used for bucket naming and tags."
  type        = string
}

variable "environment" {
  description = "Deployment environment name."
  type        = string
}

variable "bucket_name" {
  description = "Optional explicit bucket name. Defaults to application-environment-photos."
  type        = string
  default     = null
}

variable "key_prefix" {
  description = "S3 key prefix used by the application for photo evidence."
  type        = string
  default     = "photos"
}

variable "cors_allowed_origins" {
  description = "Browser origins allowed to upload and read photo evidence through presigned URLs."
  type        = list(string)
}

variable "archive_after_days" {
  description = "Days before photo evidence transitions to the archive storage class."
  type        = number
  default     = 365

  validation {
    condition     = var.archive_after_days >= 30
    error_message = "archive_after_days must be at least 30."
  }
}

variable "archive_storage_class" {
  description = "S3 storage class used for archived photo evidence."
  type        = string
  default     = "GLACIER_IR"

  validation {
    condition     = contains(["STANDARD_IA", "ONEZONE_IA", "GLACIER_IR", "GLACIER", "DEEP_ARCHIVE"], var.archive_storage_class)
    error_message = "archive_storage_class must be a supported archival S3 storage class."
  }
}

variable "delete_after_days" {
  description = "Days before current photo evidence objects expire."
  type        = number
  default     = 2555

  validation {
    condition     = var.delete_after_days > var.archive_after_days
    error_message = "delete_after_days must be greater than archive_after_days."
  }
}

variable "noncurrent_delete_after_days" {
  description = "Days before old object versions expire."
  type        = number
  default     = 30

  validation {
    condition     = var.noncurrent_delete_after_days >= 1
    error_message = "noncurrent_delete_after_days must be at least 1."
  }
}

variable "tags" {
  description = "Additional tags applied to photo storage resources."
  type        = map(string)
  default     = {}
}
