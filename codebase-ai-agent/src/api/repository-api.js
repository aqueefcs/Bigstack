const express = require('express');
const CodebaseProcessor = require('../services/codebase-processor');
const BedrockService = require('../services/bedrock-service');
const OpenSearchService = require('../services/opensearch-service');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, GetCommand, ScanCommand, DeleteCommand } = require('@aws-sdk/lib-dynamodb');
const AWS_CONFIG = require('../config/aws-config');
const simpleGit = require('simple-git');
const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();
const codebaseProcessor = new CodebaseProcessor();
const bedrockService = new BedrockService();
const openSearchService = new OpenSearchService();

const dynamoClient = new DynamoDBClient({ region: AWS_CONFIG.region });
const dynamoDocClient = DynamoDBDocumentClient.from(dynamoClient);

/**
 * POST /api/repository/ingest
 * Ingest a repository from Git URL or local path
 */
router.post('/ingest', async (req, res) => {
  try {
    const { repositoryUrl, repositoryName, branch = 'main', localPath } = req.body;

    if (!repositoryName) {
      return res.status(400).json({
        error: 'Repository name is required'
      });
    }

    if (!repositoryUrl && !localPath) {
      return res.status(400).json({
        error: 'Either repository URL or local path is required'
      });
    }

    const ingestionId = uuidv4();
    const tempDir = path.join('/tmp', `repo-${ingestionId}`);

    // Start ingestion process
    res.json({
      success: true,
      message: 'Repository ingestion started',
      ingestionId: ingestionId
    });

    // Process asynchronously
    processRepositoryAsync(ingestionId, repositoryUrl, repositoryName, branch, localPath, tempDir);

  } catch (error) {
    console.error('Error starting repository ingestion:', error);
    res.status(500).json({
      error: 'Internal server error while starting ingestion'
    });
  }
});

/**
 * Async function to process repository
 */
async function processRepositoryAsync(ingestionId, repositoryUrl, repositoryName, branch, localPath, tempDir) {
  try {
    console.log(`Starting ingestion ${ingestionId} for repository: ${repositoryName}`);

    // Update status to processing
    await updateIngestionStatus(ingestionId, 'processing', 'Cloning repository...');

    let repositoryPath;
    
    if (localPath) {
      repositoryPath = localPath;
    } else {
      // Clone repository
      const git = simpleGit();
      await git.clone(repositoryUrl, tempDir, ['--branch', branch, '--single-branch']);
      repositoryPath = tempDir;
    }

    // Update status
    await updateIngestionStatus(ingestionId, 'processing', 'Processing code files...');

    // Process repository
    const chunks = await codebaseProcessor.processRepository(repositoryPath, repositoryName);

    // Update status
    await updateIngestionStatus(ingestionId, 'processing', 'Generating embeddings...');

    // Generate embeddings and index chunks
    let processedCount = 0;
    const batchSize = 10;

    for (let i = 0; i < chunks.length; i += batchSize) {
      const batch = chunks.slice(i, i + batchSize);
      
      await Promise.all(batch.map(async (chunk) => {
        try {
          const embedding = await bedrockService.generateCodeEmbeddings(chunk);
          await openSearchService.indexCodeChunk(chunk, embedding);
          processedCount++;
        } catch (error) {
          console.error(`Error processing chunk from ${chunk.filePath}:`, error);
        }
      }));

      // Update progress
      const progress = Math.round((processedCount / chunks.length) * 100);
      await updateIngestionStatus(ingestionId, 'processing', `Indexing chunks... ${progress}%`);
    }

    // Save repository metadata
    await saveRepositoryMetadata(repositoryName, {
      repositoryUrl,
      branch,
      totalChunks: processedCount,
      ingestionId,
      lastUpdated: new Date().toISOString()
    });

    // Update final status
    await updateIngestionStatus(ingestionId, 'completed', `Successfully processed ${processedCount} chunks`);

    // Cleanup temp directory
    if (!localPath) {
      await fs.rmdir(tempDir, { recursive: true }).catch(console.error);
    }

    console.log(`Completed ingestion ${ingestionId} for repository: ${repositoryName}`);

  } catch (error) {
    console.error(`Error in repository ingestion ${ingestionId}:`, error);
    await updateIngestionStatus(ingestionId, 'failed', error.message);
  }
}

/**
 * GET /api/repository/status/:ingestionId
 * Get ingestion status
 */
