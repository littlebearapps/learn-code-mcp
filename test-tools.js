#!/usr/bin/env node

import { spawn } from 'child_process';

console.log('Testing tools functionality...');

const server = spawn('node', ['dist/server.js'], {
  stdio: ['pipe', 'pipe', 'pipe']
});

let responseCount = 0;
const expectedResponses = 4;

server.stdout.on('data', (data) => {
  const response = data.toString().trim();
  console.log(`RESPONSE ${++responseCount}:`, response);
  
  if (responseCount >= expectedResponses) {
    setTimeout(() => server.kill('SIGTERM'), 1000);
  }
});

server.stderr.on('data', (data) => {
  console.log('STDERR:', data.toString().trim());
});

server.on('close', (code, signal) => {
  console.log(`\nServer closed with code ${code}, signal ${signal}`);
  process.exit(0);
});

// Initialize and test tools
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
    console.log('\nTesting explain_selection tool...');
    server.stdin.write(JSON.stringify({
      jsonrpc: "2.0", id: 2, method: "tools/call",
      params: {
        name: "explain_selection",
        arguments: {
          code: "const users = await User.find({ active: true });",
          length: "short",
          language: "javascript",
          filename: "users.js",
          context: {
            repo: { rootName: "my-app", gitBranch: "feature/users" },
            project: { type: "Node.js", frameworkHints: ["Express"] }
          }
        }
      }
    }) + '\n');
    
    setTimeout(() => {
      console.log('\nTesting classify_construct tool...');
      server.stdin.write(JSON.stringify({
        jsonrpc: "2.0", id: 3, method: "tools/call",
        params: {
          name: "classify_construct",
          arguments: {
            code: "class DatabaseManager extends BaseManager {\n  async connect() {}\n}",
            language: "javascript"
          }
        }
      }) + '\n');
      
      setTimeout(() => {
        console.log('\nTesting set_preferences tool...');
        server.stdin.write(JSON.stringify({
          jsonrpc: "2.0", id: 4, method: "tools/call",
          params: {
            name: "set_preferences",
            arguments: {
              preferences: {
                outputFormat: "detailed",
                includeExamples: true
              }
            }
          }
        }) + '\n');
      }, 1000);
    }, 1000);
  }, 1000);
}, 1000);