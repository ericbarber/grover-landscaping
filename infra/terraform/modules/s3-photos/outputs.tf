output "bucket_name" {
  value = aws_s3_bucket.this.bucket
}

output "bucket_arn" {
  value = aws_s3_bucket.this.arn
}

output "region" {
  value = data.aws_region.current.region
}

output "key_prefix" {
  value = local.key_prefix
}
