#!/usr/bin/env node

import { spawn } from 'child_process';

const server = spawn('node', ['test-minimal-mcp.js'], {
  stdio: ['pipe', 'pipe', 'pipe']
});

server.stderr.on('data', (data) => {
  console.log('STDERR:', data.toString().trim());
});

server.stdout.on('data', (data) => {
  console.log('STDOUT:', data.toString().trim());
});

server.on('close', (code) => {
  console.log(`Server exited with code: ${code}`);
  process.exit(0);
});

console.log('Starting minimal server...');

setTimeout(() => {
  console.log('Sending JSON-RPC request...');
  server.stdin.write('{"jsonrpc":"2.0","id":1,"method":"prompts/list"}\n');
  
  setTimeout(() => {
    console.log('Killing server...');
    server.kill();
  }, 2000);
}, 1000);