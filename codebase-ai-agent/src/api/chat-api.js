const express = require('express');
const RAGService = require('../services/rag-service');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();
const ragService = new RAGService();

/**
 * POST /api/chat/query
 * Process a user query and return AI response
 */
router.post('/query', async (req, res) => {
  try {
    const { query, sessionId, repository } = req.body;

    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return res.status(400).json({
        error: 'Query is required and must be a non-empty string'
      });
    }

    if (query.length > 1000) {
      return res.status(400).json({
        error: 'Query is too long. Maximum 1000 characters allowed.'
      });
    }

    const currentSessionId = sessionId || uuidv4();
    
    console.log(`Processing query for session ${currentSessionId}: ${query}`);

    const result = await ragService.processQuery(
      query.trim(),
      currentSessionId,
      repository
    );

    res.json({
      success: true,
      data: {
        response: result.response,
        sources: result.sources,
        sessionId: result.sessionId,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error processing chat query:', error);
    res.status(500).json({
      error: 'Internal server error while processing query',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/chat/history/:sessionId
 * Get conversation history for a session
 */
router.get('/history/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { limit = 10 } = req.query;

    if (!sessionId) {
      return res.status(400).json({
        error: 'Session ID is required'
      });
    }

    const history = await ragService.getConversationHistory(
      sessionId,
      parseInt(limit)
    );

    res.json({
      success: true,
      data: {
        sessionId: sessionId,
        history: history,
        count: history.length
      }
    });

  } catch (error) {
    console.error('Error getting conversation history:', error);
    res.status(500).json({
      error: 'Internal server error while retrieving history'
    });
  }
});

/**
 * GET /api/chat/suggestions
 * Get suggested questions for a repository
 */
router.get('/suggestions', async (req, res) => {
  try {
    const { repository } = req.query;

    const suggestions = await ragService.generateSuggestedQuestions(repository);

    res.json({
      success: true,
      data: {
        suggestions: suggestions,
        repository: repository
      }
    });

  } catch (error) {
    console.error('Error getting suggestions:', error);
    res.status(500).json({
      error: 'Internal server error while generating suggestions'
    });
  }
});

/**
 * POST /api/chat/feedback
 * Submit feedback for a response
 */
router.post('/feedback', async (req, res) => {
  try {
    const { sessionId, messageId, rating, comment } = req.body;

    if (!sessionId || !messageId || !rating) {
      return res.status(400).json({
        error: 'Session ID, message ID, and rating are required'
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        error: 'Rating must be between 1 and 5'
      });
    }

    // Store feedback (implement based on your needs)
    console.log('Feedback received:', { sessionId, messageId, rating, comment });

    res.json({
      success: true,
      message: 'Feedback submitted successfully'
    });

  } catch (error) {
    console.error('Error submitting feedback:', error);
    res.status(500).json({
      error: 'Internal server error while submitting feedback'
    });
  }
});

/**
 * DELETE /api/chat/session/:sessionId
 * Clear a conversation session
 */
router.delete('/session/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;

    if (!sessionId) {
      return res.status(400).json({
        error: 'Session ID is required'
      });
    }

    // Clear session (implement based on your needs)
    console.log('Clearing session:', sessionId);

    res.json({
      success: true,
      message: 'Session cleared successfully'
    });

  } catch (error) {
    console.error('Error clearing session:', error);
    res.status(500).json({
      error: 'Internal server error while clearing session'
    });
  }
});

/**
 * GET /api/chat/health
 * Health check endpoint
 */
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Chat API is healthy',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
