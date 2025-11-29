# Lambda Function
resource "aws_lambda_function" "codebase_ai_agent" {
  filename         = "lambda-deployment.zip"
  function_name    = var.project_name
  role            = aws_iam_role.lambda_role.arn
  handler         = "index.handler"
  runtime         = "nodejs18.x"
  timeout         = 300
  memory_size     = 1024

  environment {
    variables = {
      AWS_REGION                    = data.aws_region.current.name
      OPENSEARCH_ENDPOINT          = "https://${aws_opensearch_domain.codebase_search.endpoint}"
      OPENSEARCH_CREDENTIALS_SECRET = aws_secretsmanager_secret.opensearch_credentials.name
      DYNAMODB_SESSIONS_TABLE      = aws_dynamodb_table.sessions.name
      DYNAMODB_REPOSITORIES_TABLE  = aws_dynamodb_table.repositories.name
      S3_BUCKET                    = aws_s3_bucket.codebase_storage.bucket
      BEDROCK_MODEL_ID             = "anthropic.claude-3-sonnet-20240229-v1:0"
      BEDROCK_EMBEDDING_MODEL_ID   = "amazon.titan-embed-text-v1"
    }
  }

  tags = local.common_tags
}

resource "aws_lambda_permission" "api_gw" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.codebase_ai_agent.function_name
  principal     = "apigateway.amazonaws.com"

  source_arn = "${aws_api_gateway_rest_api.codebase_api.execution_arn}/*/*"
}

# CloudWatch Log Groups
resource "aws_cloudwatch_log_group" "lambda_logs" {
  name              = "/aws/lambda/${aws_lambda_function.codebase_ai_agent.function_name}"
  retention_in_days = 14
  tags              = local.common_tags
}