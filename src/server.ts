#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { 
  CallToolRequestSchema,
  ErrorCode,
  ListPromptsRequestSchema,
  ListToolsRequestSchema,
  McpError,
  GetPromptRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { SecretRedactor } from './lib/secret-redactor.js';
import { ConstructClassifier } from './lib/construct-classifier.js';
import { PreferencesManager } from './lib/preferences-manager.js';

/**
 * Learn Code MCP Server v0.1
 * 
 * Hybrid Architecture:
 * - Manual MCP prompts for any MCP client (Claude Desktop, etc.)
 * - explain_selection tool for VS Code extension communication
 * - CLI interface support via direct server communication
 */

interface CodeExplanationRequest {
  code: string;
  length: 'micro' | 'short' | 'paragraph' | 'deep';
  language?: string;
  filename?: string;
}

class LearnCodeMCPServer {
  private server: Server;
  private secretRedactor: SecretRedactor;
  private constructClassifier: ConstructClassifier;
  private preferencesManager: PreferencesManager;

  constructor() {
    this.server = new Server(
      {
        name: 'learn-code-mcp',
        version: '0.1.0',
      },
      {
        capabilities: {
          prompts: {},
          tools: {},
        },
      }
    );

    this.secretRedactor = new SecretRedactor();
    this.constructClassifier = new ConstructClassifier();
    this.preferencesManager = new PreferencesManager();

    this.setupHandlers();
  }

