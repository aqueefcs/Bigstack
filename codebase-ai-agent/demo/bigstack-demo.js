#!/usr/bin/env node

/**
 * Demo script for Codebase AI Agent using the Bigstack repository
 * This script demonstrates the complete workflow from ingestion to querying
 */

const path = require('path');
const axios = require('axios');
require('dotenv').config();

// Configuration
const DEMO_CONFIG = {
  repositoryName: 'bigstack',
  repositoryPath: path.join(__dirname, '../../'), // Assuming bigstack repo is in parent directory
  apiUrl: process.env.API_GATEWAY_URL || 'http://localhost:3000',
  demoQueries: [
    "How do I set up the development environment for this project?",
    "What is the overall architecture of this application?",
    "How does authentication work in this system?",
    "What are the main API endpoints and what do they do?",
    "How are questions stored and retrieved in the database?",
    "What dependencies does this project use?",
    "How do I configure the MongoDB connection?",
    "What is the user profile structure?"
  ]
};

class BigstackDemo {
  constructor() {
    this.sessionId = null;
  }

  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async checkApiHealth() {
    try {
      const response = await axios.get(`${DEMO_CONFIG.apiUrl}/health`);
      console.log('✅ API is healthy:', response.data.status);
      return true;
    } catch (error) {
      console.error('❌ API health check failed:', error.message);
      return false;
    }
  }

  async ingestRepository() {
    console.log('\n📥 Step 1: Ingesting Bigstack repository...');
    
    try {
      const response = await axios.post(`${DEMO_CONFIG.apiUrl}/api/repository/ingest`, {
        repositoryName: DEMO_CONFIG.repositoryName,
        localPath: DEMO_CONFIG.repositoryPath
      });

      if (response.data.success) {
        console.log('✅ Ingestion started:', response.data.ingestionId);
        
        // Poll for completion
        return await this.pollIngestionStatus(response.data.ingestionId);
      } else {
        throw new Error(response.data.error);
      }
    } catch (error) {
      console.error('❌ Ingestion failed:', error.response?.data?.error || error.message);
      return false;
    }
  }

  async pollIngestionStatus(ingestionId) {
    console.log('⏳ Waiting for ingestion to complete...');
    
    let attempts = 0;
    const maxAttempts = 60; // 5 minutes max
    
    while (attempts < maxAttempts) {
      try {
        const response = await axios.get(`${DEMO_CONFIG.apiUrl}/api/repository/status/${ingestionId}`);
        
        if (response.data.success) {
          const status = response.data.data.status;
          console.log(`   Status: ${status} - ${response.data.data.message}`);
          
          if (status === 'completed') {
            console.log('✅ Repository ingestion completed!');
            return true;
          } else if (status === 'failed') {
            console.error('❌ Repository ingestion failed');
            return false;
          }
        }
        
        await this.delay(5000); // Wait 5 seconds
        attempts++;
      } catch (error) {
        console.error('Error checking status:', error.message);
        attempts++;
      }
    }
    
    console.error('❌ Ingestion timeout');
    return false;
  }

  async getRepositoryStats() {
    try {
      const response = await axios.get(`${DEMO_CONFIG.apiUrl}/api/repository/${DEMO_CONFIG.repositoryName}/stats`);
      
      if (response.data.success) {
        const stats = response.data.data;
        console.log('\n📊 Repository Statistics:');
        console.log(`   Total chunks: ${stats.totalChunks}`);
        console.log(`   Total files: ${stats.totalFiles}`);
        console.log('   File types:', stats.fileTypes.map(ft => `${ft.key}(${ft.doc_count})`).join(', '));
        console.log('   Chunk types:', stats.chunkTypes.map(ct => `${ct.key}(${ct.doc_count})`).join(', '));
        return true;
      }
    } catch (error) {
      console.error('Error getting stats:', error.message);
      return false;
    }
  }

