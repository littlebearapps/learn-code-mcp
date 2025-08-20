/**
 * Learn Code VS Code Extension
 * Provides context-aware code explanations via Chat Participant + MCP Server
 */

import * as vscode from 'vscode';
import * as path from 'path';
import { collectWorkspaceContext } from './context';
import { 
  ExplainPromptRequest, 
  ExplainStyle, 
  LearnCodeConfig
} from './types';

export function activate(context: vscode.ExtensionContext) {
  console.log('Learn Code extension is now active!');

  // Register MCP Server Definition Provider
  registerMcpServer(context);

  // Register Chat Participant
  registerChatParticipant(context);

  // Register Commands
  registerCommands(context);
}

function registerMcpServer(context: vscode.ExtensionContext) {
  const didChangeEmitter = new vscode.EventEmitter<void>();
  
  const provider = vscode.lm.registerMcpServerDefinitionProvider('learn-code-provider', {
    onDidChangeMcpServerDefinitions: didChangeEmitter.event,
    
    provideMcpServerDefinitions: async () => {
      const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
      if (!workspaceFolder) {
        return [];
      }

      // Path to the MCP server relative to workspace root (where the Learn Code MCP project is)
      const serverPath = path.join(workspaceFolder.uri.fsPath, 'dist', 'server.js');
      
      const server = new vscode.McpStdioServerDefinition(
        'learn-code',    // label
        'node',          // command
        [serverPath]     // args
      );

      return [server];
    },
    
    resolveMcpServerDefinition: async (server: vscode.McpServerDefinition) => {
      // Additional resolution logic if needed (e.g., authentication)
      // For now, just return the server as-is
      return server;
    }
  });

  context.subscriptions.push(provider);
}

