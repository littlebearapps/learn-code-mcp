#!/usr/bin/env node

// Quick test script for Learn Code MCP Server
const { spawn } = require('child_process');
const path = require('path');

async function testMCPServer() {
  console.log('🧪 Testing Learn Code MCP Server...\n');

  const serverPath = path.join(__dirname, 'dist', 'server.js');
  
  return new Promise((resolve) => {
    const server = spawn('node', [serverPath], {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let stdout = '';
    let stderr = '';

    server.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    server.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    // Test sequence
    const tests = [
      {
        name: 'Initialize',
        command: {
          jsonrpc: '2.0',
          id: 1,
          method: 'initialize',
          params: {
            protocolVersion: '2024-11-05',
            capabilities: {}
          }
        }
      },
      {
        name: 'List Prompts',
        command: {
          jsonrpc: '2.0',
          id: 2,
          method: 'prompts/list'
        }
      },
      {
        name: 'List Tools',
        command: {
          jsonrpc: '2.0',
          id: 3,
          method: 'tools/list'
        }
      },
      {
        name: 'Test explain_selection Tool',
        command: {
          jsonrpc: '2.0',
          id: 4,
          method: 'tools/call',
          params: {
            name: 'explain_selection',
            arguments: {
              code: 'function calculateSum(arr) {\n  return arr.reduce((sum, num) => sum + num, 0);\n}',
              length: 'short',
              language: 'javascript'
            }
          }
        }
      },
      {
        name: 'Test Micro Prompt',
        command: {
          jsonrpc: '2.0',
          id: 5,
          method: 'prompts/get',
          params: {
            name: 'explain_micro',
            arguments: {
              code: 'const result = items.filter(x => x.active).map(x => x.name);',
              language: 'javascript'
            }
          }
        }
      }
    ];

    let testIndex = 0;
    let results = [];

    function runNextTest() {
      if (testIndex >= tests.length) {
        server.stdin.end();
        return;
      }

      const test = tests[testIndex];
      console.log(`🔄 Running: ${test.name}`);
      
      server.stdin.write(JSON.stringify(test.command) + '\n');
      testIndex++;
      
      // Run next test after a delay
      setTimeout(runNextTest, 500);
    }

    server.on('close', (code) => {
      console.log('\n📊 Test Results:');
      console.log(`Server exit code: ${code}`);
      console.log(`Stderr output: ${stderr}`);
      
      // Parse JSON-RPC responses
      const lines = stdout.split('\n').filter(line => line.trim());
      let successCount = 0;
      
      lines.forEach((line, index) => {
        try {
          const response = JSON.parse(line);
          if (response.result) {
            successCount++;
            console.log(`✅ Test ${index + 1}: Success`);
            if (response.result.prompts) {
              console.log(`   Prompts found: ${response.result.prompts.length}`);
            }
            if (response.result.tools) {
              console.log(`   Tools found: ${response.result.tools.length}`);
            }
            if (response.result.content) {
              console.log(`   Content generated: ${response.result.content[0]?.text?.substring(0, 100)}...`);
            }
            if (response.result.messages) {
              console.log(`   Prompt generated: ${response.result.messages[0]?.content?.text?.substring(0, 100)}...`);
            }
          } else if (response.error) {
            console.log(`❌ Test ${index + 1}: Error - ${response.error.message}`);
          }
        } catch (parseError) {
          // Skip non-JSON lines
        }
      });

      console.log(`\n🎯 Overall Results: ${successCount}/${tests.length} tests passed`);
      
      if (successCount >= 4) {
        console.log('✅ MCP Server is working correctly!');
      } else {
        console.log('⚠️  Some tests failed - check implementation');
      }

      resolve(successCount);
    });

    server.on('error', (err) => {
      console.error('❌ Server failed to start:', err.message);
      resolve(0);
    });

    // Start test sequence
    setTimeout(runNextTest, 1000);
  });
}

// Run tests
testMCPServer().then((passed) => {
  process.exit(passed >= 4 ? 0 : 1);
}).catch((error) => {
  console.error('Test runner failed:', error);
  process.exit(1);
});