require('dotenv').config();

const AWS_CONFIG = {
  region: process.env.AWS_REGION || 'us-east-1',
  
  // Bedrock Configuration
  bedrock: {
    modelId: process.env.BEDROCK_MODEL_ID || 'anthropic.claude-3-sonnet-20240229-v1:0',
    embeddingModelId: process.env.BEDROCK_EMBEDDING_MODEL_ID || 'amazon.titan-embed-text-v1',
    maxTokens: parseInt(process.env.BEDROCK_MAX_TOKENS) || 4000,
    temperature: parseFloat(process.env.BEDROCK_TEMPERATURE) || 0.1
  },

  // OpenSearch Configuration
  opensearch: {
    endpoint: process.env.OPENSEARCH_ENDPOINT,
    indexName: process.env.OPENSEARCH_INDEX || 'codebase-knowledge',
    vectorDimension: parseInt(process.env.VECTOR_DIMENSION) || 1536
  },

  // DynamoDB Configuration
  dynamodb: {
    sessionsTable: process.env.DYNAMODB_SESSIONS_TABLE || 'codebase-sessions',
    repositoriesTable: process.env.DYNAMODB_REPOSITORIES_TABLE || 'codebase-repositories',
    region: process.env.AWS_REGION || 'us-east-1'
  },

  // S3 Configuration
  s3: {
    bucket: process.env.S3_BUCKET || 'codebase-ai-storage',
    codePrefix: 'repositories/',
    artifactsPrefix: 'artifacts/'
  },

  // Lambda Configuration
  lambda: {
    functionName: process.env.LAMBDA_FUNCTION_NAME || 'codebase-ai-agent',
    timeout: parseInt(process.env.LAMBDA_TIMEOUT) || 300,
    memorySize: parseInt(process.env.LAMBDA_MEMORY) || 1024
  },

  // API Gateway Configuration
  apiGateway: {
    stage: process.env.API_STAGE || 'prod',
    throttling: {
      rateLimit: parseInt(process.env.API_RATE_LIMIT) || 1000,
      burstLimit: parseInt(process.env.API_BURST_LIMIT) || 2000
    }
  }
};

// Validation
const requiredEnvVars = [
  'OPENSEARCH_ENDPOINT'
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingVars.length > 0) {
  console.error('Missing required environment variables:', missingVars);
  process.exit(1);
}

module.exports = AWS_CONFIG;
