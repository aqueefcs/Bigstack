# OpenSearch Domain
resource "aws_opensearch_domain" "codebase_search" {
  domain_name    = "${var.project_name}-search"
  engine_version = "OpenSearch_2.3"

  cluster_config {
    instance_type  = "t3.small.search"
    instance_count = 1
  }

  ebs_options {
    ebs_enabled = true
    volume_type = "gp3"
    volume_size = 20
  }

  encrypt_at_rest {
    enabled = true
  }

  node_to_node_encryption {
    enabled = true
  }

  domain_endpoint_options {
    enforce_https = true
  }

  advanced_security_options {
    enabled                        = true
    anonymous_auth_enabled         = false
    internal_user_database_enabled = true
    master_user_options {
      master_user_name     = "admin"
      master_user_password = random_password.opensearch_password.result
    }
  }

  tags = local.common_tags
}

resource "random_password" "opensearch_password" {
  length  = 16
  special = true
}