  async askQuestion(question) {
    try {
      console.log(`\n❓ Question: ${question}`);
      
      const response = await axios.post(`${DEMO_CONFIG.apiUrl}/api/chat/query`, {
        query: question,
        sessionId: this.sessionId,
        repository: DEMO_CONFIG.repositoryName
      });

      if (response.data.success) {
        const data = response.data.data;
        this.sessionId = data.sessionId;
        
        console.log(`\n🤖 Answer:`);
        console.log(data.response);
        
        if (data.sources && data.sources.length > 0) {
          console.log(`\n📚 Sources (${data.sources.length}):`);
          data.sources.slice(0, 3).forEach((source, index) => {
            console.log(`   ${index + 1}. ${source.fileName} (${Math.round(source.score * 100)}% match)`);
          });
        }
        
        return true;
      } else {
        console.error('❌ Query failed:', response.data.error);
        return false;
      }
    } catch (error) {
      console.error('❌ Error asking question:', error.response?.data?.error || error.message);
      return false;
    }
  }

  async runInteractiveDemo() {
    console.log('\n🎮 Interactive Demo Mode');
    console.log('Ask questions about the Bigstack repository (type "exit" to quit):');
    
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const askInteractiveQuestion = () => {
      rl.question('\n💬 Your question: ', async (question) => {
        if (question.toLowerCase() === 'exit') {
          console.log('\n👋 Demo ended. Thank you!');
          rl.close();
          return;
        }

        if (question.trim()) {
          await this.askQuestion(question);
        }
        
        askInteractiveQuestion();
      });
    };

    askInteractiveQuestion();
  }

  async runAutomatedDemo() {
    console.log('\n🤖 Step 3: Running automated demo queries...');
    
    for (let i = 0; i < DEMO_CONFIG.demoQueries.length; i++) {
      const question = DEMO_CONFIG.demoQueries[i];
      console.log(`\n--- Demo Query ${i + 1}/${DEMO_CONFIG.demoQueries.length} ---`);
      
      const success = await this.askQuestion(question);
      if (!success) {
        console.log('⚠️  Continuing with next question...');
      }
      
      // Small delay between questions
      await this.delay(2000);
    }
  }

  async run() {
    console.log('🚀 Codebase AI Agent - Bigstack Demo');
    console.log('=====================================\n');
    
    console.log('This demo will:');
    console.log('1. Ingest the Bigstack repository');
    console.log('2. Show repository statistics');
    console.log('3. Run sample queries');
    console.log('4. Start interactive mode');

    // Check API health
    const isHealthy = await this.checkApiHealth();
    if (!isHealthy) {
      console.log('\n💡 Make sure the API server is running:');
      console.log('   npm start');
      process.exit(1);
    }

    // Check if repository already exists
    console.log('\n🔍 Checking if repository is already ingested...');
    const statsExist = await this.getRepositoryStats();
    
    let shouldIngest = true;
    if (statsExist) {
      const readline = require('readline');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });

      shouldIngest = await new Promise((resolve) => {
        rl.question('Repository already exists. Re-ingest? (y/n): ', (answer) => {
          rl.close();
          resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
        });
      });
    }

    // Ingest repository if needed
    if (shouldIngest) {
      const ingested = await this.ingestRepository();
      if (!ingested) {
        console.log('\n❌ Demo cannot continue without successful ingestion');
        process.exit(1);
      }
    }

    // Show stats
    await this.getRepositoryStats();

    // Run automated demo
    await this.runAutomatedDemo();

    // Interactive mode
    console.log('\n🎉 Automated demo completed!');
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    rl.question('\nWould you like to try interactive mode? (y/n): ', (answer) => {
      rl.close();
      if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
        this.runInteractiveDemo();
      } else {
        console.log('\n✅ Demo completed successfully!');
        console.log('\n💡 Next steps:');
        console.log('   - Open the web interface: http://localhost:3001');
        console.log('   - Try the repository manager to add more repos');
        console.log('   - Explore the chat interface with different questions');
        process.exit(0);
      }
    });
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n👋 Demo interrupted by user');
  process.exit(0);
});

// Run the demo
const demo = new BigstackDemo();
demo.run().catch(error => {
  console.error('\n❌ Demo failed:', error);
  process.exit(1);
});
