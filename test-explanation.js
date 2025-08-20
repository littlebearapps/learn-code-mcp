#!/usr/bin/env node

import { spawn } from 'child_process';

console.log('Testing explanation functionality...');

const server = spawn('node', ['dist/server.js'], {
  stdio: ['pipe', 'pipe', 'pipe']
});

server.stdout.on('data', (data) => {
  console.log('RESPONSE:', data.toString().trim());
});

server.stderr.on('data', (data) => {
  console.log('STDERR:', data.toString().trim());
});

server.on('close', (code, signal) => {
  console.log(`Server closed with code ${code}, signal ${signal}`);
  process.exit(0);
});

server.on('error', (error) => {
  console.log('Server error:', error.message);
  process.exit(1);
});

// Initialize server first
setTimeout(() => {
  const initRequest = JSON.stringify({
    jsonrpc: "2.0",
    id: 1,
    method: "initialize",
    params: {
      protocolVersion: "2024-11-05",
      capabilities: {},
      clientInfo: { name: "test-client", version: "1.0.0" }
    }
  }) + '\n';
  
  server.stdin.write(initRequest);
  
  // Send explanation prompt after init
  setTimeout(() => {
    console.log('\nTesting micro explanation prompt...');
    
    const explanationRequest = JSON.stringify({
      jsonrpc: "2.0",
      id: 2,
      method: "prompts/get",
      params: {
        name: "explain_micro",
        arguments: {
          code: "function add(a, b) { return a + b; }",
          language: "javascript",
          filename: "math.js"
        }
      }
    }) + '\n';
    
    server.stdin.write(explanationRequest);
    
    // Test tools list after prompt
    setTimeout(() => {
      console.log('\nTesting tools list...');
      
      const toolsRequest = JSON.stringify({
        jsonrpc: "2.0",
        id: 3,
        method: "tools/list"
      }) + '\n';
      
      server.stdin.write(toolsRequest);
      
      // Kill after response
      setTimeout(() => {
        server.kill('SIGTERM');
      }, 3000);
    }, 2000);
  }, 1000);
}, 1000);