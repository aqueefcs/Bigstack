#!/usr/bin/env node

const path = require('path');
const { program } = require('commander');
require('dotenv').config();

// Import our services
const CodebaseProcessor = require('../src/services/codebase-processor');
const BedrockService = require('../src/services/bedrock-service');
const OpenSearchService = require('../src/services/opensearch-service');

program
  .name('ingest-repository')
  .description('Ingest a repository into the AI agent knowledge base')
  .option('-n, --name <name>', 'Repository name')
  .option('-p, --path <path>', 'Local path to repository')
  .option('-u, --url <url>', 'Git repository URL')
  .option('-b, --branch <branch>', 'Git branch', 'main')
  .option('--dry-run', 'Perform a dry run without actually indexing')
  .parse();

const options = program.opts();

async function main() {
  console.log('🤖 Codebase AI Agent - Repository Ingestion Tool\n');

  // Validate inputs
  if (!options.name) {
    console.error('❌ Repository name is required. Use --name flag.');
    process.exit(1);
  }

  if (!options.path && !options.url) {
    console.error('❌ Either --path or --url is required.');
    process.exit(1);
  }

  console.log(`📁 Repository: ${options.name}`);
  console.log(`📍 Source: ${options.path || options.url}`);
  if (options.url) {
    console.log(`🌿 Branch: ${options.branch}`);
  }
  console.log(`🔍 Dry run: ${options.dryRun ? 'Yes' : 'No'}\n`);

  try {
    // Initialize services
    console.log('🔧 Initializing services...');
    const codebaseProcessor = new CodebaseProcessor();
    const bedrockService = new BedrockService();
    const openSearchService = new OpenSearchService();

    if (!options.dryRun) {
      // Initialize OpenSearch index
      await openSearchService.initializeIndex();
      console.log('✅ OpenSearch index ready');
    }

    let repositoryPath = options.path;

    // Clone repository if URL provided
    if (options.url && !options.path) {
      console.log('📥 Cloning repository...');
      const simpleGit = require('simple-git');
      const tempDir = path.join('/tmp', `repo-${Date.now()}`);
      
      const git = simpleGit();
      await git.clone(options.url, tempDir, ['--branch', options.branch, '--single-branch']);
      repositoryPath = tempDir;
      console.log(`✅ Repository cloned to ${tempDir}`);
    }

    // Process repository
    console.log('🔍 Processing repository files...');
    const chunks = await codebaseProcessor.processRepository(repositoryPath, options.name);
    console.log(`✅ Extracted ${chunks.length} code chunks`);

    if (options.dryRun) {
      console.log('\n📊 Dry Run Summary:');
      console.log(`   Total chunks: ${chunks.length}`);
      
      const fileTypes = {};
      const chunkTypes = {};
      
      chunks.forEach(chunk => {
        fileTypes[chunk.fileType] = (fileTypes[chunk.fileType] || 0) + 1;
        chunkTypes[chunk.type] = (chunkTypes[chunk.type] || 0) + 1;
      });

      console.log('\n   File types:');
      Object.entries(fileTypes).forEach(([type, count]) => {
        console.log(`     ${type}: ${count}`);
      });

      console.log('\n   Chunk types:');
      Object.entries(chunkTypes).forEach(([type, count]) => {
        console.log(`     ${type}: ${count}`);
      });

      console.log('\n✅ Dry run completed. Use without --dry-run to actually ingest.');
      return;
    }

    // Generate embeddings and index chunks
    console.log('🧠 Generating embeddings and indexing...');
    let processedCount = 0;
    const batchSize = 5; // Process in smaller batches to avoid rate limits

    for (let i = 0; i < chunks.length; i += batchSize) {
      const batch = chunks.slice(i, i + batchSize);
      
      await Promise.all(batch.map(async (chunk) => {
        try {
          const embedding = await bedrockService.generateCodeEmbeddings(chunk);
          await openSearchService.indexCodeChunk(chunk, embedding);
          processedCount++;
          
          // Progress indicator
          if (processedCount % 10 === 0) {
            const progress = Math.round((processedCount / chunks.length) * 100);
            console.log(`   Progress: ${processedCount}/${chunks.length} (${progress}%)`);
          }
        } catch (error) {
          console.warn(`⚠️  Error processing chunk from ${chunk.filePath}: ${error.message}`);
        }
      }));

      // Small delay between batches to respect rate limits
      if (i + batchSize < chunks.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    console.log(`✅ Successfully indexed ${processedCount} chunks`);

    // Get repository statistics
    console.log('\n📊 Repository Statistics:');
    const stats = await openSearchService.getRepositoryStats(options.name);
    console.log(`   Total chunks: ${stats.totalChunks}`);
    console.log(`   Total files: ${stats.totalFiles}`);
    console.log(`   File types: ${stats.fileTypes.map(ft => `${ft.key}(${ft.doc_count})`).join(', ')}`);

    console.log('\n🎉 Repository ingestion completed successfully!');
    console.log('\n💡 You can now ask questions about this repository using the chat interface.');

  } catch (error) {
    console.error('\n❌ Error during ingestion:', error);
    console.error(error.stack);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n⏹️  Ingestion interrupted by user');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n\n⏹️  Ingestion terminated');
  process.exit(0);
});

// Add commander dependency if not already present
try {
  require('commander');
} catch (error) {
  console.error('❌ Missing dependency: commander');
  console.log('Please install it with: npm install commander');
  process.exit(1);
}

main().catch(error => {
  console.error('❌ Unhandled error:', error);
  process.exit(1);
});
