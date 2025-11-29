# Outputs
output "api_gateway_url" {
  description = "URL of the API Gateway"
  value       = aws_api_gateway_deployment.codebase_api.invoke_url
}

output "opensearch_endpoint" {
  description = "OpenSearch domain endpoint"
  value       = aws_opensearch_domain.codebase_search.endpoint
}

output "s3_bucket_name" {
  description = "Name of the S3 bucket"
  value       = aws_s3_bucket.codebase_storage.bucket
}

output "lambda_function_name" {
  description = "Name of the Lambda function"
  value       = aws_lambda_function.codebase_ai_agent.function_name
}

output "opensearch_credentials_secret_name" {
  description = "Name of the Secrets Manager secret for OpenSearch credentials"
  value       = aws_secretsmanager_secret.opensearch_credentials.name
}