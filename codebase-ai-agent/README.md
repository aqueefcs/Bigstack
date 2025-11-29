# 🤖 Codebase AI Agent - Developer Onboarding Assistant

An intelligent AI agent that learns from your organization's codebases and helps new developers with onboarding, setup, and understanding the architecture.

## 🏗️ Architecture

### AWS Services Used
- **Amazon Bedrock**: LLM and embeddings (Claude Sonnet, Titan Embeddings)
- **Amazon OpenSearch**: Vector database for semantic search
- **AWS Lambda**: Serverless compute for processing
- **Amazon S3**: Code storage and artifacts
- **Amazon API Gateway**: REST API endpoints
- **AWS Amplify**: Frontend hosting
- **Amazon DynamoDB**: Session and conversation storage
- **AWS Step Functions**: Workflow orchestration

### System Components
1. **Code Ingestion Pipeline**: Processes repositories and extracts knowledge
2. **Vector Database**: Stores code embeddings for semantic search
3. **RAG System**: Retrieval-Augmented Generation for accurate responses
4. **Chat Interface**: Web-based chat for developer queries
5. **Admin Dashboard**: Manage repositories and monitor usage

## 🚀 Quick Start

### Prerequisites
- AWS Account with appropriate permissions
- Node.js 18+
- AWS CLI configured
- Terraform (optional, for infrastructure)

### Deployment Steps

1. **Clone and Setup**
   ```bash
   git clone <repository>
   cd codebase-ai-agent
   npm install
   ```

2. **Configure AWS**
   ```bash
   aws configure
   # Set up your AWS credentials and region
   ```

3. **Deploy Infrastructure**
   ```bash
   cd infrastructure
   terraform init
   terraform plan
   terraform apply
   ```

4. **Deploy Application**
   ```bash
   npm run deploy
   ```

5. **Access the Application**
   - Frontend: `https://your-amplify-url.amplifyapp.com`
   - API: `https://your-api-gateway-url.amazonaws.com`

## 📖 Usage Examples

### Sample Queries for Your Bigstack Repository

1. **Setup Questions**
   - "How do I set up the development environment for this project?"
   - "What are the required dependencies and how do I install them?"
   - "How do I configure the MongoDB connection?"

2. **Architecture Questions**
   - "What is the overall architecture of this application?"
   - "How does authentication work in this system?"
   - "What are the main API endpoints and what do they do?"

3. **Code Understanding**
   - "How are questions stored and retrieved?"
   - "What is the user profile structure?"
   - "How does the JWT authentication strategy work?"

## 🔧 Configuration

### Environment Variables
```bash
AWS_REGION=us-east-1
BEDROCK_MODEL_ID=anthropic.claude-3-sonnet-20240229-v1:0
OPENSEARCH_ENDPOINT=your-opensearch-endpoint
DYNAMODB_TABLE=codebase-sessions
```

## 📊 Monitoring

- **CloudWatch Logs**: Application logs and errors
- **CloudWatch Metrics**: Usage statistics and performance
- **OpenSearch Dashboards**: Search analytics and vector store health

## 🔒 Security

- IAM roles with least privilege access
- API Gateway with authentication
- Encrypted data at rest and in transit
- Secrets Manager for sensitive configuration
