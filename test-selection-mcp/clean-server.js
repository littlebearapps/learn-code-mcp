#!/usr/bin/env node

// Ultra-clean MCP server following GPT-5 recommendations
process.on('uncaughtException', (e) => { 
  try { console.error('[uncaughtException]', e); } catch {} 
  process.exit(1); 
});

process.on('unhandledRejection', (e) => { 
  try { console.error('[unhandledRejection]', e); } catch {} 
  process.exit(1); 
});

// Ensure no stdout contamination
console.log = console.error.bind(console);

async function main() {
  const { McpServer } = require('@modelcontextprotocol/sdk/server/mcp.js');
  const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');

  const server = new McpServer({
    name: 'test-learn-code',
    version: '0.1.0'
  });

  // Register prompts (fast, no heavy IO)
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

  // Connect ASAP - no stdout noise
  const transport = new StdioServerTransport();
  await server.connect(transport);
  
  // Do NOT exit - let MCP SDK keep event loop alive
}

if (require.main === module) {
  main().catch(err => {
    console.error('Server failed:', err);
    process.exit(1);
  });
}