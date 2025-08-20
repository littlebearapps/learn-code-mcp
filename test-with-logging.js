#!/usr/bin/env node

import { spawn } from 'child_process';

console.log('Starting comprehensive server test...');

const server = spawn('node', ['dist/server.js'], {
  stdio: ['pipe', 'pipe', 'pipe']
});

let hasReceivedStderr = false;
let hasReceivedStdout = false;

server.stdout.on('data', (data) => {
  hasReceivedStdout = true;
  console.log('STDOUT:', data.toString().trim());
});

server.stderr.on('data', (data) => {
  hasReceivedStderr = true;
  console.log('STDERR:', data.toString().trim());
});

server.on('close', (code, signal) => {
  console.log(`Server closed with code ${code}, signal ${signal}`);
  console.log(`Stderr received: ${hasReceivedStderr}, Stdout received: ${hasReceivedStdout}`);
  process.exit(0);
});

server.on('error', (error) => {
  console.log('Server process error:', error.message);
  process.exit(1);
});

// Wait 2 seconds to see if server starts properly
setTimeout(() => {
  console.log('Server should be running now. Testing JSON-RPC...');
  
  // Send initialization request (proper MCP handshake)
  const initRequest = JSON.stringify({
    jsonrpc: "2.0",
    id: 1,
    method: "initialize",
    params: {
      protocolVersion: "2024-11-05",
      capabilities: {},
      clientInfo: {
        name: "test-client",
        version: "1.0.0"
      }
    }
  }) + '\n';
  
  console.log('Sending init request:', initRequest.trim());
  server.stdin.write(initRequest);
  
  // Wait for response
  setTimeout(() => {
    console.log('Sending prompts/list request...');
    const promptsRequest = JSON.stringify({
      jsonrpc: "2.0",
      id: 2,
      method: "prompts/list"
    }) + '\n';
    
    server.stdin.write(promptsRequest);
    
    // Kill after 5 more seconds
    setTimeout(() => {
      console.log('Test completed, killing server...');
      server.kill('SIGTERM');
    }, 5000);
  }, 2000);
}, 2000);