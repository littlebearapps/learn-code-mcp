#!/usr/bin/env node

// Debug version with extensive logging
console.error('=== DEBUG SERVER STARTING ===');

try {
  const { McpServer } = require('@modelcontextprotocol/sdk/server/mcp.js');
  const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
  
  console.error('✅ SDK imports successful');

  const server = new McpServer({
    name: 'test-learn-code',
    version: '0.1.0'
  });
  
  console.error('✅ McpServer created');

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
    async ({ selection }) => {
      console.error(`✅ Prompt called with selection: ${selection?.substring(0, 50)}...`);
      return {
        messages: [{
          role: 'user',
          content: {
            type: 'text',
            text: `Explain this code:\n\`\`\`\n${selection}\n\`\`\``
          }
        }]
      };
    }
  );
  
  console.error('✅ Prompt registered');

  const transport = new StdioServerTransport();
  console.error('✅ Transport created');
  
  server.connect(transport).then(() => {
    console.error('✅ Server connected successfully');
    console.error('🔄 Server running and waiting for requests...');
  }).catch(err => {
    console.error('❌ Connection failed:', err.message);
    process.exit(1);
  });

} catch (error) {
  console.error('❌ Server startup failed:', error.message);
  console.error('Stack:', error.stack);
  process.exit(1);
}