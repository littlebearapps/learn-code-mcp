#!/usr/bin/env node

import { spawn } from 'child_process';

console.log('Testing secret redaction functionality...');

const server = spawn('node', ['dist/server.js'], {
  stdio: ['pipe', 'pipe', 'pipe']
});

server.stdout.on('data', (data) => {
  const response = data.toString().trim();
  console.log('RESPONSE:', response);
});

server.stderr.on('data', (data) => {
  console.log('STDERR:', data.toString().trim());
});

server.on('close', () => process.exit(0));

// Test with code containing secrets
setTimeout(() => {
  // Initialize
  server.stdin.write(JSON.stringify({
    jsonrpc: "2.0", id: 1, method: "initialize",
    params: {
      protocolVersion: "2024-11-05",
      capabilities: {},
      clientInfo: { name: "test-client", version: "1.0.0" }
    }
  }) + '\n');
  
  setTimeout(() => {
    console.log('\nTesting secret redaction in explain_selection...');
    
    const codeWithSecrets = `
const config = {
  apiKey: 'sk-1234567890abcdef1234567890abcdef',
  password: 'mySecretPassword123',
  token: 'ghp_abcdef1234567890abcdef1234567890abcdef12',
  connectionString: 'mongodb://user:password@localhost:27017/mydb'
};

function authenticate() {
  return fetch('/api/login', {
    headers: {
      'Authorization': 'Bearer ' + config.apiKey,
      'X-API-Key': config.token
    }
  });
}`;

    server.stdin.write(JSON.stringify({
      jsonrpc: "2.0", id: 2, method: "tools/call",
      params: {
        name: "explain_selection",
        arguments: {
          code: codeWithSecrets,
          length: "short",
          language: "javascript",
          filename: "config.js"
        }
      }
    }) + '\n');
    
    setTimeout(() => server.kill('SIGTERM'), 5000);
  }, 1000);
}, 1000);