#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { ListPromptsRequestSchema } from '@modelcontextprotocol/sdk/types.js';

async function testMinimalMCP() {
  console.error('Creating minimal MCP server...');
  
  const server = new Server(
    {
      name: 'minimal-test',
      version: '0.1.0',
    },
    {
      capabilities: {
        prompts: {},
      },
    }
  );

  // Simple prompt handler
  server.setRequestHandler(ListPromptsRequestSchema, async () => ({
    prompts: [
      {
        name: 'test',
        description: 'Test prompt',
        arguments: []
      }
    ]
  }));

  console.error('Connecting to stdio transport...');
  const transport = new StdioServerTransport();
  await server.connect(transport);
  
  console.error('Minimal MCP server running...');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  testMinimalMCP().catch((error) => {
    console.error('Minimal MCP server failed:', error);
    process.exit(1);
  });
}