function registerChatParticipant(context: vscode.ExtensionContext) {
  const participant = vscode.chat.createChatParticipant('learn-code', async (request: vscode.ChatRequest, _context: vscode.ChatContext, stream: vscode.ChatResponseStream) => {
    const { command, prompt } = request;
    
    try {
      switch (command) {
        case 'explain':
          await handleExplainCommand(prompt, stream);
          break;
        case 'classify':
          await handleClassifyCommand(stream);
          break;
        default:
          stream.markdown('Available commands: `/explain [micro|short|paragraph|deep]`, `/classify`');
          break;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      stream.markdown(`❌ Error: ${errorMessage}`);
    }
  });

  context.subscriptions.push(participant);
}

async function handleExplainCommand(promptText: string, stream: vscode.ChatResponseStream) {
  const editor = vscode.window.activeTextEditor;
  const doc = editor?.document;
  const selection = editor?.selection;

  if (!doc) {
    stream.markdown('❌ No active editor. Open a file and try again.');
    return;
  }

  // Get code from selection or entire document
  const code = selection && !selection.isEmpty
    ? doc.getText(selection)
    : doc.getText();

  if (!code?.trim()) {
    stream.markdown('❌ Nothing to explain. Select code or open a non-empty file.');
    return;
  }

  // Get configuration
  const config = getLearnCodeConfig();
  
  // Determine explanation style from prompt text (e.g., "micro", "short", "paragraph", "deep")
  const words = promptText.toLowerCase().split(/\s+/);
  const styleWords = ['micro', 'short', 'paragraph', 'deep'];
  const foundStyle = words.find(word => styleWords.includes(word));
  const style = (foundStyle as ExplainStyle) || config.defaultsStyle;
  if (!['micro', 'short', 'paragraph', 'deep'].includes(style)) {
    stream.markdown('❌ Invalid style. Use: micro, short, paragraph, or deep');
    return;
  }

  const cwd = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || '';

  // Show progress
  stream.progress('Collecting workspace context...');

  // Collect workspace context
  const contextPayload = await collectWorkspaceContext({
    level: config.contextEnable,
    maxDeps: config.contextMaxDeps,
    denylistGlobs: ['**/node_modules/**', '**/.git/**', '**/dist/**', '**/out/**', '**/build/**'],
    anonymizePaths: config.privacyAnonymizePaths,
    cwd,
    cacheTtlMs: 60_000
  });

  // Build request payload
  const payload: ExplainPromptRequest = {
    type: 'explain',
    style,
    code,
    filePath: doc.uri.fsPath,
    languageId: doc.languageId,
    context: contextPayload
  };

  stream.progress('Generating explanation...');

  // Request explanation through VS Code's language model with MCP context
  // The MCP server will be automatically available through VS Code's integration
  const mcpPromptName = `mcp.learn-code.explain_${style}`;
  
  try {
    // Use VS Code chat integration to invoke MCP prompts
    const chatRequest = `Use the MCP prompt "${mcpPromptName}" to explain this code with ${style} detail level. Include the workspace context provided.

Code to explain:
\`\`\`${payload.languageId || ''}
${payload.code}
\`\`\`

Context: ${JSON.stringify(payload.context, null, 2)}`;

    // For now, provide a rich explanation response
    // When the MCP server is implemented, this will automatically use the MCP prompt
    await simulateExplanationResponse(payload, stream);
    
    // Add context info
    if (contextPayload?.repo?.gitBranch) {
      stream.markdown(`\n*Context: ${contextPayload.repo.rootName} (${contextPayload.repo.gitBranch} branch)*`);
    }
  } catch (error) {
    console.error('MCP integration error:', error);
    stream.markdown(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function handleClassifyCommand(stream: vscode.ChatResponseStream) {
  const editor = vscode.window.activeTextEditor;
  const doc = editor?.document;
  const selection = editor?.selection;

  if (!doc) {
    stream.markdown('❌ No active editor. Open a file and try again.');
    return;
  }

  const code = selection && !selection.isEmpty
    ? doc.getText(selection)
    : doc.getText();

  if (!code?.trim()) {
    stream.markdown('❌ Nothing to classify. Select code or open a non-empty file.');
    return;
  }

  stream.progress('Classifying code construct...');

  try {
    // When MCP server is implemented, this will use the classify_construct tool
    // For now, provide classification through simulation
    await simulateClassificationResponse(code, doc.languageId, stream);
  } catch (error) {
    console.error('Classification error:', error);
    stream.markdown(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function simulateExplanationResponse(payload: ExplainPromptRequest, stream: vscode.ChatResponseStream) {
  // Simulate processing time
  await new Promise(resolve => setTimeout(resolve, 1000));

  const { style, languageId, context } = payload;
  
  let explanation = '';
  switch (style) {
    case 'micro':
      explanation = `• **${languageId || 'Code'}** construct performing specific operation\n• Executes with defined inputs and outputs\n• Used for ${context?.project?.type || 'general'} applications`;
      break;
    case 'short':
      explanation = `• **Purpose**: ${languageId || 'Code'} construct performing specific operation\n• **Function**: Executes logic with defined parameters\n• **Context**: Used in ${context?.project?.type || 'general'} projects\n• **Framework**: ${context?.project?.frameworkHints?.[0] || 'Standard'} patterns\n• **Dependencies**: ${context?.deps?.length || 0} packages available\n• **Best Practice**: Follow ${context?.project?.testFramework || 'standard'} testing patterns`;
      break;
    case 'paragraph':
      explanation = `This ${languageId || 'code'} construct represents a ${context?.project?.type || 'general purpose'} implementation that executes specific logic within your ${context?.repo?.rootName || 'project'} codebase. The code follows ${context?.project?.frameworkHints?.[0] || 'standard'} patterns and integrates with ${context?.deps?.length || 0} dependencies. It's designed to work within the ${context?.project?.type || 'application'} ecosystem and can be tested using ${context?.project?.testFramework || 'standard testing frameworks'}.\n\n\`\`\`${languageId || ''}\n// Example usage:\n// Call this construct with appropriate parameters\n// Handle return values according to your application needs\n\`\`\``;
      break;
    case 'deep':
      explanation = `This ${languageId || 'code'} construct is a fundamental component of your ${context?.repo?.rootName || 'project'} ${context?.project?.type || 'application'}. It operates within the ${context?.project?.frameworkHints?.join(', ') || 'standard'} framework ecosystem and leverages ${context?.deps?.length || 0} dependencies from your project manifest.\n\nThe implementation follows ${context?.project?.type || 'general'} best practices and integrates seamlessly with your existing ${context?.repo?.isMonorepo ? 'monorepo' : 'single-repo'} structure. The code is designed to be maintainable, testable with ${context?.project?.testFramework || 'standard frameworks'}, and scalable within your current architecture.\n\n**Understanding Checklist:**\n- [ ] Understand the primary function and purpose\n- [ ] Identify input parameters and expected outputs  \n- [ ] Review integration points with ${context?.project?.frameworkHints?.[0] || 'your framework'}\n- [ ] Consider testing strategy using ${context?.project?.testFramework || 'appropriate tools'}\n- [ ] Evaluate performance implications in ${context?.project?.type || 'your'} context`;
      break;
  }

  // Add context info if available
  if (context?.repo?.gitBranch) {
    explanation += `\n\n*Context: ${context.repo.rootName} (${context.repo.gitBranch} branch)*`;
  }

  stream.markdown(explanation);
}

async function simulateClassificationResponse(code: string, languageId: string, stream: vscode.ChatResponseStream) {
  // Simulate processing time
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Simple classification based on code patterns
  let kind = 'unknown';
  let confidence = 0.5;
  
  if (code.includes('function') || code.includes('def ') || code.includes('func ')) {
    kind = 'function';
    confidence = 0.8;
  } else if (code.includes('class ') || code.includes('interface ')) {
    kind = 'class';
    confidence = 0.9;
  } else if (code.includes('test') || code.includes('describe') || code.includes('it(')) {
    kind = 'test';
    confidence = 0.8;
  } else if (code.includes('use') && languageId === 'javascript') {
    kind = 'hook';
    confidence = 0.7;
  }
  
  stream.markdown(`**Classification**: ${kind} (confidence: ${confidence.toFixed(2)})\n**Language**: ${languageId}`);
}

function registerCommands(context: vscode.ExtensionContext) {
  // Settings command
  const openSettings = vscode.commands.registerCommand('learnCode.openSettings', () => {
    vscode.commands.executeCommand('workbench.action.openSettings', 'Learn Code');
  });

  // Direct explanation commands
  const explainMicro = vscode.commands.registerCommand('learnCode.explain.micro', () => {
    vscode.commands.executeCommand('workbench.action.chat.open', '@learn-code /explain micro');
  });

  const explainShort = vscode.commands.registerCommand('learnCode.explain.short', () => {
    vscode.commands.executeCommand('workbench.action.chat.open', '@learn-code /explain short');
  });

  const explainParagraph = vscode.commands.registerCommand('learnCode.explain.paragraph', () => {
    vscode.commands.executeCommand('workbench.action.chat.open', '@learn-code /explain paragraph');
  });

  const explainDeep = vscode.commands.registerCommand('learnCode.explain.deep', () => {
    vscode.commands.executeCommand('workbench.action.chat.open', '@learn-code /explain deep');
  });

  context.subscriptions.push(
    openSettings,
    explainMicro,
    explainShort,
    explainParagraph,
    explainDeep
  );
}

function getLearnCodeConfig(): LearnCodeConfig {
  const config = vscode.workspace.getConfiguration('learnCode');
  return {
    contextEnable: config.get<'off' | 'light' | 'full'>('context.enable', 'light'),
    contextMaxDeps: config.get<number>('context.maxDeps', 20),
    privacyAnonymizePaths: config.get<boolean>('privacy.anonymizePaths', true),
    defaultsStyle: config.get<'micro' | 'short' | 'paragraph' | 'deep'>('defaults.style', 'short')
  };
}


export function deactivate() {
  console.log('Learn Code extension deactivated');
}