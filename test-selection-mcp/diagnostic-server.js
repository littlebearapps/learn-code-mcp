#!/usr/bin/env node

// Diagnostic MCP server to test prompt execution
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

  // Add a simple prompt without required arguments first
  server.registerPrompt('simple_test', 
    {
      title: 'Simple Test',
      description: 'Basic test prompt without arguments'
    },
    async () => {
      console.error('✅ Simple prompt executed successfully!');
      return {
        description: 'Basic test prompt without arguments',
        messages: [{
          role: 'user',
          content: [{
            type: 'text',
            text: 'This is a simple test prompt that worked!'
          }]
        }]
      };
    }
  );

  // Add a prompt with optional arguments
  server.registerPrompt('optional_test', 
    {
      title: 'Optional Test',
      description: 'Test prompt with optional argument',
      arguments: [{
        name: 'text',
        description: 'Optional text input',
        required: false
      }]
    },
    async ({ text }) => {
      console.error(`✅ Optional prompt executed with: ${text || 'no argument'}`);
      return {
        description: 'Test prompt with optional argument',
        messages: [{
          role: 'user',
          content: [{
            type: 'text',
            text: `Optional test: ${text || 'no argument provided'}`
          }]
        }]
      };
    }
  );

  // Add the original required argument prompt
  server.registerPrompt('required_test', 
    {
      title: 'Required Test',
      description: 'Test prompt with required argument',
      arguments: [{
        name: 'code',
        description: 'Code to explain',
        required: true
      }]
    },
    async ({ code }) => {
      console.error(`✅ Required prompt executed with: ${code}`);
      return {
        description: 'Test prompt with required argument',
        messages: [{
          role: 'user',
          content: [{
            type: 'text',
            text: `Explain this code:\n\`\`\`\n${code}\n\`\`\``
          }]
        }]
      };
    }
  );

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('🔧 Diagnostic server ready with 3 test prompts');
}

if (require.main === module) {
  main().catch(err => {
    console.error('Server failed:', err);
    process.exit(1);
  });
}