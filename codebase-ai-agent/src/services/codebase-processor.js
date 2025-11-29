const fs = require('fs').promises;
const path = require('path');
const ignore = require('ignore');

class CodebaseProcessor {
  constructor() {
    this.supportedExtensions = new Set([
      '.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.cpp', '.c', '.h',
      '.cs', '.php', '.rb', '.go', '.rs', '.swift', '.kt', '.scala',
      '.md', '.txt', '.json', '.yaml', '.yml', '.xml', '.html', '.css',
      '.sql', '.sh', '.bat', '.dockerfile', '.tf'
    ]);

    this.ignoredDirectories = new Set([
      'node_modules', '.git', '.svn', '.hg', 'dist', 'build', 'target',
      '.next', '.nuxt', 'coverage', '.nyc_output', 'logs', 'tmp', 'temp'
    ]);
  }

  /**
   * Process a repository and extract code chunks
   */
  async processRepository(repositoryPath, repositoryName) {
    try {
      console.log(`Processing repository: ${repositoryName}`);
      
      const gitignore = await this.loadGitignore(repositoryPath);
      const files = await this.scanDirectory(repositoryPath, gitignore);
      
      const chunks = [];
      for (const file of files) {
        try {
          const fileChunks = await this.processFile(file, repositoryPath, repositoryName);
          chunks.push(...fileChunks);
        } catch (error) {
          console.warn(`Error processing file ${file}:`, error.message);
        }
      }

      console.log(`Extracted ${chunks.length} chunks from ${files.length} files`);
      return chunks;
    } catch (error) {
      console.error('Error processing repository:', error);
      throw error;
    }
  }

  /**
   * Load .gitignore patterns
   */
  async loadGitignore(repositoryPath) {
    const ig = ignore();
    
    try {
      const gitignorePath = path.join(repositoryPath, '.gitignore');
      const gitignoreContent = await fs.readFile(gitignorePath, 'utf8');
      ig.add(gitignoreContent);
    } catch (error) {
      // .gitignore doesn't exist, use default patterns
    }

    // Add default ignore patterns
    ig.add([
      'node_modules/**',
      '.git/**',
      'dist/**',
      'build/**',
      'coverage/**',
      '*.log',
      '.env*',
      '*.min.js',
      '*.bundle.js'
    ]);

    return ig;
  }

