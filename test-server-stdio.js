#!/usr/bin/env node

import { spawn } from 'child_process';

console.log('Starting server test...');

const server = spawn('node', ['dist/server.js'], {
  stdio: ['pipe', 'pipe', 'pipe']
});

let hasOutput = false;

server.stdout.on('data', (data) => {
  hasOutput = true;
  console.log('STDOUT:', data.toString());
});

server.stderr.on('data', (data) => {
  hasOutput = true;
  console.log('STDERR:', data.toString());
});

server.on('close', (code) => {
  console.log(`Server closed with code ${code}`);
});

server.on('error', (error) => {
  console.log('Server error:', error.message);
});

// Send a test message after 1 second
setTimeout(() => {
  console.log('Sending test message...');
  server.stdin.write('{"jsonrpc":"2.0","id":1,"method":"prompts/list"}\n');
  
  // Kill after 2 more seconds
  setTimeout(() => {
    if (!hasOutput) {
      console.log('No output received from server');
    }
    server.kill();
    process.exit(0);
  }, 2000);
}, 1000);