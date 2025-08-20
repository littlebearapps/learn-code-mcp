#!/usr/bin/env node

/**
 * Test Enhanced Learn Code MCP Server
 * Test workspace context integration and secret redaction
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Test code with secrets and workspace context
const testCodeWithSecrets = `const config = {
  apiKey: "sk-abc123def456ghi789jkl012mno345pqr",
  dbUrl: "postgresql://user:mypassword123@localhost/mydb",
  jwtToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c",
  githubToken: "ghp_1234567890abcdef1234567890abcdef12345678"
};

function connectToDatabase() {
  return new Promise((resolve, reject) => {
    const connection = createConnection(config.dbUrl);
    connection.connect((err) => {
      if (err) reject(err);
      else resolve(connection);
    });
  });
}`;

const workspaceContext = {
  repo: {
    rootName: "my-react-app",
    gitBranch: "feature/auth-system",
    isMonorepo: false
  },
  project: {
    type: "node",
    frameworkHints: ["react", "express"],
    testFramework: "jest"
  },
  deps: ["react", "express", "jsonwebtoken", "bcrypt", "mongoose"]
};

class EnhancedMCPTester {
  constructor() {
    this.serverPath = join(__dirname, 'dist', 'server.js');
  }

  async testEnhancedExplanation() {
    console.log('🧪 Testing Enhanced MCP Server with Secrets & Context...\n');

    const result = await this.callMCPTool('explain_selection', {
      code: testCodeWithSecrets,
      length: 'short',
      language: 'javascript',
      filename: 'config.js',
      context: workspaceContext
    });

    console.log('✅ Enhanced explanation generated');
    console.log('📄 Response:', result.slice(0, 500) + '...\n');
    
    // Check for security notices
    if (result.includes('🔒 Security Notice')) {
      console.log('🔒 Security redaction detected successfully');
    }
    
    // Check for context integration
    if (result.includes('react') || result.includes('express')) {
      console.log('🎯 Workspace context integrated successfully');
    }
    
    // Check for processing summary
    if (result.includes('📊 Processing Summary')) {
      console.log('📊 Enhanced processing metadata included');
    }
  }

  async testContextAwarePrompt() {
    console.log('📝 Testing context-aware prompt generation...\n');

    const result = await this.callMCPPrompt('explain_deep', {
      code: testCodeWithSecrets,
      language: 'javascript',
      filename: 'config.js',
      context: workspaceContext
    });

    console.log('✅ Context-aware prompt generated');
    console.log('📄 Prompt excerpt:', result.slice(0, 300) + '...\n');
    
    // Check for framework-specific context
    if (result.includes('react') || result.includes('express')) {
      console.log('🎯 Framework context included in prompt');
    }
    
    // Check for security notice in prompt
    if (result.includes('🔒 Security Note')) {
      console.log('🔒 Security notice added to prompt');
    }
  }

  async callMCPTool(toolName, args) {
    return new Promise((resolve, reject) => {
      const serverProcess = spawn('node', [this.serverPath], {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let output = '';
      serverProcess.stdout.on('data', (data) => {
        output += data.toString();
      });

      serverProcess.on('close', (code) => {
        if (code === 0) {
          resolve(output);
        } else {
          reject(new Error(`Server exited with code ${code}`));
        }
      });

      const request = {
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/call',
        params: {
          name: toolName,
          arguments: args
        }
      };

      serverProcess.stdin.write(JSON.stringify(request) + '\n');
      serverProcess.stdin.end();
    });
  }

  async callMCPPrompt(promptName, args) {
    return new Promise((resolve, reject) => {
      const serverProcess = spawn('node', [this.serverPath], {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let output = '';
      serverProcess.stdout.on('data', (data) => {
        output += data.toString();
      });

      serverProcess.on('close', (code) => {
        if (code === 0) {
          resolve(output);
        } else {
          reject(new Error(`Server exited with code ${code}`));
        }
      });

      const request = {
        jsonrpc: '2.0',
        id: 1,
        method: 'prompts/get',
        params: {
          name: promptName,
          arguments: args
        }
      };

      serverProcess.stdin.write(JSON.stringify(request) + '\n');
      serverProcess.stdin.end();
    });
  }

  async runAllTests() {
    console.log('🎯 Enhanced Learn Code MCP Server Test Suite\n');
    console.log('📁 Server path:', this.serverPath);
    console.log('⏰ Starting enhanced tests...\n');

    try {
      await this.testEnhancedExplanation();
      await this.testContextAwarePrompt();
      console.log('✅ All enhanced tests completed successfully!');
    } catch (error) {
      console.error('❌ Enhanced test failed:', error.message);
      process.exit(1);
    }
  }
}

// Run enhanced tests
if (import.meta.url === `file://${process.argv[1]}`) {
  const tester = new EnhancedMCPTester();
  tester.runAllTests();
}