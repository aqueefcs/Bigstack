const BedrockService = require('./bedrock-service');
const OpenSearchService = require('./opensearch-service');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand, PutCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');
const AWS_CONFIG = require('../config/aws-config');
const { v4: uuidv4 } = require('uuid');

class RAGService {
  constructor() {
    this.bedrockService = new BedrockService();
    this.openSearchService = new OpenSearchService();
    
    const dynamoClient = new DynamoDBClient({ region: AWS_CONFIG.region });
    this.dynamoDocClient = DynamoDBDocumentClient.from(dynamoClient);
  }

  /**
   * Process a user query and generate a response using RAG
   */
  async processQuery(query, sessionId, repositoryFilter = null) {
    try {
      console.log(`Processing query: ${query}`);
      
      // Get or create session
      const session = await this.getOrCreateSession(sessionId);
      
      // Generate embedding for the query
      const queryEmbedding = await this.bedrockService.generateEmbeddings(query);
      
      // Search for relevant context
      const relevantChunks = await this.searchRelevantContext(
        query, 
        queryEmbedding, 
        repositoryFilter
      );
      
      // Build context from relevant chunks
      const context = this.buildContext(relevantChunks);
      
      // Generate response using LLM
      const response = await this.bedrockService.generateResponse(
        query,
        context,
        session.conversationHistory
      );
      
      // Update session with new interaction
      await this.updateSession(sessionId, query, response, relevantChunks);
      
      return {
        response: response,
        sources: relevantChunks.map(chunk => ({
          filePath: chunk.filePath,
          fileName: chunk.fileName,
          chunkType: chunk.chunkType,
          score: chunk.score
        })),
        sessionId: sessionId
      };
    } catch (error) {
      console.error('Error processing query:', error);
      throw error;
    }
  }

  /**
   * Search for relevant context using hybrid search
   */
  async searchRelevantContext(query, queryEmbedding, repositoryFilter = null) {
    try {
      const filters = {};
      if (repositoryFilter) {
        filters.repository = repositoryFilter;
      }

      // Perform hybrid search (text + vector)
      const searchResults = await this.openSearchService.hybridSearch(
        query,
        queryEmbedding,
        15, // Get more results for better context
        filters
      );

      // Filter and rank results
      const relevantChunks = this.filterAndRankResults(searchResults, query);
      
      return relevantChunks.slice(0, 8); // Limit to top 8 most relevant chunks
    } catch (error) {
      console.error('Error searching relevant context:', error);
      throw error;
    }
  }

  /**
   * Filter and rank search results based on relevance
   */
  filterAndRankResults(searchResults, query) {
    const queryLower = query.toLowerCase();
    
    return searchResults
      .map(chunk => {
        let relevanceScore = chunk.score;
        
        // Boost scores based on query content
        if (queryLower.includes('setup') || queryLower.includes('install') || queryLower.includes('configure')) {
          if (chunk.fileName === 'package.json' || chunk.fileName === 'README.md' || chunk.chunkType === 'documentation') {
            relevanceScore *= 1.5;
          }
        }
        
        if (queryLower.includes('api') || queryLower.includes('endpoint') || queryLower.includes('route')) {
          if (chunk.filePath.includes('routes') || chunk.chunkType === 'route') {
            relevanceScore *= 1.5;
          }
        }
        
        if (queryLower.includes('database') || queryLower.includes('model') || queryLower.includes('schema')) {
          if (chunk.filePath.includes('models') || chunk.chunkType === 'class') {
            relevanceScore *= 1.5;
          }
        }
        
        if (queryLower.includes('auth') || queryLower.includes('login') || queryLower.includes('user')) {
          if (chunk.filePath.includes('auth') || chunk.content.toLowerCase().includes('auth')) {
            relevanceScore *= 1.5;
          }
        }

        return {
          ...chunk,
          adjustedScore: relevanceScore
        };
      })
      .sort((a, b) => b.adjustedScore - a.adjustedScore)
      .filter(chunk => chunk.adjustedScore > 0.3); // Filter out low-relevance results
  }

  /**
   * Build context string from relevant chunks
   */
  buildContext(relevantChunks) {
    if (relevantChunks.length === 0) {
      return "No specific codebase context found for this query.";
    }

    let context = "## Relevant Codebase Information:\n\n";
    
    relevantChunks.forEach((chunk, index) => {
      context += `### ${index + 1}. ${chunk.fileName} (${chunk.chunkType})\n`;
      context += `**File Path:** ${chunk.filePath}\n`;
      if (chunk.metadata?.functionName) {
        context += `**Function:** ${chunk.metadata.functionName}\n`;
      }
      if (chunk.metadata?.className) {
        context += `**Class:** ${chunk.metadata.className}\n`;
      }
      context += `**Content:**\n\`\`\`\n${chunk.content.substring(0, 1000)}${chunk.content.length > 1000 ? '...' : ''}\n\`\`\`\n\n`;
    });

    return context;
  }

