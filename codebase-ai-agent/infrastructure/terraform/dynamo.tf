# DynamoDB Tables
resource "aws_dynamodb_table" "sessions" {
  name           = "${var.project_name}-sessions"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "sessionId"

  attribute {
    name = "sessionId"
    type = "S"
  }

  ttl {
    attribute_name = "ttl"
    enabled        = true
  }

  tags = local.common_tags
}

resource "aws_dynamodb_table" "repositories" {
  name           = "${var.project_name}-repositories"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "repositoryName"

  attribute {
    name = "repositoryName"
    type = "S"
  }

  tags = local.common_tags
}

resource "aws_dynamodb_table" "ingestions" {
  name           = "${var.project_name}-ingestions"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "ingestionId"

  attribute {
    name = "ingestionId"
    type = "S"
  }

  ttl {
    attribute_name = "ttl"
    enabled        = true
  }

  tags = local.common_tags
}