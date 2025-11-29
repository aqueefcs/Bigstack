# Store OpenSearch password in Secrets Manager
resource "aws_secretsmanager_secret" "opensearch_credentials" {
  name = "${var.project_name}-opensearch-credentials"
  tags = local.common_tags
}

resource "aws_secretsmanager_secret_version" "opensearch_credentials" {
  secret_id = aws_secretsmanager_secret.opensearch_credentials.id
  secret_string = jsonencode({
    username = "admin"
    password = random_password.opensearch_password.result
    endpoint = aws_opensearch_domain.codebase_search.endpoint
  })
}