  /**
   * Get or create a conversation session
   */
  async getOrCreateSession(sessionId) {
    try {
      if (!sessionId) {
        sessionId = uuidv4();
      }

      const getCommand = new GetCommand({
        TableName: AWS_CONFIG.dynamodb.sessionsTable,
        Key: { sessionId: sessionId }
      });

      const result = await this.dynamoDocClient.send(getCommand);
      
      if (result.Item) {
        return result.Item;
      } else {
        // Create new session
        const newSession = {
          sessionId: sessionId,
          createdAt: new Date().toISOString(),
          lastUpdated: new Date().toISOString(),
          conversationHistory: [],
          queryCount: 0
        };

        const putCommand = new PutCommand({
          TableName: AWS_CONFIG.dynamodb.sessionsTable,
          Item: newSession
        });

        await this.dynamoDocClient.send(putCommand);
        return newSession;
      }
    } catch (error) {
      console.error('Error getting/creating session:', error);
      throw error;
    }
  }

  /**
   * Update session with new interaction
   */
  async updateSession(sessionId, query, response, sources) {
    try {
      const interaction = {
        timestamp: new Date().toISOString(),
        query: query,
        response: response,
        sources: sources.map(s => ({
          filePath: s.filePath,
          fileName: s.fileName,
          score: s.score
        }))
      };

      const updateCommand = new UpdateCommand({
        TableName: AWS_CONFIG.dynamodb.sessionsTable,
        Key: { sessionId: sessionId },
        UpdateExpression: 'SET lastUpdated = :lastUpdated, queryCount = queryCount + :inc, conversationHistory = list_append(if_not_exists(conversationHistory, :empty_list), :interaction)',
        ExpressionAttributeValues: {
          ':lastUpdated': new Date().toISOString(),
          ':inc': 1,
          ':empty_list': [],
          ':interaction': [interaction]
        }
      });

      await this.dynamoDocClient.send(updateCommand);
    } catch (error) {
      console.error('Error updating session:', error);
      throw error;
    }
  }

  /**
   * Get conversation history for a session
   */
  async getConversationHistory(sessionId, limit = 10) {
    try {
      const getCommand = new GetCommand({
        TableName: AWS_CONFIG.dynamodb.sessionsTable,
        Key: { sessionId: sessionId }
      });

      const result = await this.dynamoDocClient.send(getCommand);
      
      if (result.Item && result.Item.conversationHistory) {
        return result.Item.conversationHistory.slice(-limit);
      }
      
      return [];
    } catch (error) {
      console.error('Error getting conversation history:', error);
      return [];
    }
  }

  /**
   * Generate suggested questions based on codebase
   */
  async generateSuggestedQuestions(repository) {
    try {
      // Get repository statistics
      const stats = await this.openSearchService.getRepositoryStats(repository);
      
      const suggestions = [
        "How do I set up the development environment for this project?",
        "What is the overall architecture of this application?",
        "How does authentication work in this system?",
        "What are the main API endpoints and what do they do?",
        "How do I run tests for this project?",
        "What dependencies does this project use?",
        "How is the database configured?",
        "What is the deployment process?"
      ];

      // Customize suggestions based on detected file types
      if (stats.fileTypes.some(ft => ft.key === 'javascript' || ft.key === 'typescript')) {
        suggestions.push("How do I install npm dependencies?");
        suggestions.push("What Node.js version is required?");
      }

      if (stats.fileTypes.some(ft => ft.key === 'python')) {
        suggestions.push("How do I set up a Python virtual environment?");
        suggestions.push("What Python packages are required?");
      }

      return suggestions.slice(0, 6); // Return top 6 suggestions
    } catch (error) {
      console.error('Error generating suggested questions:', error);
      return [
        "How do I set up this project?",
        "What is the project structure?",
        "How do I run the application?"
      ];
    }
  }

  /**
   * Analyze query intent to provide better responses
   */
  analyzeQueryIntent(query) {
    const queryLower = query.toLowerCase();
    
    const intents = {
      setup: ['setup', 'install', 'configure', 'environment', 'dependencies'],
      architecture: ['architecture', 'structure', 'design', 'overview', 'how does'],
      api: ['api', 'endpoint', 'route', 'request', 'response'],
      database: ['database', 'db', 'model', 'schema', 'data'],
      authentication: ['auth', 'login', 'user', 'permission', 'token'],
      deployment: ['deploy', 'build', 'production', 'docker', 'server'],
      testing: ['test', 'testing', 'spec', 'unit', 'integration'],
      troubleshooting: ['error', 'issue', 'problem', 'debug', 'fix']
    };

    for (const [intent, keywords] of Object.entries(intents)) {
      if (keywords.some(keyword => queryLower.includes(keyword))) {
        return intent;
      }
    }

    return 'general';
  }
}

module.exports = RAGService;
