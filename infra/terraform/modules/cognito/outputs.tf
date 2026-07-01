output "user_pool_id" {
  description = "Cognito user pool identifier."
  value       = aws_cognito_user_pool.this.id
}

output "user_pool_arn" {
  description = "Cognito user pool ARN."
  value       = aws_cognito_user_pool.this.arn
}

output "app_client_id" {
  description = "Public SPA app client identifier."
  value       = aws_cognito_user_pool_client.spa.id
}

output "issuer_url" {
  description = "OIDC issuer URL used by the API to verify JWTs."
  value       = "https://cognito-idp.${data.aws_region.current.region}.amazonaws.com/${aws_cognito_user_pool.this.id}"
}

output "login_domain" {
  description = "Cognito managed-login domain."
  value       = "https://${aws_cognito_user_pool_domain.this.domain}.auth.${data.aws_region.current.region}.amazoncognito.com"
}
