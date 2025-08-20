#!/usr/bin/env node

// Simple wrapper to start the MCP server
import { LearnCodeMCPServer } from './dist/server.js';

console.error('Starting Learn Code MCP Server...');

const server = new LearnCodeMCPServer();
await server.run();