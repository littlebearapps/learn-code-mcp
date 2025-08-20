#!/usr/bin/env node
const { McpServer } = require('@modelcontextprotocol/sdk/server/mcp.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');

// Create MCP server using modern API from GitHub docs
const server = new McpServer({
  name: 'test-learn-code',
  version: '0.1.0'
});

// Register prompts  
server.registerPrompt('test_explain', 
  {
    title: 'Test Explanation Prompt',
    description: 'Test explanation prompt for selection',
    arguments: [{
      name: 'selection',
      description: 'Selected code',
      required: true
    }]
  },
  async ({ selection }) => ({
    messages: [{
      role: 'user',
      content: {
        type: 'text',
        text: `Explain this code:\n\`\`\`\n${selection}\n\`\`\``
      }
    }]
  })
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Test MCP server started');
}

if (require.main === module) {
  main().catch(console.error);
}