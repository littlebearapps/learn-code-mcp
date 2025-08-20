#!/usr/bin/env node

// Ultra-minimal MCP server for testing
const { McpServer } = require('@modelcontextprotocol/sdk/server/mcp.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');

async function main() {
  const server = new McpServer({ name: 'minimal-test', version: '0.1.0' });
  
  // Register a simple prompt
  server.registerPrompt('simple_test', 
    {
      title: 'Simple Test',
      description: 'Basic test prompt',
      arguments: [{ name: 'text', description: 'Any text', required: true }]
    },
    async ({ text }) => ({
      messages: [{ role: 'user', content: { type: 'text', text: `You said: ${text}` } }]
    })
  );

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(console.error);