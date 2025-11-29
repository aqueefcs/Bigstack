#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up AWS resources for Codebase AI Agent...\n');

// Check if AWS CLI is installed
try {
  execSync('aws --version', { stdio: 'ignore' });
  console.log('✅ AWS CLI is installed');
} catch (error) {
  console.error('❌ AWS CLI is not installed. Please install it first.');
  process.exit(1);
}

// Check if Terraform is installed
try {
  execSync('terraform --version', { stdio: 'ignore' });
  console.log('✅ Terraform is installed');
} catch (error) {
  console.error('❌ Terraform is not installed. Please install it first.');
  process.exit(1);
}

// Check AWS credentials
try {
  execSync('aws sts get-caller-identity', { stdio: 'ignore' });
  console.log('✅ AWS credentials are configured');
} catch (error) {
  console.error('❌ AWS credentials are not configured. Please run "aws configure" first.');
  process.exit(1);
}

console.log('\n📋 Setup Steps:');
console.log('1. Initialize Terraform');
console.log('2. Plan infrastructure deployment');
console.log('3. Deploy AWS resources');
console.log('4. Create environment configuration');

const terraformDir = path.join(__dirname, '..', 'infrastructure', 'terraform');

try {
  // Step 1: Initialize Terraform
  console.log('\n🔧 Step 1: Initializing Terraform...');
  process.chdir(terraformDir);
  execSync('terraform init', { stdio: 'inherit' });
  console.log('✅ Terraform initialized');

  // Step 2: Plan deployment
  console.log('\n📋 Step 2: Planning infrastructure deployment...');
  execSync('terraform plan', { stdio: 'inherit' });

  // Ask for confirmation
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.question('\n❓ Do you want to proceed with the deployment? (yes/no): ', (answer) => {
    if (answer.toLowerCase() !== 'yes' && answer.toLowerCase() !== 'y') {
      console.log('❌ Deployment cancelled');
      rl.close();
      process.exit(0);
    }

    try {
      // Step 3: Deploy resources
      console.log('\n🚀 Step 3: Deploying AWS resources...');
      execSync('terraform apply -auto-approve', { stdio: 'inherit' });
      console.log('✅ AWS resources deployed successfully');

      // Step 4: Get outputs and create environment file
      console.log('\n📝 Step 4: Creating environment configuration...');
      const outputs = JSON.parse(execSync('terraform output -json', { encoding: 'utf8' }));
      
      const envContent = `# Codebase AI Agent Environment Configuration
# Generated automatically by setup script

# AWS Configuration
AWS_REGION=us-east-1

# API Gateway
API_GATEWAY_URL=${outputs.api_gateway_url.value}

# OpenSearch Configuration
OPENSEARCH_ENDPOINT=${outputs.opensearch_endpoint.value}
OPENSEARCH_CREDENTIALS_SECRET=${outputs.opensearch_credentials_secret_name.value}

# DynamoDB Tables
DYNAMODB_SESSIONS_TABLE=codebase-ai-agent-sessions
DYNAMODB_REPOSITORIES_TABLE=codebase-ai-agent-repositories

# S3 Configuration
S3_BUCKET=${outputs.s3_bucket_name.value}

# Bedrock Configuration
BEDROCK_MODEL_ID=anthropic.claude-3-sonnet-20240229-v1:0
BEDROCK_EMBEDDING_MODEL_ID=amazon.titan-embed-text-v1
BEDROCK_MAX_TOKENS=4000
BEDROCK_TEMPERATURE=0.1

# OpenSearch Configuration
OPENSEARCH_INDEX=codebase-knowledge
VECTOR_DIMENSION=1536

# Application Configuration
NODE_ENV=production
PORT=3000
`;

      const envPath = path.join(__dirname, '..', '.env');
      fs.writeFileSync(envPath, envContent);
      console.log('✅ Environment configuration created at .env');

      // Create deployment summary
      console.log('\n🎉 Setup completed successfully!');
      console.log('\n📊 Deployment Summary:');
      console.log(`   API Gateway URL: ${outputs.api_gateway_url.value}`);
      console.log(`   OpenSearch Endpoint: ${outputs.opensearch_endpoint.value}`);
      console.log(`   S3 Bucket: ${outputs.s3_bucket_name.value}`);
      console.log(`   Lambda Function: ${outputs.lambda_function_name.value}`);

      console.log('\n🔑 Next Steps:');
      console.log('1. Deploy your Lambda function code:');
      console.log('   npm run deploy:lambda');
      console.log('');
      console.log('2. Start ingesting your first repository:');
      console.log('   npm run ingest:repo -- --name "your-repo" --path "/path/to/repo"');
      console.log('');
      console.log('3. Start the development server:');
      console.log('   npm start');
      console.log('');
      console.log('4. Access the application:');
      console.log(`   Frontend: http://localhost:3000`);
      console.log(`   API: ${outputs.api_gateway_url.value}`);

    } catch (error) {
      console.error('\n❌ Error during deployment:', error.message);
      process.exit(1);
    }

    rl.close();
  });

} catch (error) {
  console.error('\n❌ Error during setup:', error.message);
  process.exit(1);
}
