const {
  BedrockRuntimeClient,
  InvokeModelCommand,
} = require("@aws-sdk/client-bedrock-runtime");
const AWS_CONFIG = require("../config/aws-config");

class BedrockService {
  constructor() {
    this.client = new BedrockRuntimeClient({
      region: AWS_CONFIG.region,
    });
  }

  /**
   * Generate embeddings for text using Amazon Titan
   */
  async generateEmbeddings(text) {
    try {
      const input = {
        modelId: AWS_CONFIG.bedrock.embeddingModelId,
        contentType: "application/json",
        accept: "application/json",
        body: JSON.stringify({
          inputText: text,
        }),
      };

      const command = new InvokeModelCommand(input);
      const response = await this.client.send(command);

      const responseBody = JSON.parse(new TextDecoder().decode(response.body));
      return responseBody.embedding;
    } catch (error) {
      console.error("Error generating embeddings:", error);
      throw error;
    }
  }

  /**
   * Generate response using Claude Sonnet
   */
  async generateResponse(prompt, context = "", conversationHistory = []) {
    try {
      // Build the full prompt with context and history
      const fullPrompt = this.buildPrompt(prompt, context, conversationHistory);

      const input = {
        modelId: AWS_CONFIG.bedrock.modelId,
        contentType: "application/json",
        accept: "application/json",
        body: JSON.stringify({
          anthropic_version: "bedrock-2023-05-31",
          max_tokens: AWS_CONFIG.bedrock.maxTokens,
          temperature: AWS_CONFIG.bedrock.temperature,
          messages: [
            {
              role: "user",
              content: fullPrompt,
            },
          ],
        }),
      };

      const command = new InvokeModelCommand(input);
      const response = await this.client.send(command);

      const responseBody = JSON.parse(new TextDecoder().decode(response.body));
      return responseBody.content[0].text;
    } catch (error) {
      console.error("Error generating response:", error);
      throw error;
    }
  }

  /**
   * Build a comprehensive prompt with context and conversation history
   */
  buildPrompt(userQuestion, codebaseContext, conversationHistory) {
    let prompt = `You are an AI assistant specialized in helping developers understand codebases and get onboarded to new projects. You have access to the codebase context and should provide accurate, helpful responses.

## Codebase Context:
${codebaseContext}

## Conversation History:
${conversationHistory.map((msg) => `${msg.role}: ${msg.content}`).join("\n")}

## Current Question:
${userQuestion}

## Instructions:
1. Provide clear, accurate answers based on the codebase context
2. Include specific file names, function names, and code snippets when relevant
3. If you're not sure about something, say so rather than guessing
4. For setup questions, provide step-by-step instructions
5. For architecture questions, explain the overall structure and relationships
6. Use markdown formatting for better readability

Please answer the question:`;

    return prompt;
  }

  /**
   * Generate embeddings for code chunks
   */
  async generateCodeEmbeddings(codeChunk) {
    // Preprocess code chunk for better embeddings
    const processedCode = this.preprocessCodeForEmbedding(codeChunk);
    return await this.generateEmbeddings(processedCode);
  }

  /**
   * Preprocess code to improve embedding quality
   */
  preprocessCodeForEmbedding(codeChunk) {
    // Remove excessive whitespace and normalize
    let processed = codeChunk.content.replace(/\s+/g, " ").trim();

    // Add metadata for better context
    const metadata = [
      `File: ${codeChunk.filePath}`,
      `Type: ${codeChunk.type}`,
      codeChunk.description ? `Description: ${codeChunk.description}` : "",
      `Content: ${processed}`,
    ]
      .filter(Boolean)
      .join("\n");

    return metadata;
  }
}

module.exports = BedrockService;
