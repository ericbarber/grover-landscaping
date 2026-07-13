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

output "photo_bucket_name" {
  value = var.enable_photo_storage ? module.photo_storage[0].bucket_name : null
}

output "photo_bucket_region" {
  value = var.enable_photo_storage ? module.photo_storage[0].region : null
}

output "photo_key_prefix" {
  value = var.enable_photo_storage ? module.photo_storage[0].key_prefix : null
}
