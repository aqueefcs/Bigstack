const { Client } = require('@opensearch-project/opensearch');
const AWS_CONFIG = require('../config/aws-config');

class OpenSearchService {
  constructor() {
    this.client = new Client({
      node: AWS_CONFIG.opensearch.endpoint,
      auth: {
        username: process.env.OPENSEARCH_USERNAME || 'admin',
        password: process.env.OPENSEARCH_PASSWORD || 'admin'
      }
    });
    this.indexName = AWS_CONFIG.opensearch.indexName;
  }

  /**
   * Initialize the OpenSearch index with proper mapping
   */
  async initializeIndex() {
    try {
      const indexExists = await this.client.indices.exists({
        index: this.indexName
      });

      if (!indexExists.body) {
        await this.client.indices.create({
          index: this.indexName,
          body: {
            settings: {
              number_of_shards: 1,
              number_of_replicas: 0,
              "index.knn": true
            },
            mappings: {
              properties: {
                content: {
                  type: "text",
                  analyzer: "standard"
                },
                embedding: {
                  type: "knn_vector",
                  dimension: AWS_CONFIG.opensearch.vectorDimension,
                  method: {
                    name: "hnsw",
                    space_type: "cosinesimil",
                    engine: "lucene"
                  }
                },
                filePath: {
                  type: "keyword"
                },
                fileName: {
                  type: "keyword"
                },
                fileType: {
                  type: "keyword"
                },
                chunkType: {
                  type: "keyword"
                },
                repository: {
                  type: "keyword"
                },
                branch: {
                  type: "keyword"
                },
                timestamp: {
                  type: "date"
                },
                metadata: {
                  type: "object",
                  enabled: false
                }
              }
            }
          }
        });
        console.log(`Created index: ${this.indexName}`);
      }
    } catch (error) {
      console.error('Error initializing index:', error);
      throw error;
    }
  }

  /**
   * Index a code chunk with its embedding
   */
  async indexCodeChunk(codeChunk, embedding) {
    try {
      const document = {
        content: codeChunk.content,
        embedding: embedding,
        filePath: codeChunk.filePath,
        fileName: codeChunk.fileName,
        fileType: codeChunk.fileType,
        chunkType: codeChunk.type,
        repository: codeChunk.repository,
        branch: codeChunk.branch || 'main',
        timestamp: new Date().toISOString(),
        metadata: {
          startLine: codeChunk.startLine,
          endLine: codeChunk.endLine,
          functionName: codeChunk.functionName,
          className: codeChunk.className,
          description: codeChunk.description
        }
      };

      const response = await this.client.index({
        index: this.indexName,
        body: document
      });

      return response.body._id;
    } catch (error) {
      console.error('Error indexing code chunk:', error);
      throw error;
    }
  }

  /**
   * Search for similar code chunks using vector similarity
   */
  async searchSimilarChunks(queryEmbedding, limit = 10, filters = {}) {
    try {
      const query = {
        size: limit,
        query: {
          bool: {
            must: [
              {
                knn: {
                  embedding: {
                    vector: queryEmbedding,
                    k: limit
                  }
                }
              }
            ]
          }
        },
        _source: {
          excludes: ["embedding"]
        }
      };

      // Add filters if provided
      if (filters.repository) {
        query.query.bool.filter = query.query.bool.filter || [];
        query.query.bool.filter.push({
          term: { repository: filters.repository }
        });
      }

      if (filters.fileType) {
        query.query.bool.filter = query.query.bool.filter || [];
        query.query.bool.filter.push({
          term: { fileType: filters.fileType }
        });
      }

      const response = await this.client.search({
        index: this.indexName,
        body: query
      });

      return response.body.hits.hits.map(hit => ({
        id: hit._id,
        score: hit._score,
        ...hit._source
      }));
    } catch (error) {
      console.error('Error searching similar chunks:', error);
      throw error;
    }
  }

  /**
   * Hybrid search combining text and vector search
   */
  async hybridSearch(queryText, queryEmbedding, limit = 10, filters = {}) {
    try {
      const query = {
        size: limit,
        query: {
          bool: {
            should: [
              {
                multi_match: {
                  query: queryText,
                  fields: ["content", "filePath", "fileName"],
                  boost: 1.0
                }
              },
              {
                knn: {
                  embedding: {
                    vector: queryEmbedding,
                    k: limit,
                    boost: 2.0
                  }
                }
              }
            ],
            minimum_should_match: 1
          }
        },
        _source: {
          excludes: ["embedding"]
        }
      };

      // Add filters
      if (filters.repository) {
        query.query.bool.filter = query.query.bool.filter || [];
        query.query.bool.filter.push({
          term: { repository: filters.repository }
        });
      }

      const response = await this.client.search({
        index: this.indexName,
        body: query
      });

      return response.body.hits.hits.map(hit => ({
        id: hit._id,
        score: hit._score,
        ...hit._source
      }));
    } catch (error) {
      console.error('Error in hybrid search:', error);
      throw error;
    }
  }

  /**
   * Get repository statistics
   */
  async getRepositoryStats(repository) {
    try {
      const response = await this.client.search({
        index: this.indexName,
        body: {
          size: 0,
          query: {
            term: { repository: repository }
          },
          aggs: {
            file_types: {
              terms: {
                field: "fileType",
                size: 20
              }
            },
            chunk_types: {
              terms: {
                field: "chunkType",
                size: 10
              }
            },
            total_files: {
              cardinality: {
                field: "filePath"
              }
            }
          }
        }
      });

      return {
        totalChunks: response.body.hits.total.value,
        totalFiles: response.body.aggregations.total_files.value,
        fileTypes: response.body.aggregations.file_types.buckets,
        chunkTypes: response.body.aggregations.chunk_types.buckets
      };
    } catch (error) {
      console.error('Error getting repository stats:', error);
      throw error;
    }
  }

  /**
   * Delete all documents for a repository
   */
  async deleteRepository(repository) {
    try {
      const response = await this.client.deleteByQuery({
        index: this.indexName,
        body: {
          query: {
            term: { repository: repository }
          }
        }
      });

      return response.body.deleted;
    } catch (error) {
      console.error('Error deleting repository:', error);
      throw error;
    }
  }
}

module.exports = OpenSearchService;