  private setupHandlers(): void {
    // Prompts handler - for manual MCP usage
    this.server.setRequestHandler(ListPromptsRequestSchema, async () => ({
      prompts: [
        {
          name: 'explain_micro',
          description: 'Micro explanation (1-3 lines) - paste code as argument',
          arguments: [
            {
              name: 'code',
              description: 'Code to explain (paste here)',
              required: true,
            },
            {
              name: 'language',
              description: 'Programming language (optional)',
              required: false,
            },
            {
              name: 'filename',
              description: 'Source filename for context (optional)',
              required: false,
            },
          ],
        },
        {
          name: 'explain_short',
          description: 'Short explanation (4-6 bullets) - paste code as argument',
          arguments: [
            {
              name: 'code',
              description: 'Code to explain (paste here)',
              required: true,
            },
            {
              name: 'language',
              description: 'Programming language (optional)',
              required: false,
            },
            {
              name: 'filename',
              description: 'Source filename for context (optional)',
              required: false,
            },
          ],
        },
        {
          name: 'explain_paragraph',
          description: 'Paragraph explanation (120-180 words + example) - paste code as argument',
          arguments: [
            {
              name: 'code',
              description: 'Code to explain (paste here)',
              required: true,
            },
            {
              name: 'language',
              description: 'Programming language (optional)',
              required: false,
            },
            {
              name: 'filename',
              description: 'Source filename for context (optional)',
              required: false,
            },
          ],
        },
        {
          name: 'explain_deep',
          description: 'Deep explanation (250-350 words + checklist) - paste code as argument',
          arguments: [
            {
              name: 'code',
              description: 'Code to explain (paste here)',
              required: true,
            },
            {
              name: 'language',
              description: 'Programming language (optional)',
              required: false,
            },
            {
              name: 'filename',
              description: 'Source filename for context (optional)',
              required: false,
            },
          ],
        },
      ],
    }));

    // Prompt generation handler
    this.server.setRequestHandler(GetPromptRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      
      if (!args?.code) {
        throw new McpError(ErrorCode.InvalidParams, 'Code argument is required');
      }

      const code = String(args.code);
      const language = args.language ? String(args.language) : undefined;
      const filename = args.filename ? String(args.filename) : undefined;

      // Apply secret redaction
      const redactedCode = this.secretRedactor.redact(code);
      
      // Get construct classification
      const classification = this.constructClassifier.classify(redactedCode, language);
      
      // Generate explanation prompt based on length preset
      const lengthPreset = name.replace('explain_', '') as 'micro' | 'short' | 'paragraph' | 'deep';
      const explanationPrompt = this.generateExplanationPrompt(redactedCode, lengthPreset, language, filename, classification);

      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: explanationPrompt,
            },
          },
        ],
      };
    });

    // Tools handler - for VS Code extension communication
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'explain_selection',
          description: 'Explain selected code with specified length preset (for VS Code extension)',
          inputSchema: {
            type: 'object',
            properties: {
              code: {
                type: 'string',
                description: 'Selected code text',
              },
              length: {
                type: 'string',
                enum: ['micro', 'short', 'paragraph', 'deep'],
                description: 'Length preset for explanation',
              },
              language: {
                type: 'string',
                description: 'Programming language (optional)',
              },
              filename: {
                type: 'string',
                description: 'Source filename for context (optional)',
              },
            },
            required: ['code', 'length'],
          },
        },
        {
          name: 'classify_construct',
          description: 'Classify code construct using regex patterns',
          inputSchema: {
            type: 'object',
            properties: {
              code: {
                type: 'string',
                description: 'Code to classify',
              },
              language: {
                type: 'string',
                description: 'Programming language hint (optional)',
              },
            },
            required: ['code'],
          },
        },
        {
          name: 'set_preferences',
          description: 'Configure output preferences and settings',
          inputSchema: {
            type: 'object',
            properties: {
              preferences: {
                type: 'object',
                description: 'Preference updates as JSON object',
              },
            },
            required: ['preferences'],
          },
        },
      ],
    }));

    // Tool execution handler
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'explain_selection':
            return this.handleExplainSelection(args as any);
          
          case 'classify_construct':
            return this.handleClassifyConstruct(args);
          
          case 'set_preferences':
            return this.handleSetPreferences(args);
          
          default:
            throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
        }
      } catch (error) {
        if (error instanceof McpError) {
          throw error;
        }
        throw new McpError(ErrorCode.InternalError, `Tool execution failed: ${error}`);
      }
    });
  }

  private generateExplanationPrompt(
    code: string,
    length: 'micro' | 'short' | 'paragraph' | 'deep',
    language?: string,
    filename?: string,
    classification?: { construct: string; confidence: number }
  ): string {
    const preferences = this.preferencesManager.getPreferences();
    
    // Build context
    let context = '';
    if (language) context += `Language: ${language}\n`;
    if (filename) context += `File: ${filename}\n`;
    if (classification) {
      context += `Construct: ${classification.construct} (confidence: ${classification.confidence.toFixed(2)})\n`;
    }
    
    // Length-specific prompts with token constraints
    const prompts = {
      micro: `Explain this ${language || 'code'} in exactly 1-3 bullet points (max 150 tokens):

${context ? context + '\n' : ''}Code:
\`\`\`${language || ''}
${code}
\`\`\`

Response format:
• [Brief explanation point]
• [Key purpose or usage]
• [Important caveat or tip if applicable]`,

      short: `Explain this ${language || 'code'} in exactly 4-6 bullet points (max 250 tokens):

${context ? context + '\n' : ''}Code:
\`\`\`${language || ''}
${code}
\`\`\`

Response format:
• [What this code does]
• [How it works or key mechanism]
• [Parameters/inputs and outputs]
• [When/why to use this pattern]
• [Common pitfalls or gotchas]
• [Best practices or tips]`,

      paragraph: `Explain this ${language || 'code'} in 120-180 words with a usage example (max 450 tokens):

${context ? context + '\n' : ''}Code:
\`\`\`${language || ''}
${code}
\`\`\`

Response format:
[Paragraph explanation covering purpose, mechanism, and usage context]

Usage example:
\`\`\`${language || ''}
[Simple, clear example showing how to use this code]
\`\`\``,

      deep: `Provide a comprehensive explanation of this ${language || 'code'} in 250-350 words with checklist (max 700 tokens):

${context ? context + '\n' : ''}Code:
\`\`\`${language || ''}
${code}
\`\`\`

Response format:
[Detailed explanation covering purpose, implementation details, patterns, trade-offs, and broader context]

**Understanding Checklist:**
- [ ] [Key concept 1]
- [ ] [Key concept 2]
- [ ] [Implementation detail]
- [ ] [Usage consideration]
- [ ] [Best practice or warning]`
    };

    return prompts[length];
  }

  private async handleExplainSelection(args: any) {
    const { code, length, language, filename } = args as CodeExplanationRequest;

    if (!code || !length) {
      throw new McpError(ErrorCode.InvalidParams, 'Code and length are required');
    }

    // Apply secret redaction
    const redactedCode = this.secretRedactor.redact(code);
    
    // Get construct classification
    const classification = this.constructClassifier.classify(redactedCode, language);
    
    // Generate explanation prompt
    const explanationPrompt = this.generateExplanationPrompt(
      redactedCode,
      length,
      language,
      filename,
      classification
    );

    return {
      content: [
        {
          type: 'text',
          text: `Generated explanation prompt for VS Code extension:

${explanationPrompt}

Note: This prompt should be sent to your LLM for processing. The VS Code extension will handle the LLM communication and display the response.`,
        },
      ],
    };
  }

  private async handleClassifyConstruct(args: any) {
    const { code, language } = args;

    if (!code) {
      throw new McpError(ErrorCode.InvalidParams, 'Code is required');
    }

    const classification = this.constructClassifier.classify(String(code), language);

    return {
      content: [
        {
          type: 'text',
          text: `Construct: ${classification.construct} (confidence: ${classification.confidence.toFixed(2)})`,
        },
      ],
    };
  }

  private async handleSetPreferences(args: any) {
    const { preferences } = args;

    if (!preferences) {
      throw new McpError(ErrorCode.InvalidParams, 'Preferences object is required');
    }

    this.preferencesManager.updatePreferences(preferences);

    return {
      content: [
        {
          type: 'text',
          text: 'Preferences updated successfully',
        },
      ],
    };
  }

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Learn Code MCP Server v0.1 running on stdio');
  }
}

// Main execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const server = new LearnCodeMCPServer();
  server.run().catch((error) => {
    console.error('Server failed to start:', error);
    process.exit(1);
  });
}

export { LearnCodeMCPServer };