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
import { createResponseStreamer } from './lib/response-streamer.js';

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
  context?: WorkspaceContext;
}

interface WorkspaceContext {
  repo?: {
    rootName: string;
    gitBranch?: string;
    isMonorepo?: boolean;
  };
  project?: {
    type: string;
    manifestPath?: string;
    frameworkHints?: string[];
    testFramework?: string;
  };
  deps?: string[];
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
            {
              name: 'context',
              description: 'Workspace context (project info, frameworks, dependencies) - JSON object (optional)',
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
            {
              name: 'context',
              description: 'Workspace context (project info, frameworks, dependencies) - JSON object (optional)',
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
            {
              name: 'context',
              description: 'Workspace context (project info, frameworks, dependencies) - JSON object (optional)',
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
            {
              name: 'context',
              description: 'Workspace context (project info, frameworks, dependencies) - JSON object (optional)',
              required: false,
            },
          ],
        },
      ],
    }));

    // Prompt generation handler
    this.server.setRequestHandler(GetPromptRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      
      // Handle different argument formats from different MCP clients
      let code: string;
      if (args?.code) {
        code = String(args.code);
      } else if (typeof args === 'string') {
        // Handle case where code is passed directly as string
        code = args;
      } else if (Array.isArray(args) && args.length > 0) {
        // Handle case where code is passed as first array element
        code = String(args[0]);
      } else {
        throw new McpError(ErrorCode.InvalidParams, 'Code argument is required');
      }

      const language = args?.language ? String(args.language) : undefined;
      const filename = args?.filename ? String(args.filename) : undefined;
      const context = args?.context as WorkspaceContext | undefined;

      // Apply detailed secret redaction
      const redactionResult = this.secretRedactor.getRedactionDetails(code);
      const { redactedCode, secretsFound, redactionNotices } = redactionResult;
      
      // Get construct classification
      const classification = this.constructClassifier.classify(redactedCode, language);
      
      // Generate explanation prompt based on length preset with workspace context
      const lengthPreset = name.replace('explain_', '') as 'micro' | 'short' | 'paragraph' | 'deep';
      let explanationPrompt = this.generateExplanationPrompt(redactedCode, lengthPreset, language, filename, classification, context);
      
      // Add security notice to prompt if secrets were redacted
      if (secretsFound > 0) {
        explanationPrompt += `\n\n🔒 Security Note: ${secretsFound} potential secret${secretsFound > 1 ? 's' : ''} were redacted from this code (${redactionNotices.join(', ')}). Please provide explanation based on the redacted version.`;
      }

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
              context: {
                type: 'object',
                description: 'Workspace context (project info, frameworks, dependencies) for enhanced explanations (optional)',
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
    classification?: { construct: string; confidence: number },
    workspaceContext?: WorkspaceContext
  ): string {
    // Build context with workspace information
    let context = '';
    if (language) context += `Language: ${language}\n`;
    if (filename) context += `File: ${filename}\n`;
    if (classification) {
      context += `Construct: ${classification.construct} (confidence: ${classification.confidence.toFixed(2)})\n`;
    }
    
    // Add workspace context for better explanations
    if (workspaceContext?.repo) {
      context += `Project: ${workspaceContext.repo.rootName}`;
      if (workspaceContext.repo.gitBranch) {
        context += ` (${workspaceContext.repo.gitBranch} branch)`;
      }
      context += '\n';
      if (workspaceContext.repo.isMonorepo) {
        context += `Architecture: Monorepo structure\n`;
      }
    }
    
    if (workspaceContext?.project) {
      context += `Project Type: ${workspaceContext.project.type}\n`;
      if (workspaceContext.project.frameworkHints?.length) {
        context += `Frameworks: ${workspaceContext.project.frameworkHints.join(', ')}\n`;
      }
      if (workspaceContext.project.testFramework) {
        context += `Testing: ${workspaceContext.project.testFramework}\n`;
      }
    }
    
    if (workspaceContext?.deps?.length) {
      const relevantDeps = workspaceContext.deps.slice(0, 5); // Limit to top 5 for brevity
      context += `Key Dependencies: ${relevantDeps.join(', ')}\n`;
    }
    
    // Enhanced context-aware prompts
    const projectContext = workspaceContext?.project ? ` within the ${workspaceContext.project.type} project` : '';
    const frameworkContext = workspaceContext?.project?.frameworkHints?.length 
      ? ` using ${workspaceContext.project.frameworkHints[0]}` 
      : '';
    
    const prompts = {
      micro: `Explain this ${language || 'code'}${projectContext} in exactly 1-3 bullet points (max 150 tokens):

${context ? context + '\n' : ''}Code:
\`\`\`${language || ''}
${code}
\`\`\`

Instructions: Focus on the core purpose and immediate value${frameworkContext ? ` within the ${frameworkContext} ecosystem` : ''}. Be concise but informative.

Response format:
• [Brief explanation of what this does]
• [Key purpose or usage in project context]
• [Important caveat or tip if applicable]`,

      short: `Explain this ${language || 'code'}${projectContext} in exactly 4-6 bullet points (max 250 tokens):

${context ? context + '\n' : ''}Code:
\`\`\`${language || ''}
${code}
\`\`\`

Instructions: Provide practical insights${frameworkContext ? ` for ${frameworkContext} development` : ''}. Include both technical details and usage guidance.

Response format:
• [What this code does and its main purpose]
• [How it works or key mechanism${frameworkContext ? ` in ${frameworkContext}` : ''}]
• [Parameters/inputs and expected outputs]
• [When/why to use this pattern in your project]
• [Common pitfalls or gotchas to avoid]
• [Best practices or optimization tips]`,

      paragraph: `Explain this ${language || 'code'}${projectContext} in 120-180 words with a usage example (max 450 tokens):

${context ? context + '\n' : ''}Code:
\`\`\`${language || ''}
${code}
\`\`\`

Instructions: Provide a comprehensive explanation that considers the project context${frameworkContext ? ` and ${frameworkContext} patterns` : ''}. Include practical usage guidance.

Response format:
[Paragraph explanation covering purpose, mechanism, and usage context${frameworkContext ? ` within ${frameworkContext}` : ''}. Consider how this fits into the broader project architecture and development workflow.]

Usage example:
\`\`\`${language || ''}
// Example showing practical usage${frameworkContext ? ` in ${frameworkContext}` : ''}
[Simple, clear example demonstrating how to use this code in practice]
\`\`\``,

      deep: `Provide a comprehensive explanation of this ${language || 'code'}${projectContext} in 250-350 words with checklist (max 700 tokens):

${context ? context + '\n' : ''}Code:
\`\`\`${language || ''}
${code}
\`\`\`

Instructions: Analyze this code thoroughly considering the project architecture${frameworkContext ? `, ${frameworkContext} patterns,` : ''} and development context. Include implementation details, design decisions, and broader implications.

Response format:
[Detailed explanation covering purpose, implementation details, architectural patterns, trade-offs, and broader context${frameworkContext ? ` within the ${frameworkContext} ecosystem` : ''}. Discuss how this integrates with the project structure and contributes to the overall codebase.]

**Understanding Checklist:**
- [ ] Core functionality and purpose${projectContext ? ` in this ${workspaceContext?.project?.type} project` : ''}
- [ ] Implementation approach and key technical details
- [ ] Integration points${frameworkContext ? ` with ${frameworkContext}` : ''} and dependencies
- [ ] Usage patterns and best practices for this context
- [ ] Potential issues, optimizations, or architectural considerations`
    };

    return prompts[length];
  }

  private async handleExplainSelection(args: any) {
    const { code, length, language, filename, context } = args as CodeExplanationRequest;

    if (!code || !length) {
      throw new McpError(ErrorCode.InvalidParams, 'Code and length are required');
    }

    // Create response streamer for progress tracking
    const streamer = createResponseStreamer();
    streamer.progress('Analyzing code for security issues...');

    // Apply detailed secret redaction
    const redactionResult = this.secretRedactor.getRedactionDetails(code);
    const { redactedCode, secretsFound, redactionNotices } = redactionResult;
    
    // Prepare enhanced redaction notice
    let redactionNotice = '';
    if (secretsFound > 0) {
      redactionNotice = `\n🔒 Security Notice: ${secretsFound} potential secret${secretsFound > 1 ? 's' : ''} redacted for privacy.`;
      redactionNotice += `\n   Redacted: ${redactionNotices.join(', ')}`;
      streamer.notice(`Secret redaction: ${redactionNotices.join(', ')}`);
    }
    
    streamer.progress('Classifying code construct...');
    
    // Get construct classification
    const classification = this.constructClassifier.classify(redactedCode, language);
    
    streamer.progress('Generating context-aware explanation prompt...');
    
    // Generate explanation prompt with workspace context
    const explanationPrompt = this.generateExplanationPrompt(
      redactedCode,
      length,
      language,
      filename,
      classification,
      context
    );

    streamer.content('Explanation prompt generated successfully');
    streamer.complete();

    // Enhanced response with streaming metadata
    const responseText = `Generated explanation prompt for VS Code extension:

${explanationPrompt}${redactionNotice}

📊 Processing Summary:
- Code construct: ${classification.construct} (${(classification.confidence * 100).toFixed(0)}% confidence)
- Security check: ${secretsFound > 0 ? `${secretsFound} secret(s) redacted` : 'No secrets detected'}
- Context: ${context ? 'Workspace context included' : 'No workspace context'}
- Processing time: ${Date.now() - (streamer.getAllChunks()[0]?.timestamp || Date.now())}ms

Note: This prompt should be sent to your LLM for processing. The VS Code extension will handle the LLM communication and display the response.`;

    return {
      content: [
        {
          type: 'text',
          text: responseText,
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
    
    // Keep process alive to handle incoming requests
    // The transport will handle JSON-RPC messages via stdio
    return new Promise(() => {
      // This promise never resolves, keeping the process alive
      // The transport will handle all MCP communication
    });
  }
}

// Main execution
import { pathToFileURL } from 'url';

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const server = new LearnCodeMCPServer();
  server.run().catch((error) => {
    console.error('Server failed to start:', error);
    process.exit(1);
  });
}

export { LearnCodeMCPServer };