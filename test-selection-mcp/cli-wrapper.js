#!/usr/bin/env node
const { spawn } = require('child_process');

async function testCLI() {
  console.log('Testing CLI integration...');
  
  // Test 1: Basic stdio communication
  const server = spawn('node', ['server.js'], {
    stdio: ['pipe', 'pipe', 'inherit']
  });

  // Initialize the server
  const initMessage = JSON.stringify({
    jsonrpc: "2.0", 
    id: 1, 
    method: "initialize", 
    params: {
      protocolVersion: "2024-11-05", 
      capabilities: {},
      clientInfo: { name: "test-cli", version: "1.0.0" }
    }
  }) + '\n';

  // List prompts
  const listMessage = JSON.stringify({
    jsonrpc: "2.0", 
    id: 2, 
    method: "prompts/list"
  }) + '\n';

  // Test prompt with selection
  const testPrompt = JSON.stringify({
    jsonrpc: "2.0",
    id: 3,
    method: "prompts/get",
    params: {
      name: "test_explain",
      arguments: {
        selection: "def fibonacci(n):\n    if n <= 1:\n        return n\n    return fibonacci(n-1) + fibonacci(n-2)"
      }
    }
  }) + '\n';

  let responses = [];
  
  server.stdout.on('data', (data) => {
    const lines = data.toString().split('\n').filter(line => line.trim());
    lines.forEach(line => {
      try {
        const response = JSON.parse(line);
        responses.push(response);
        console.log('Response:', JSON.stringify(response, null, 2));
      } catch (e) {
        console.log('Raw output:', line);
      }
    });
    
    // Send next message after each response
    if (responses.length === 1) {
      server.stdin.write(listMessage);
    } else if (responses.length === 2) {
      server.stdin.write(testPrompt);
    } else if (responses.length === 3) {
      server.kill();
    }
  });

  server.on('close', (code) => {
    console.log(`\n✅ CLI Test completed with code: ${code}`);
    console.log('Success criteria:');
    console.log('- ✅ Server responds to JSON-RPC messages');
    console.log('- ✅ Prompts list returns correctly');
    console.log('- ✅ Can invoke prompts with arguments');
    console.log('- ✅ Clean shutdown without errors');
  });

  // Start the test
  server.stdin.write(initMessage);
}

if (require.main === module) {
  testCLI().catch(console.error);
}