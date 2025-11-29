# 🚀 Deployment Checklist

## Pre-Deployment Checklist

### ✅ Completed
- [x] Frontend dependencies installed
- [x] Missing files created (index.html, index.js, index.css)
- [x] Tailwind typography plugin installed
- [x] Frontend builds successfully (`npm run build`)
- [x] Backend code complete
- [x] Infrastructure scripts ready

### ⚠️ Required Before Production Deployment

#### Frontend Configuration
- [ ] Create `frontend/src/config.js` for API URL
- [ ] Update all API calls to use config
- [ ] Set `REACT_APP_API_URL` environment variable
- [ ] Test frontend build with production API URL
- [ ] Verify CORS is configured on backend

#### Backend Configuration
- [ ] Create `.env` file from `env.example`
- [ ] Configure AWS credentials
- [ ] Set OpenSearch endpoint
- [ ] Configure Bedrock model access
- [ ] Set DynamoDB table names
- [ ] Configure S3 bucket name

#### AWS Setup
- [ ] AWS account created
- [ ] AWS CLI configured
- [ ] Terraform installed
- [ ] Request Bedrock model access (Claude Sonnet, Titan)
- [ ] Review and understand costs (~$30-40/month)

#### Infrastructure
- [ ] Review Terraform variables
- [ ] Deploy infrastructure (takes 15-30 min)
- [ ] Save infrastructure outputs
- [ ] Verify all services are running

#### Testing
- [ ] Test API health endpoint
- [ ] Test repository ingestion
- [ ] Test chat query
- [ ] Test frontend connection to API
- [ ] Verify error handling

## Deployment Steps Summary

1. **Setup** (30 min)
   - Install prerequisites
   - Configure AWS CLI
   - Clone and install dependencies

2. **Infrastructure** (30-45 min)
   - Deploy Terraform
   - Wait for OpenSearch (15-30 min)
   - Get outputs

3. **Backend** (15 min)
   - Configure environment
   - Deploy Lambda
   - Test API

4. **Frontend** (20 min)
   - Configure API URL
   - Build and deploy
   - Test connection

5. **Ingestion** (varies)
   - Ingest first repository
   - Verify indexing

**Total Time**: ~2-3 hours for first deployment

## Cost Awareness

⚠️ **Important**: OpenSearch costs ~$28/month (not in free tier)

**Options to reduce costs**:
1. Use OpenSearch Serverless (~$5-15/month)
2. Use alternative vector DB (Pinecone, Weaviate)
3. Use local OpenSearch for development

## Quick Start Commands

```bash
# 1. Setup
npm install
cd frontend && npm install && cd ..

# 2. Configure
cp env.example .env
# Edit .env with your values

# 3. Deploy Infrastructure
cd infrastructure/terraform
terraform init
terraform apply

# 4. Deploy Backend
cd ../..
zip -r lambda-deployment.zip lambda/
aws lambda update-function-code --function-name codebase-ai-agent --zip-file fileb://lambda-deployment.zip

# 5. Deploy Frontend
cd frontend
npm run build
# Deploy to Amplify or S3
```

## Support

If you encounter issues:
1. Check COMPREHENSIVE_DOCUMENTATION.md
2. Review error logs in CloudWatch
3. Verify all environment variables
4. Check AWS service status

