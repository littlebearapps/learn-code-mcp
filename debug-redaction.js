#!/usr/bin/env node

import { spawn } from 'child_process';

const server = spawn('node', ['dist/server.js'], { stdio: ['pipe', 'pipe', 'pipe'] });

server.stdout.on('data', (data) => {
  const response = data.toString().trim();
  if (response.includes('"id":6')) {
    console.log('SECRET REDACTION TEST RESPONSE:');
    console.log(JSON.stringify(JSON.parse(response), null, 2));
    server.kill('SIGTERM');
  }
});

server.stderr.on('data', (data) => console.log('STDERR:', data.toString().trim()));

setTimeout(() => {
  server.stdin.write(JSON.stringify({
    jsonrpc: "2.0", id: 1, method: "initialize",
    params: { protocolVersion: "2024-11-05", capabilities: {}, clientInfo: { name: "test", version: "1.0.0" }}
  }) + '\n');
  
  setTimeout(() => {
    server.stdin.write(JSON.stringify({
      jsonrpc: "2.0", id: 6, method: "tools/call",
      params: {
        name: "explain_selection",
        arguments: {
          code: "const apiKey = 'sk-1234567890abcdef'; const password = 'secret123';",
          length: "micro",
          language: "javascript"
        }
      }
    }) + '\n');
  }, 1000);
}, 1000);