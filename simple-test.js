#!/usr/bin/env node

import { spawn } from 'child_process';

const serverProcess = spawn('node', ['dist/server.js'], {
  stdio: ['pipe', 'pipe', 'pipe']
});

let response = '';
serverProcess.stdout.on('data', (data) => {
  response += data.toString();
});

serverProcess.stderr.on('data', (data) => {
  console.log('Server error:', data.toString());
});

setTimeout(() => {
  const request = {
    jsonrpc: '2.0',
    id: 1,
    method: 'prompts/list'
  };
  
  console.log('Sending request:', JSON.stringify(request));
  serverProcess.stdin.write(JSON.stringify(request) + '\n');
  
  setTimeout(() => {
    console.log('Response:', response || 'No response');
    serverProcess.kill();
  }, 2000);
}, 1000);