#!/usr/bin/env node

/**
 * Direct test of server startup with detailed logging
 */

import { LearnCodeMCPServer } from './dist/server.js';

console.error('Creating server instance...');

try {
  const server = new LearnCodeMCPServer();
  console.error('Server created successfully');
  
  console.error('Starting server...');
  await server.run();
  console.error('Server run() completed');
} catch (error) {
  console.error('Server failed:', error);
  process.exit(1);
}