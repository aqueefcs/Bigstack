# S3 Bucket for code storage
resource "aws_s3_bucket" "codebase_storage" {
  bucket = "${var.project_name}-storage-${random_id.bucket_suffix.hex}"
  
  tags = local.common_tags
}

resource "random_id" "bucket_suffix" {
  byte_length = 4
}

resource "aws_s3_bucket_versioning" "codebase_storage" {
  bucket = aws_s3_bucket.codebase_storage.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "codebase_storage" {
  bucket = aws_s3_bucket.codebase_storage.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "codebase_storage" {
  bucket = aws_s3_bucket.codebase_storage.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}