router.get('/status/:ingestionId', async (req, res) => {
  try {
    const { ingestionId } = req.params;

    const getCommand = new GetCommand({
      TableName: 'codebase-ingestions',
      Key: { ingestionId: ingestionId }
    });

    const result = await dynamoDocClient.send(getCommand);

    if (!result.Item) {
      return res.status(404).json({
        error: 'Ingestion not found'
      });
    }

    res.json({
      success: true,
      data: result.Item
    });

  } catch (error) {
    console.error('Error getting ingestion status:', error);
    res.status(500).json({
      error: 'Internal server error while getting status'
    });
  }
});

/**
 * GET /api/repository/list
 * List all repositories
 */
router.get('/list', async (req, res) => {
  try {
    const scanCommand = new ScanCommand({
      TableName: AWS_CONFIG.dynamodb.repositoriesTable
    });

    const result = await dynamoDocClient.send(scanCommand);

    res.json({
      success: true,
      data: {
        repositories: result.Items || [],
        count: result.Count || 0
      }
    });

  } catch (error) {
    console.error('Error listing repositories:', error);
    res.status(500).json({
      error: 'Internal server error while listing repositories'
    });
  }
});

/**
 * GET /api/repository/:repositoryName/stats
 * Get repository statistics
 */
router.get('/:repositoryName/stats', async (req, res) => {
  try {
    const { repositoryName } = req.params;

    const stats = await openSearchService.getRepositoryStats(repositoryName);

    res.json({
      success: true,
      data: {
        repository: repositoryName,
        ...stats
      }
    });

  } catch (error) {
    console.error('Error getting repository stats:', error);
    res.status(500).json({
      error: 'Internal server error while getting stats'
    });
  }
});

/**
 * DELETE /api/repository/:repositoryName
 * Delete a repository and its data
 */
router.delete('/:repositoryName', async (req, res) => {
  try {
    const { repositoryName } = req.params;

    // Delete from OpenSearch
    const deletedChunks = await openSearchService.deleteRepository(repositoryName);

    // Delete from DynamoDB
    const deleteCommand = new DeleteCommand({
      TableName: AWS_CONFIG.dynamodb.repositoriesTable,
      Key: { repositoryName: repositoryName }
    });

    await dynamoDocClient.send(deleteCommand);

    res.json({
      success: true,
      message: `Repository ${repositoryName} deleted successfully`,
      deletedChunks: deletedChunks
    });

  } catch (error) {
    console.error('Error deleting repository:', error);
    res.status(500).json({
      error: 'Internal server error while deleting repository'
    });
  }
});

/**
 * POST /api/repository/search
 * Search across repositories
 */
router.post('/search', async (req, res) => {
  try {
    const { query, repository, limit = 10 } = req.body;

    if (!query) {
      return res.status(400).json({
        error: 'Search query is required'
      });
    }

    // Generate embedding for search
    const queryEmbedding = await bedrockService.generateEmbeddings(query);

    // Search
    const filters = repository ? { repository } : {};
    const results = await openSearchService.hybridSearch(
      query,
      queryEmbedding,
      limit,
      filters
    );

    res.json({
      success: true,
      data: {
        query: query,
        results: results,
        count: results.length
      }
    });

  } catch (error) {
    console.error('Error searching repositories:', error);
    res.status(500).json({
      error: 'Internal server error while searching'
    });
  }
});

/**
 * Helper function to update ingestion status
 */
async function updateIngestionStatus(ingestionId, status, message) {
  try {
    const putCommand = new PutCommand({
      TableName: 'codebase-ingestions',
      Item: {
        ingestionId: ingestionId,
        status: status,
        message: message,
        timestamp: new Date().toISOString()
      }
    });

    await dynamoDocClient.send(putCommand);
  } catch (error) {
    console.error('Error updating ingestion status:', error);
  }
}

/**
 * Helper function to save repository metadata
 */
async function saveRepositoryMetadata(repositoryName, metadata) {
  try {
    const putCommand = new PutCommand({
      TableName: AWS_CONFIG.dynamodb.repositoriesTable,
      Item: {
        repositoryName: repositoryName,
        ...metadata,
        createdAt: new Date().toISOString()
      }
    });

    await dynamoDocClient.send(putCommand);
  } catch (error) {
    console.error('Error saving repository metadata:', error);
  }
}

module.exports = router;
