output "user_pool_id" {
  value = module.cognito.user_pool_id
}

output "app_client_id" {
  value = module.cognito.app_client_id
}

output "issuer_url" {
  value = module.cognito.issuer_url
}

output "login_domain" {
  value = module.cognito.login_domain
}
