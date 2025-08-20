#!/usr/bin/env node

/**
 * Test using McpServer instead of low-level Server
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

console.error('Creating McpServer...');

const server = new McpServer({
  name: 'test-server',
  version: '1.0.0'
});

console.error('Registering test tool...');

server.registerTool(
  'test',
  {
    title: 'Test Tool',
    description: 'A simple test tool',
    inputSchema: { message: z.string() }
  },
  async ({ message }) => ({
    content: [{ type: 'text', text: `Echo: ${message}` }]
  })
);

console.error('Connecting to transport...');

const transport = new StdioServerTransport();
await server.connect(transport);

console.error('McpServer running on stdio...');