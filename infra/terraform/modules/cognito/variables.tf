variable "application_name" {
  description = "Short application name used in Cognito resource names."
  type        = string
}

variable "environment" {
  description = "Deployment environment name."
  type        = string
}

variable "callback_urls" {
  description = "Allowed OAuth callback URLs for the SPA."
  type        = list(string)
}

variable "logout_urls" {
  description = "Allowed post-logout URLs for the SPA."
  type        = list(string)
}

variable "mfa_configuration" {
  description = "Cognito MFA mode: OFF, OPTIONAL, or ON."
  type        = string
  default     = "OPTIONAL"

  validation {
    condition     = contains(["OFF", "OPTIONAL", "ON"], var.mfa_configuration)
    error_message = "mfa_configuration must be OFF, OPTIONAL, or ON."
  }
}

variable "deletion_protection" {
  description = "Protect the user pool from accidental deletion."
  type        = bool
  default     = true
}

variable "tags" {
  description = "Tags applied to Cognito resources that support tags."
  type        = map(string)
  default     = {}
}