  /**
   * Recursively scan directory for supported files
   */
  async scanDirectory(dirPath, gitignore, relativePath = '') {
    const files = [];
    
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        const relativeFilePath = path.join(relativePath, entry.name).replace(/\\/g, '/');
        
        // Skip if ignored
        if (gitignore.ignores(relativeFilePath)) {
          continue;
        }

        if (entry.isDirectory()) {
          if (!this.ignoredDirectories.has(entry.name)) {
            const subFiles = await this.scanDirectory(
              fullPath, 
              gitignore, 
              relativeFilePath
            );
            files.push(...subFiles);
          }
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name).toLowerCase();
          if (this.supportedExtensions.has(ext)) {
            files.push(fullPath);
          }
        }
      }
    } catch (error) {
      console.warn(`Error scanning directory ${dirPath}:`, error.message);
    }

    return files;
  }

  /**
   * Process a single file and extract chunks
   */
  async processFile(filePath, repositoryPath, repositoryName) {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      const relativePath = path.relative(repositoryPath, filePath).replace(/\\/g, '/');
      const fileName = path.basename(filePath);
      const fileExtension = path.extname(filePath).toLowerCase();
      
      const chunks = [];

      // File-level chunk (overview)
      chunks.push({
        type: 'file_overview',
        content: this.createFileOverview(content, relativePath),
        filePath: relativePath,
        fileName: fileName,
        fileType: this.getFileType(fileExtension),
        repository: repositoryName,
        startLine: 1,
        endLine: content.split('\n').length,
        description: `Overview of ${fileName}`
      });

      // Extract specific chunks based on file type
      if (this.isCodeFile(fileExtension)) {
        const codeChunks = this.extractCodeChunks(content, relativePath, fileName, repositoryName);
        chunks.push(...codeChunks);
      } else if (fileExtension === '.md') {
        const docChunks = this.extractDocumentationChunks(content, relativePath, fileName, repositoryName);
        chunks.push(...docChunks);
      } else if (fileExtension === '.json') {
        const configChunks = this.extractConfigChunks(content, relativePath, fileName, repositoryName);
        chunks.push(...configChunks);
      }

      return chunks;
    } catch (error) {
      console.error(`Error processing file ${filePath}:`, error);
      return [];
    }
  }

  /**
   * Create file overview
   */
  createFileOverview(content, filePath) {
    const lines = content.split('\n');
    const totalLines = lines.length;
    
    // Extract imports/requires
    const imports = lines
      .filter(line => line.trim().match(/^(import|require|from|#include|using)/))
      .slice(0, 10);

    // Extract comments at the top
    const topComments = [];
    for (let i = 0; i < Math.min(20, lines.length); i++) {
      const line = lines[i].trim();
      if (line.startsWith('//') || line.startsWith('/*') || line.startsWith('#') || line.startsWith('"""')) {
        topComments.push(line);
      } else if (line && !line.match(/^(import|require|from|package)/)) {
        break;
      }
    }

    return `File: ${filePath}
Total Lines: ${totalLines}

${topComments.length > 0 ? `Comments:\n${topComments.join('\n')}\n` : ''}
${imports.length > 0 ? `Imports/Dependencies:\n${imports.join('\n')}\n` : ''}

Preview:
${lines.slice(0, 30).join('\n')}`;
  }

  /**
   * Extract code chunks (functions, classes, etc.)
   */
  extractCodeChunks(content, filePath, fileName, repositoryName) {
    const chunks = [];
    const lines = content.split('\n');
    
    // Simple pattern matching for different languages
    const patterns = {
      function: [
        /^\s*(function\s+\w+|const\s+\w+\s*=\s*\([^)]*\)\s*=>|def\s+\w+|public\s+\w+\s+\w+\s*\()/,
        /^\s*(async\s+function\s+\w+|export\s+(async\s+)?function\s+\w+)/,
        /^\s*(\w+\s*:\s*function|\w+\s*:\s*\([^)]*\)\s*=>)/
      ],
      class: [
        /^\s*(class\s+\w+|interface\s+\w+|type\s+\w+)/,
        /^\s*(export\s+(default\s+)?class\s+\w+)/
      ],
      route: [
        /^\s*(app\.(get|post|put|delete|patch)|router\.(get|post|put|delete|patch))/,
        /^\s*@(Get|Post|Put|Delete|Patch)\s*\(/
      ]
    };

    let currentChunk = null;
    let braceCount = 0;
    let inMultilineComment = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmedLine = line.trim();

      // Handle multiline comments
      if (trimmedLine.includes('/*')) inMultilineComment = true;
      if (trimmedLine.includes('*/')) inMultilineComment = false;
      if (inMultilineComment) continue;

      // Skip single line comments and empty lines for pattern matching
      if (trimmedLine.startsWith('//') || trimmedLine.startsWith('#') || !trimmedLine) {
        if (currentChunk) currentChunk.content += line + '\n';
        continue;
      }

      // Check for new chunk patterns
      for (const [type, typePatterns] of Object.entries(patterns)) {
        for (const pattern of typePatterns) {
          if (pattern.test(line)) {
            // Save previous chunk if exists
            if (currentChunk && currentChunk.content.trim()) {
              chunks.push(currentChunk);
            }

            // Start new chunk
            currentChunk = {
              type: type,
              content: line + '\n',
              filePath: filePath,
              fileName: fileName,
              fileType: this.getFileType(path.extname(fileName)),
              repository: repositoryName,
              startLine: i + 1,
              endLine: i + 1,
              functionName: this.extractFunctionName(line),
              className: type === 'class' ? this.extractClassName(line) : null
            };
            braceCount = 0;
            break;
          }
        }
      }

      if (currentChunk) {
        currentChunk.content += line + '\n';
        currentChunk.endLine = i + 1;

        // Track braces to determine end of function/class
        braceCount += (line.match(/{/g) || []).length;
        braceCount -= (line.match(/}/g) || []).length;

        // End chunk when braces are balanced and we have substantial content
        if (braceCount <= 0 && currentChunk.content.length > 100) {
          chunks.push(currentChunk);
          currentChunk = null;
        }
      }
    }

    // Add final chunk if exists
    if (currentChunk && currentChunk.content.trim()) {
      chunks.push(currentChunk);
    }

    return chunks;
  }

  /**
   * Extract documentation chunks from markdown files
   */
  extractDocumentationChunks(content, filePath, fileName, repositoryName) {
    const chunks = [];
    const lines = content.split('\n');
    
    let currentSection = null;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Check for headers
      const headerMatch = line.match(/^(#{1,6})\s+(.+)/);
      if (headerMatch) {
        // Save previous section
        if (currentSection && currentSection.content.trim()) {
          chunks.push(currentSection);
        }

        // Start new section
        currentSection = {
          type: 'documentation',
          content: line + '\n',
          filePath: filePath,
          fileName: fileName,
          fileType: 'markdown',
          repository: repositoryName,
          startLine: i + 1,
          endLine: i + 1,
          description: headerMatch[2]
        };
      } else if (currentSection) {
        currentSection.content += line + '\n';
        currentSection.endLine = i + 1;
      }
    }

    // Add final section
    if (currentSection && currentSection.content.trim()) {
      chunks.push(currentSection);
    }

    return chunks;
  }

  /**
   * Extract configuration chunks from JSON files
   */
  extractConfigChunks(content, filePath, fileName, repositoryName) {
    try {
      const config = JSON.parse(content);
      const chunks = [];

      // Create chunk for the entire config
      chunks.push({
        type: 'configuration',
        content: JSON.stringify(config, null, 2),
        filePath: filePath,
        fileName: fileName,
        fileType: 'json',
        repository: repositoryName,
        startLine: 1,
        endLine: content.split('\n').length,
        description: `Configuration file: ${fileName}`
      });

      return chunks;
    } catch (error) {
      return [];
    }
  }

  /**
   * Helper methods
   */
  isCodeFile(extension) {
    const codeExtensions = ['.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.cpp', '.c', '.h', '.cs', '.php', '.rb', '.go', '.rs'];
    return codeExtensions.includes(extension);
  }

  getFileType(extension) {
    const typeMap = {
      '.js': 'javascript',
      '.ts': 'typescript',
      '.jsx': 'react',
      '.tsx': 'react-typescript',
      '.py': 'python',
      '.java': 'java',
      '.cpp': 'cpp',
      '.c': 'c',
      '.h': 'c-header',
      '.cs': 'csharp',
      '.php': 'php',
      '.rb': 'ruby',
      '.go': 'go',
      '.rs': 'rust',
      '.md': 'markdown',
      '.json': 'json',
      '.yaml': 'yaml',
      '.yml': 'yaml'
    };
    return typeMap[extension] || 'unknown';
  }

  extractFunctionName(line) {
    const patterns = [
      /function\s+(\w+)/,
      /const\s+(\w+)\s*=/,
      /def\s+(\w+)/,
      /(\w+)\s*:\s*function/,
      /(\w+)\s*:\s*\([^)]*\)\s*=>/
    ];

    for (const pattern of patterns) {
      const match = line.match(pattern);
      if (match) return match[1];
    }
    return null;
  }

  extractClassName(line) {
    const match = line.match(/class\s+(\w+)|interface\s+(\w+)/);
    return match ? (match[1] || match[2]) : null;
  }
}

module.exports = CodebaseProcessor;
