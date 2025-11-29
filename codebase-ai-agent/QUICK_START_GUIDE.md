# 🚀 Quick Start Guide - Codebase AI Agent

## TL;DR - What You Need to Know

### ✅ Good News
1. **Frontend is READY** - All files fixed, builds successfully
2. **Backend is COMPLETE** - All APIs implemented
3. **Infrastructure is READY** - Terraform scripts prepared
4. **Documentation is COMPLETE** - Everything documented

### ⚠️ Important Notes
1. **Cost**: ~$30-40/month (mainly OpenSearch at $28/month)
2. **Free Tier**: Most services free, but OpenSearch is NOT
3. **Time**: First deployment takes 2-3 hours
4. **API URL**: Frontend needs production API URL configured

---

## What This System Does

**Codebase AI Agent** helps developers understand codebases by:
1. **Ingesting** repositories (Git or local)
2. **Indexing** code into a vector database
3. **Answering** questions using AI (Claude Sonnet)
4. **Providing** context from actual code files

### Example Questions You Can Ask:
- "How do I set up this project?"
- "What is the authentication flow?"
- "How does the API work?"
- "Where is the database configuration?"

---

## Deployment Flow (Simple Explanation)

### Step 1: Setup AWS (30 min)
```
1. Create AWS account
2. Configure AWS CLI
3. Request Bedrock access (Claude Sonnet, Titan)
4. Install Terraform
```

### Step 2: Deploy Infrastructure (30-45 min)
```
1. Run: npm run setup:aws
   OR
2. Manual: cd infrastructure/terraform && terraform apply
3. Wait for OpenSearch (15-30 minutes!)
4. Save the outputs (API URL, OpenSearch endpoint, etc.)
```

### Step 3: Configure Backend (15 min)
```
1. Create .env file from env.example
2. Add the outputs from Step 2
3. Deploy Lambda function
```

### Step 4: Deploy Frontend (20 min)
```
1. Set REACT_APP_API_URL environment variable
2. Build: cd frontend && npm run build
3. Deploy to AWS Amplify or S3
```

### Step 5: Use It! (5 min)
```
1. Open frontend URL
2. Add a repository (Git URL or local path)
3. Wait for ingestion (varies by repo size)
4. Start asking questions!
```

---

## Cost Breakdown

### Monthly Costs

| Service | Cost | Free Tier? |
|---------|------|------------|
| **OpenSearch** | $28 | ❌ No |
| **Bedrock** | $4-5 | ❌ No (pay per use) |
| **Lambda** | $0 | ✅ Yes |
| **DynamoDB** | $0 | ✅ Yes |
| **S3** | $0 | ✅ Yes |
| **API Gateway** | $0 | ✅ Yes |
| **Amplify** | $0 | ✅ Yes |
| **TOTAL** | **~$32-35** | |

### How to Reduce Costs

**Option 1: Use OpenSearch Serverless** (~$5-15/month)
- Change Terraform to use serverless
- Pay only for what you use

**Option 2: Use Alternative Vector DB**
- Pinecone (free tier available)
- Weaviate Cloud (free tier)
- Qdrant Cloud (free tier)

**Option 3: Development Only**
- Use local OpenSearch (Docker)
- Deploy only Lambda + API Gateway
- **Cost: ~$5/month** (just Bedrock)

---

## What's Already Done ✅

1. ✅ Frontend files created (index.html, index.js, index.css)
2. ✅ Dependencies installed (@tailwindcss/typography)
3. ✅ Frontend builds successfully
4. ✅ Backend code complete
5. ✅ Infrastructure scripts ready
6. ✅ Config file created for API URL
7. ✅ Comprehensive documentation written

---

## What You Need to Do 🔧

### Before First Deployment:

1. **AWS Setup**
   - [ ] Create AWS account
   - [ ] Configure AWS CLI
   - [ ] Request Bedrock model access
   - [ ] Install Terraform

2. **Configuration**
   - [ ] Create `.env` file
   - [ ] Add AWS credentials
   - [ ] Deploy infrastructure
   - [ ] Get infrastructure outputs

3. **Deployment**
   - [ ] Deploy Lambda function
   - [ ] Configure frontend API URL
   - [ ] Deploy frontend
   - [ ] Test everything

4. **First Use**
   - [ ] Ingest a repository
   - [ ] Ask a question
   - [ ] Verify it works!

---

## Quick Commands Reference

```bash
# Install everything
npm install
cd frontend && npm install && cd ..

# Setup AWS infrastructure
npm run setup:aws

# Ingest a repository
npm run ingest:repo -- --name "my-repo" --path "/path/to/repo"

# Build frontend
cd frontend && npm run build

# Start local development
npm start                    # Backend (port 3000)
cd frontend && npm start     # Frontend (port 3001)
```

---

## File Structure Overview

```
codebase-ai-agent/
├── frontend/              # React frontend
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── config.js     # API configuration (NEW!)
│   │   └── App.js        # Main app
│   └── package.json
│
├── src/                  # Backend Express server
│   ├── api/              # API routes
│   ├── services/         # Core services (RAG, Bedrock, etc.)
│   └── index.js          # Server entry point
│
├── lambda/               # Lambda function (alternative backend)
│   └── index.js
│
├── infrastructure/       # Terraform scripts
│   └── terraform/
│
├── scripts/             # Utility scripts
│   ├── setup-aws-resources.js
│   └── ingest-repository.js
│
├── COMPREHENSIVE_DOCUMENTATION.md  # Full documentation
├── DEPLOYMENT_CHECKLIST.md         # Deployment checklist
└── QUICK_START_GUIDE.md            # This file!
```

---

## Common Questions

### Q: Can I use this for free?
**A**: Mostly yes! But OpenSearch costs ~$28/month. Use alternatives or local OpenSearch for development.

### Q: How long does deployment take?
**A**: First time: 2-3 hours. Subsequent deployments: 15-30 minutes.

### Q: Do I need to know Terraform?
**A**: Not really! Use `npm run setup:aws` or follow the guided setup.

### Q: What if I don't want to use AWS?
**A**: You can run locally:
- Local OpenSearch (Docker)
- Local Express server
- Only use Bedrock from AWS (~$5/month)

### Q: Is the frontend ready?
**A**: Yes! ✅ All files fixed, builds successfully. Just needs API URL for production.

### Q: Can I deploy just the frontend?
**A**: Yes, but you need the backend API running. Frontend is just the UI.

---

## Next Steps

1. **Read**: `COMPREHENSIVE_DOCUMENTATION.md` for full details
2. **Check**: `DEPLOYMENT_CHECKLIST.md` for step-by-step checklist
3. **Start**: Follow the deployment flow above
4. **Monitor**: Set up AWS Budget alerts to track costs

---

## Need Help?

1. Check `COMPREHENSIVE_DOCUMENTATION.md` - has everything!
2. Review error messages in CloudWatch
3. Verify environment variables
4. Check AWS service status

---

**You're all set!** 🎉 The codebase is ready, documentation is complete, and you have everything you need to deploy. Good luck!

