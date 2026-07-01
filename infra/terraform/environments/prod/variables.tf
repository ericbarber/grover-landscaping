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
