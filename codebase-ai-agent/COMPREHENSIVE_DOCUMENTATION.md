# 📚 Codebase AI Agent - Comprehensive Documentation

## Table of Contents
1. [Project Overview](#project-overview)
2. [System Architecture](#system-architecture)
3. [Complete Workflow & Logic](#complete-workflow--logic)
4. [Frontend Analysis & Deployment Readiness](#frontend-analysis--deployment-readiness)
5. [Deployment Guide](#deployment-guide)
6. [AWS Cost Analysis](#aws-cost-analysis)
7. [Free Tier Strategy](#free-tier-strategy)
8. [Step-by-Step Deployment Instructions](#step-by-step-deployment-instructions)
9. [Troubleshooting](#troubleshooting)

---

## Project Overview

**Codebase AI Agent** is an intelligent AI-powered system that helps developers understand codebases through natural language queries. It uses Retrieval-Augmented Generation (RAG) to provide accurate, context-aware answers about code repositories.

### Key Features
- 🤖 AI-powered codebase understanding using Claude Sonnet
- 🔍 Semantic search across code repositories
- 💬 Interactive chat interface
- 📁 Multi-repository support
- 🔄 Automatic code ingestion and indexing
- 📊 Repository statistics and analytics

---

## System Architecture

### High-Level Architecture

```
┌─────────────────┐
│   React Frontend │  (User Interface)
│   (Port 3001)   │
└────────┬────────┘
         │ HTTP/REST
         ▼
┌─────────────────┐
│  API Gateway     │  (AWS API Gateway)
│  / Lambda        │
└────────┬────────┘
         │
    ┌────┴────┬──────────┬──────────┐
    ▼         ▼          ▼          ▼
┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐
│Bedrock │ │OpenSearch│ │DynamoDB│ │   S3   │
│  LLM   │ │  Vector  │ │ Sessions│ │ Storage│
└────────┘ └────────┘ └────────┘ └────────┘
```

### Component Breakdown

#### 1. **Frontend (React Application)**
- **Location**: `frontend/`
- **Technology**: React 18, Tailwind CSS, React Router
- **Components**:
  - `ChatInterface.js` - Main chat UI
  - `RepositoryManager.js` - Repository management
  - `Sidebar.js` - Navigation sidebar
  - `Header.js` - Application header

#### 2. **Backend API**
- **Location**: `src/` (Express server) or `lambda/` (Lambda function)
- **Technology**: Node.js, Express.js
- **Endpoints**:
  - `/api/chat/*` - Chat and query endpoints
  - `/api/repository/*` - Repository management

#### 3. **Core Services**
- **RAG Service** (`src/services/rag-service.js`): Orchestrates query processing
- **Bedrock Service** (`src/services/bedrock-service.js`): LLM and embeddings
- **OpenSearch Service** (`src/services/opensearch-service.js`): Vector search
- **Codebase Processor** (`src/services/codebase-processor.js`): Code parsing and chunking

#### 4. **AWS Infrastructure**
- **Amazon Bedrock**: LLM inference (Claude Sonnet) and embeddings (Titan)
- **Amazon OpenSearch**: Vector database for semantic search
- **AWS Lambda**: Serverless API execution
- **Amazon API Gateway**: REST API endpoints
- **Amazon DynamoDB**: Session and repository metadata storage
- **Amazon S3**: Code storage and artifacts

---

## Complete Workflow & Logic

### 1. Repository Ingestion Flow

```
User adds repository
    │
    ▼
┌─────────────────────────┐
│ Repository Ingestion    │
│ (POST /api/repository/  │
│  ingest)                │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ 1. Clone/Read Repository │
│    - Git clone or local │
│    - Validate structure  │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ 2. Process Files        │
│    - Scan directory     │
│    - Respect .gitignore │
│    - Extract chunks:    │
│      • Functions        │
│      • Classes          │
│      • Routes           │
│      • Documentation    │
│      • Configuration    │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ 3. Generate Embeddings  │
│    - Use Bedrock Titan  │
│    - Create 1536-dim    │
│      vectors            │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ 4. Index in OpenSearch  │
│    - Store chunks       │
│    - Store embeddings   │
│    - Store metadata     │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ 5. Save Metadata        │
│    - DynamoDB           │
│    - Repository info     │
│    - Statistics         │
└─────────────────────────┘
```

### 2. Query Processing Flow (RAG)

```
User asks question
    │
    ▼
┌─────────────────────────┐
│ 1. Generate Query       │
│    Embedding            │
│    - Bedrock Titan      │
│    - 1536 dimensions    │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ 2. Hybrid Search        │
│    - Vector search      │
│    - Text search        │
│    - Repository filter  │
│    - Top 15 results     │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ 3. Filter & Rank        │
│    - Relevance scoring  │
│    - Query intent       │
│    - Boost factors:     │
│      • Setup queries →  │
│        README/package   │
│      • API queries →    │
│        routes files     │
│      • Auth queries →   │
│        auth files       │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ 4. Build Context        │
│    - Top 8 chunks       │
│    - Format with        │
│      file paths         │
│    - Include metadata   │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ 5. Generate Response    │
│    - Claude Sonnet      │
│    - Context + History  │
│    - System prompt      │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ 6. Update Session       │
│    - Save to DynamoDB   │
│    - Conversation hist  │
│    - Return response    │
└─────────────────────────┘
```

### 3. Code Processing Logic

The `CodebaseProcessor` extracts different types of chunks:

#### File Types Supported
- **Code Files**: `.js`, `.ts`, `.py`, `.java`, `.go`, `.rs`, etc.
- **Documentation**: `.md`, `.txt`
- **Configuration**: `.json`, `.yaml`, `.yml`
- **Other**: `.html`, `.css`, `.sql`, `.sh`, `.tf`

#### Chunk Types Extracted

1. **File Overview**
   - Total lines
   - Imports/dependencies
   - Top comments
   - File preview (first 30 lines)

2. **Functions**
   - Detected via regex patterns
   - Function name extraction
   - Complete function body
   - Line numbers

3. **Classes**
   - Class/interface definitions
   - Class name extraction
   - Complete class body

4. **Routes**
   - API endpoints (Express, FastAPI, etc.)
   - HTTP methods
   - Route paths

5. **Documentation Sections**
   - Markdown headers as sections
   - Section content

6. **Configuration**
   - Entire JSON/YAML files
   - Structured data

### 4. RAG Service Logic

#### Query Intent Analysis
The system analyzes query intent to improve relevance:

- **Setup Intent**: `['setup', 'install', 'configure', 'environment']`
- **Architecture Intent**: `['architecture', 'structure', 'design']`
- **API Intent**: `['api', 'endpoint', 'route']`
- **Database Intent**: `['database', 'model', 'schema']`
- **Auth Intent**: `['auth', 'login', 'user']`
- **Deployment Intent**: `['deploy', 'build', 'production']`

#### Relevance Boosting
- Setup queries boost README.md and package.json files
- API queries boost route files
- Database queries boost model files
- Auth queries boost authentication-related files

#### Context Building
- Combines top 8 most relevant chunks
- Includes file paths, function names, line numbers
- Limits chunk content to 1000 characters
- Formats as markdown for LLM

---

## Frontend Analysis & Deployment Readiness

### ✅ Current Status: **READY FOR DEPLOYMENT**

### Frontend Configuration Analysis

#### 1. **Dependencies** ✅
- All required packages installed
- `@tailwindcss/typography` added (was missing, now fixed)
- React 18.2.0
- React Router 6.8.0
- Tailwind CSS 3.3.6

#### 2. **Build Configuration** ✅
- `package.json` has build script: `npm run build`
- React Scripts configured
- Tailwind config present
- PostCSS configured

#### 3. **API Integration** ⚠️ **NEEDS CONFIGURATION**

**Current State:**
- Frontend uses relative paths: `/api/chat/query`, `/api/repository/list`
- `package.json` has proxy: `"proxy": "http://localhost:3000"`
- This works for local development but needs configuration for production

**For Production Deployment:**
You need to configure the API URL. Options:

**Option A: Environment Variable (Recommended)**
```javascript
// In frontend/src, create a config file
const API_URL = process.env.REACT_APP_API_URL || '/api';
```

**Option B: Build-time Configuration**
```javascript
// Use environment variable in fetch calls
const API_URL = process.env.REACT_APP_API_URL || '';
fetch(`${API_URL}/api/chat/query`, ...)
```

**Option C: Reverse Proxy**
- Deploy frontend and backend on same domain
- Use API Gateway or load balancer to route `/api/*` to backend

#### 4. **Missing Files** ✅ **FIXED**
- ✅ `public/index.html` - Created
- ✅ `src/index.js` - Created
- ✅ `src/index.css` - Created

#### 5. **Component Structure** ✅
- All components present and functional
- Routing configured
- State management implemented

### Deployment Checklist

- [x] All dependencies installed
- [x] Build script works (`npm run build`)
- [x] Missing files created
- [ ] API URL configuration for production
- [ ] Environment variables set
- [ ] CORS configured on backend
- [ ] HTTPS/SSL certificate
- [ ] Error handling tested

---

## Deployment Guide

### Prerequisites

1. **AWS Account** (with Free Tier eligibility)
2. **Node.js 18+** installed
3. **AWS CLI** configured (`aws configure`)
4. **Terraform** installed (for infrastructure)
5. **Git** installed

### Deployment Options

#### Option 1: Full AWS Deployment (Production)

**Infrastructure Setup:**
```bash
# 1. Navigate to infrastructure
cd infrastructure/terraform

# 2. Initialize Terraform
terraform init

# 3. Review plan
terraform plan

# 4. Deploy infrastructure
terraform apply
```

**Backend Deployment:**
```bash
# 1. Install dependencies
npm install

# 2. Build Lambda package
cd lambda
npm install --production
cd ..
zip -r lambda-deployment.zip lambda/

# 3. Deploy Lambda
aws lambda update-function-code \
  --function-name codebase-ai-agent \
  --zip-file fileb://lambda-deployment.zip
```

**Frontend Deployment:**
```bash
# Option A: AWS Amplify (Recommended)
# 1. Push code to Git repository
# 2. Connect repository in AWS Amplify Console
# 3. Configure build settings:
#    Build command: cd frontend && npm install && npm run build
#    Output directory: frontend/build
# 4. Add environment variable:
#    REACT_APP_API_URL=https://your-api-gateway-url.amazonaws.com/prod

# Option B: S3 + CloudFront
cd frontend
npm run build
aws s3 sync build/ s3://your-bucket-name --delete
aws cloudfront create-invalidation --distribution-id YOUR_DIST_ID --paths "/*"
```

#### Option 2: Local Development Setup

**Backend:**
```bash
# 1. Install dependencies
npm install

# 2. Create .env file from env.example
cp env.example .env
# Edit .env with your AWS credentials

# 3. Start backend server
npm start
# Runs on http://localhost:3000
```

**Frontend:**
```bash
# 1. Navigate to frontend
cd frontend

# 2. Install dependencies
npm install

# 3. Start development server
npm start
# Runs on http://localhost:3001
# Proxy configured to backend on :3000
```

---

## AWS Cost Analysis

### Service Breakdown

#### 1. **Amazon Bedrock** 💰 **Variable Cost**

**Claude Sonnet 3:**
- Input: $3.00 per 1M input tokens
- Output: $15.00 per 1M output tokens
- **Estimated per query**: ~$0.001-0.01 (depends on context size)

**Titan Embeddings:**
- $0.10 per 1M tokens
- **Estimated per embedding**: ~$0.0001

**Monthly Estimate (100 queries/day):**
- Queries: 3,000/month
- Input tokens: ~500K/month = $1.50
- Output tokens: ~200K/month = $3.00
- Embeddings: ~10K/month = $0.001
- **Total: ~$4.50/month**

#### 2. **Amazon OpenSearch** 💰 **Fixed + Variable**

**t3.small.search Instance:**
- Instance: ~$0.036/hour = **$26/month** (24/7)
- EBS Storage (20GB): ~$2/month
- **Total: ~$28/month**

**Note**: OpenSearch is the most expensive component and NOT in free tier.

#### 3. **AWS Lambda** ✅ **Free Tier**

**Free Tier:**
- 1M requests/month FREE
- 400,000 GB-seconds compute FREE

**Beyond Free Tier:**
- $0.20 per 1M requests
- $0.0000166667 per GB-second

**Estimated Cost**: $0/month (within free tier for small usage)

#### 4. **Amazon DynamoDB** ✅ **Free Tier**

**Free Tier:**
- 25 GB storage FREE
- 25 read capacity units FREE
- 25 write capacity units FREE

**Beyond Free Tier:**
- Storage: $0.25/GB/month
- Read: $0.25 per million reads
- Write: $1.25 per million writes

**Estimated Cost**: $0/month (within free tier)

#### 5. **Amazon S3** ✅ **Free Tier**

**Free Tier:**
- 5 GB storage FREE
- 20,000 GET requests FREE
- 2,000 PUT requests FREE

**Beyond Free Tier:**
- Storage: $0.023/GB/month
- Requests: $0.0004 per 1,000 GET requests

**Estimated Cost**: $0/month (within free tier)

#### 6. **API Gateway** ✅ **Free Tier**

**Free Tier:**
- 1M API calls/month FREE (first 12 months)

**Beyond Free Tier:**
- $3.50 per million requests

**Estimated Cost**: $0/month (within free tier)

#### 7. **AWS Amplify** ✅ **Free Tier**

**Free Tier:**
- 1,000 build minutes/month FREE
- 5 GB storage FREE
- 15 GB data transfer FREE

**Beyond Free Tier:**
- Build: $0.01 per build minute
- Storage: $0.023/GB/month
- Transfer: $0.15/GB

**Estimated Cost**: $0/month (within free tier)

### Total Monthly Cost Estimate

#### **Free Tier Scenario** (First 12 months)
- Bedrock: ~$4.50
- OpenSearch: **$28.00** ⚠️ (NOT free)
- Lambda: $0
- DynamoDB: $0
- S3: $0
- API Gateway: $0
- Amplify: $0

**Total: ~$32.50/month**

#### **After Free Tier Expires**
- Bedrock: ~$4.50
- OpenSearch: $28.00
- Lambda: ~$0.50 (if usage increases)
- DynamoDB: ~$1-2
- S3: ~$0.50
- API Gateway: ~$1-2
- Amplify: ~$1-2

**Total: ~$37-40/month**

---

## Free Tier Strategy

### How to Minimize Costs

#### 1. **OpenSearch Cost Reduction** ⚠️ **CRITICAL**

OpenSearch is the biggest cost. Options:

**Option A: Use Smaller Instance (Not Recommended)**
- t3.small.search is minimum for production
- Smaller instances may not work well

**Option B: Use OpenSearch Serverless (Recommended)**
- Pay per use model
- No fixed instance costs
- Better for variable workloads
- **Estimated: $5-15/month** (depends on usage)

**Option C: Use Alternative Vector DB**
- **Pinecone**: Free tier available (100K vectors)
- **Weaviate Cloud**: Free tier available
- **Qdrant Cloud**: Free tier available
- **Milvus**: Self-hosted option

**Option D: Development Only - Use Local**
- Run OpenSearch locally using Docker
- Only deploy to AWS for production
- **Cost: $0**

#### 2. **Bedrock Cost Optimization**

- Use smaller context windows when possible
- Cache common queries
- Batch embedding generation
- Use cheaper models for simple queries

#### 3. **Lambda Optimization**

- Optimize function memory allocation
- Use provisioned concurrency only if needed
- Monitor and optimize cold starts

#### 4. **S3 Optimization**

- Enable lifecycle policies
- Compress stored files
- Use appropriate storage classes

### Recommended Free Tier Setup

**For Development/Testing:**
1. Use local OpenSearch (Docker)
2. Use AWS Bedrock (pay per use)
3. Use AWS Lambda (free tier)
4. Use DynamoDB (free tier)
5. Use S3 (free tier)
6. **Total: ~$5-10/month** (just Bedrock usage)

**For Production (Minimal):**
1. Use OpenSearch Serverless or alternative
2. Use all other services in free tier
3. **Total: ~$10-20/month**

---

## Step-by-Step Deployment Instructions

### Phase 1: Initial Setup

#### Step 1: AWS Account Setup
```bash
# 1. Create AWS account (if not exists)
# 2. Configure AWS CLI
aws configure
# Enter:
# - AWS Access Key ID
# - AWS Secret Access Key
# - Default region: us-east-1
# - Default output: json

# 3. Verify configuration
aws sts get-caller-identity
```

#### Step 2: Install Prerequisites
```bash
# Install Terraform
# Windows: Download from terraform.io
# Or use Chocolatey: choco install terraform

# Verify installation
terraform --version
```

#### Step 3: Clone and Setup Project
```bash
# Navigate to project
cd "D:\AI Agent\Bigstack\codebase-ai-agent"

# Install root dependencies
npm install

# Install frontend dependencies
cd frontend
npm install
cd ..
```

### Phase 2: Infrastructure Deployment

#### Step 4: Configure Environment
```bash
# Copy environment template
cp env.example .env

# Edit .env file with your values:
# - AWS_REGION=us-east-1
# - AWS_ACCESS_KEY_ID=your_key
# - AWS_SECRET_ACCESS_KEY=your_secret
```

#### Step 5: Deploy Infrastructure
```bash
# Option A: Use setup script
npm run setup:aws

# Option B: Manual Terraform
cd infrastructure/terraform
terraform init
terraform plan
terraform apply
```

**Important**: This will create:
- OpenSearch domain (~$28/month)
- DynamoDB tables
- S3 bucket
- Lambda function
- API Gateway
- IAM roles

**Note**: OpenSearch takes 15-30 minutes to create!

#### Step 6: Get Infrastructure Outputs
```bash
# After terraform apply completes
terraform output

# Save these values:
# - api_gateway_url
# - opensearch_endpoint
# - s3_bucket_name
# - lambda_function_name
```

### Phase 3: Backend Deployment

#### Step 7: Update Environment Variables
```bash
# Update .env with terraform outputs
# Edit .env file:
OPENSEARCH_ENDPOINT=https://your-opensearch-domain.us-east-1.es.amazonaws.com
API_GATEWAY_URL=https://your-api-id.execute-api.us-east-1.amazonaws.com/prod
S3_BUCKET=your-bucket-name
```

#### Step 8: Deploy Lambda Function
```bash
# Build Lambda package
cd lambda
npm install --production
cd ..
zip -r lambda-deployment.zip lambda/

# Deploy to Lambda
aws lambda update-function-code \
  --function-name codebase-ai-agent \
  --zip-file fileb://lambda-deployment.zip

# Update environment variables
aws lambda update-function-configuration \
  --function-name codebase-ai-agent \
  --environment Variables="{
    OPENSEARCH_ENDPOINT=your-endpoint,
    BEDROCK_MODEL_ID=anthropic.claude-3-sonnet-20240229-v1:0,
    ...
  }"
```

### Phase 4: Frontend Deployment

#### Step 9: Configure Frontend API URL

**Create `frontend/.env` file:**
```bash
REACT_APP_API_URL=https://your-api-gateway-url.amazonaws.com/prod
```

**Update frontend code to use environment variable:**

Create `frontend/src/config.js`:
```javascript
const config = {
  apiUrl: process.env.REACT_APP_API_URL || '/api'
};

export default config;
```

Update API calls in components:
```javascript
// In ChatInterface.js, RepositoryManager.js, etc.
import config from '../config';

// Change from:
fetch('/api/chat/query', ...)

// To:
fetch(`${config.apiUrl}/api/chat/query`, ...)
```

#### Step 10: Deploy Frontend

**Option A: AWS Amplify (Recommended)**
```bash
# 1. Push code to Git repository (GitHub, GitLab, etc.)

# 2. Go to AWS Amplify Console
# 3. Click "New app" > "Host web app"
# 4. Connect your repository
# 5. Configure build settings:
#    Build command: cd frontend && npm install && npm run build
#    Output directory: frontend/build
# 6. Add environment variable:
#    REACT_APP_API_URL=https://your-api-gateway-url
# 7. Deploy
```

**Option B: S3 + CloudFront**
```bash
# 1. Build frontend
cd frontend
npm run build

# 2. Create S3 bucket
aws s3 mb s3://your-frontend-bucket-name

# 3. Upload build files
aws s3 sync build/ s3://your-frontend-bucket-name --delete

# 4. Enable static website hosting
aws s3 website s3://your-frontend-bucket-name \
  --index-document index.html \
  --error-document index.html

# 5. Create CloudFront distribution (optional, for HTTPS)
# Use AWS Console or CloudFormation
```

### Phase 5: Initial Repository Ingestion

#### Step 11: Ingest Your First Repository
```bash
# Option A: Using CLI script
npm run ingest:repo -- \
  --name "my-repo" \
  --path "/path/to/local/repo"

# Option B: Using API
curl -X POST https://your-api-url/api/repository/ingest \
  -H "Content-Type: application/json" \
  -d '{
    "repositoryName": "my-repo",
    "repositoryUrl": "https://github.com/user/repo.git",
    "branch": "main"
  }'

# Option C: Using Frontend UI
# Navigate to /repositories page
# Click "Add Repository"
# Enter repository details
```

### Phase 6: Testing

#### Step 12: Test the System
```bash
# 1. Test API health
curl https://your-api-url/health

# 2. Test chat endpoint
curl -X POST https://your-api-url/api/chat/query \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What is the project structure?",
    "repository": "my-repo"
  }'

# 3. Test frontend
# Open frontend URL in browser
# Try asking a question
```

---

## Troubleshooting

### Common Issues

#### 1. **Frontend Can't Connect to API**

**Symptoms**: CORS errors, network errors

**Solutions**:
- Check API Gateway CORS configuration
- Verify `REACT_APP_API_URL` environment variable
- Check API Gateway deployment stage
- Verify Lambda function is deployed

#### 2. **OpenSearch Connection Errors**

**Symptoms**: "Cannot connect to OpenSearch"

**Solutions**:
- Verify OpenSearch endpoint in `.env`
- Check OpenSearch security group allows Lambda access
- Verify IAM role has OpenSearch permissions
- Check OpenSearch domain status (takes 15-30 min to create)

#### 3. **Bedrock Access Denied**

**Symptoms**: "AccessDeniedException" from Bedrock

**Solutions**:
- Request Bedrock access in AWS Console
- Go to: AWS Console > Bedrock > Model access
- Request access to Claude Sonnet and Titan models
- Wait for approval (usually instant)

#### 4. **Lambda Timeout**

**Symptoms**: Lambda function times out

**Solutions**:
- Increase Lambda timeout (max 15 minutes)
- Increase Lambda memory (helps with CPU)
- Optimize code processing
- Use Step Functions for long-running tasks

#### 5. **High Costs**

**Symptoms**: Unexpected AWS charges

**Solutions**:
- Set up AWS Budget alerts
- Monitor CloudWatch metrics
- Use OpenSearch Serverless instead of managed
- Consider alternative vector DB
- Review Bedrock usage

#### 6. **Build Failures**

**Symptoms**: Frontend build fails

**Solutions**:
- Check Node.js version (18+)
- Clear node_modules and reinstall
- Check for missing dependencies
- Verify environment variables

---

## Summary & Recommendations

### ✅ What's Ready
1. **Frontend**: Fully functional, ready for deployment
2. **Backend**: Complete API implementation
3. **Infrastructure**: Terraform scripts ready
4. **Documentation**: Comprehensive (this file!)

### ⚠️ What Needs Attention
1. **API URL Configuration**: Frontend needs production API URL
2. **OpenSearch Costs**: Biggest expense, consider alternatives
3. **CORS Configuration**: Ensure API Gateway CORS is set
4. **Environment Variables**: Properly configure for production

### 🎯 Recommended Next Steps

1. **For Development**:
   - Use local OpenSearch (Docker)
   - Deploy only Lambda + API Gateway
   - Use free tier services
   - **Cost: ~$5/month**

2. **For Production**:
   - Use OpenSearch Serverless or alternative
   - Deploy full infrastructure
   - Set up monitoring and alerts
   - **Cost: ~$15-30/month**

3. **For Cost Optimization**:
   - Consider Pinecone/Weaviate for vector DB
   - Use Bedrock only when needed
   - Implement caching
   - Monitor usage closely

### 📊 Final Cost Estimate

**Minimum Viable Setup**: ~$5-10/month
**Full Production Setup**: ~$30-40/month
**Optimized Setup**: ~$15-20/month

---

## Additional Resources

- **AWS Bedrock Pricing**: https://aws.amazon.com/bedrock/pricing/
- **OpenSearch Pricing**: https://aws.amazon.com/opensearch-service/pricing/
- **Lambda Pricing**: https://aws.amazon.com/lambda/pricing/
- **Terraform Docs**: https://www.terraform.io/docs

---

**Document Version**: 1.0  
**Last Updated**: 2024  
**Maintained By**: Codebase AI Agent Team

