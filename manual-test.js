#!/usr/bin/env node

import { spawn } from 'child_process';

console.log('🧪 Testing Learn Code MCP Server\n');

const serverProcess = spawn('node', ['dist/server.js'], {
  stdio: ['pipe', 'pipe', 'pipe']
});

let response = '';
serverProcess.stdout.on('data', (data) => {
  response += data.toString();
});

serverProcess.stderr.on('data', (data) => {
  console.log('Server started:', data.toString());
});

// Test prompts/list
const listRequest = {
  jsonrpc: '2.0',
  id: 1,
  method: 'prompts/list'
};

setTimeout(() => {
  console.log('📝 Sending prompts/list request...');
  serverProcess.stdin.write(JSON.stringify(listRequest) + '\n');
  
  setTimeout(() => {
    console.log('📄 Response:', response);
    serverProcess.kill();
  }, 2000);
}, 1000);