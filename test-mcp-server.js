#!/usr/bin/env node

/**
 * Test the Learn Code MCP Server directly
 * This simulates how MCP clients (like Claude Desktop) would interact with the server
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Test code samples
const testCode = {
  javascript: `function calculateTax(price, taxRate) {
  if (price < 0 || taxRate < 0) {
    throw new Error('Price and tax rate must be positive');
  }
  return price * (1 + taxRate);
}`,

  python: `def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n-1) + fibonacci(n-2)`,

  react: `const UserCard = ({ user, onEdit }) => {
  const [isEditing, setIsEditing] = useState(false);
  
  return (
    <div className="user-card">
      <h3>{user.name}</h3>
      <button onClick={() => setIsEditing(!isEditing)}>
        {isEditing ? 'Cancel' : 'Edit'}
      </button>
    </div>
  );
};`
};

class MCPServerTester {
  constructor() {
    this.serverPath = join(__dirname, 'dist', 'server.js');
  }

  async testPrompts() {
    console.log('🧪 Testing MCP Prompts...\n');

    const prompts = ['explain_micro', 'explain_short', 'explain_paragraph', 'explain_deep'];
    
    for (const prompt of prompts) {
      console.log(`📝 Testing ${prompt}:`);
      
      const result = await this.callMCPPrompt(prompt, {
        code: testCode.javascript,
        language: 'javascript',
        filename: 'tax-calculator.js'
      });
      
      console.log('✅ Prompt generated successfully');
      console.log('📄 Sample output:', result.slice(0, 150) + '...\n');
    }
  }

  async testTools() {
    console.log('🔧 Testing MCP Tools...\n');

    // Test explain_selection tool
    console.log('📝 Testing explain_selection tool:');
    const explainResult = await this.callMCPTool('explain_selection', {
      code: testCode.react,
      length: 'short',
      language: 'javascript',
      filename: 'UserCard.jsx'
    });
    console.log('✅ Tool executed successfully');
    console.log('📄 Result:', explainResult.slice(0, 200) + '...\n');

    // Test classify_construct tool  
    console.log('📝 Testing classify_construct tool:');
    const classifyResult = await this.callMCPTool('classify_construct', {
      code: testCode.python,
      language: 'python'
    });
    console.log('✅ Tool executed successfully');
    console.log('📄 Result:', classifyResult + '\n');
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

      // Send MCP request
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

      // Send MCP request
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

  async runAllTests() {
    console.log('🎯 Learn Code MCP Server Test Suite\n');
    console.log('📁 Server path:', this.serverPath);
    console.log('⏰ Starting tests...\n');

    try {
      await this.testPrompts();
      await this.testTools();
      console.log('✅ All tests completed successfully!');
    } catch (error) {
      console.error('❌ Test failed:', error.message);
      process.exit(1);
    }
  }
}

// Run tests
if (import.meta.url === `file://${process.argv[1]}`) {
  const tester = new MCPServerTester();
  tester.runAllTests();
}