#!/usr/bin/env node

/**
 * Learn Code MCP CLI Wrapper
 * 
 * Provides terminal access to the MCP server functionality
 * Supports file input, stdin pipelines, and direct code input
 */

import { spawn } from 'child_process';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface CLIOptions {
  length: 'micro' | 'short' | 'paragraph' | 'deep';
  language?: string;
  filename?: string;
  format: 'markdown' | 'plain';
  color: boolean;
  redact: boolean;
  debug: boolean;
  lines?: string;
}

class LearnCodeCLI {
  private defaultOptions: CLIOptions = {
    length: 'short',
    format: 'markdown',
    color: true,
    redact: true,
    debug: false
  };

  async run(): Promise<void> {
    const args = process.argv.slice(2);
    const options = this.parseArguments(args);
    
    if (options.debug) {
      console.error('Debug mode enabled');
      console.error('Options:', options);
    }

    try {
      const code = await this.getCodeInput(args, options);
      if (!code.trim()) {
        this.showUsage();
        process.exit(1);
      }

      const explanation = await this.explainCode(code, options);
      console.log(explanation);
    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  }

  private parseArguments(args: string[]): CLIOptions & { inputFile?: string } {
    const options = { ...this.defaultOptions };
    let inputFile: string | undefined;

    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      const nextArg = args[i + 1];

      switch (arg) {
        case '--length':
        case '-l':
          if (!nextArg || !['micro', 'short', 'paragraph', 'deep'].includes(nextArg)) {
            throw new Error('Invalid length. Use: micro, short, paragraph, or deep');
          }
          options.length = nextArg as any;
          i++;
          break;

        case '--language':
          if (!nextArg) {
            throw new Error('Language option requires a value');
          }
          options.language = nextArg;
          i++;
          break;

        case '--filename':
          if (!nextArg) {
            throw new Error('Filename option requires a value');
          }
          options.filename = nextArg;
          i++;
          break;

        case '--lines':
          if (!nextArg || !/^\d+-\d+$/.test(nextArg)) {
            throw new Error('Lines option must be in format: start-end (e.g., 10-20)');
          }
          options.lines = nextArg;
          i++;
          break;

        case '--format':
          if (!nextArg || !['markdown', 'plain'].includes(nextArg)) {
            throw new Error('Format must be: markdown or plain');
          }
          options.format = nextArg as any;
          i++;
          break;

        case '--no-color':
          options.color = false;
          break;

        case '--no-redact':
          options.redact = false;
          break;

        case '--debug':
          options.debug = true;
          break;

        case '--help':
        case '-h':
          this.showUsage();
          process.exit(0);

        default:
          if (!arg.startsWith('-') && !inputFile) {
            inputFile = arg;
          }
          break;
      }
    }

    return { ...options, inputFile };
  }

  private async getCodeInput(args: string[], options: CLIOptions & { inputFile?: string }): Promise<string> {
    // If file is specified, read from file
    if (options.inputFile) {
      try {
        let content = readFileSync(options.inputFile, 'utf8');
        
        // Apply line range if specified
        if (options.lines) {
          const [start, end] = options.lines.split('-').map(Number);
          const lines = content.split('\n');
          content = lines.slice(start - 1, end).join('\n');
        }
        
        // Auto-detect language from file extension if not provided
        if (!options.language) {
          const ext = options.inputFile.split('.').pop()?.toLowerCase();
          options.language = this.getLanguageFromExtension(ext);
        }
        
        // Set filename for context
        if (!options.filename) {
          options.filename = options.inputFile;
        }
        
        return content;
      } catch (error) {
        throw new Error(`Failed to read file '${options.inputFile}': ${error}`);
      }
    }

    // Check if stdin has data
    if (!process.stdin.isTTY) {
      return new Promise((resolve, reject) => {
        let input = '';
        
        process.stdin.setEncoding('utf8');
        process.stdin.on('data', (chunk) => {
          input += chunk;
        });
        
        process.stdin.on('end', () => {
          resolve(input);
        });
        
        process.stdin.on('error', (error) => {
          reject(new Error(`Failed to read from stdin: ${error.message}`));
        });
      });
    }

    // No input provided
    return '';
  }

  private async explainCode(code: string, options: CLIOptions): Promise<string> {
    return new Promise((resolve, reject) => {
      const serverPath = join(__dirname, 'server.js');
      
      // Spawn MCP server
      const server = spawn('node', [serverPath], {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let output = '';
      let error = '';

      server.stdout.on('data', (data) => {
        output += data.toString();
      });

      server.stderr.on('data', (data) => {
        error += data.toString();
        if (options.debug) {
          console.error('Server stderr:', data.toString());
        }
      });

      server.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`Server exited with code ${code}: ${error}`));
          return;
        }

        try {
          // Parse MCP responses to extract explanation
          const explanation = this.extractExplanationFromMCPOutput(output);
          const formatted = this.formatOutput(explanation, options);
          resolve(formatted);
        } catch (parseError) {
          reject(new Error(`Failed to parse server output: ${parseError}`));
        }
      });

      server.on('error', (err) => {
        reject(new Error(`Failed to start server: ${err.message}`));
      });

      // Send MCP commands to server
      const mcpCommands = this.generateMCPCommands(code, options);
      
      mcpCommands.forEach((command, index) => {
        setTimeout(() => {
          server.stdin.write(JSON.stringify(command) + '\n');
          if (index === mcpCommands.length - 1) {
            server.stdin.end();
          }
        }, index * 100);
      });
    });
  }

  private generateMCPCommands(code: string, options: CLIOptions): any[] {
    return [
      // Initialize
      {
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
          protocolVersion: '2024-11-05',
          capabilities: {}
        }
      },
      // Call explain_selection tool
      {
        jsonrpc: '2.0',
        id: 2,
        method: 'tools/call',
        params: {
          name: 'explain_selection',
          arguments: {
            code,
            length: options.length,
            language: options.language,
            filename: options.filename
          }
        }
      }
    ];
  }

  private extractExplanationFromMCPOutput(output: string): string {
    try {
      const lines = output.split('\n').filter(line => line.trim());
      
      for (const line of lines) {
        try {
          const response = JSON.parse(line);
          if (response.result?.content?.[0]?.text) {
            return response.result.content[0].text;
          }
        } catch {
          // Skip non-JSON lines
        }
      }
      
      // Fallback: return the output as-is
      return output;
    } catch {
      return output;
    }
  }

  private formatOutput(explanation: string, options: CLIOptions): string {
    let formatted = explanation;

    // Apply format-specific styling
    if (options.format === 'plain') {
      // Remove markdown formatting for plain text
      formatted = formatted
        .replace(/```[\s\S]*?```/g, (match) => {
          return match.replace(/```\w*\n?/g, '').replace(/```/g, '');
        })
        .replace(/\*\*(.*?)\*\*/g, '$1')
        .replace(/\*(.*?)\*/g, '$1')
        .replace(/`(.*?)`/g, '$1');
    }

    // Apply color if enabled and output is to TTY
    if (options.color && process.stdout.isTTY && options.format === 'markdown') {
      // Basic color support (would need a proper library for full colors)
      formatted = formatted.replace(/```(.*?)\n/g, '\x1b[36m```$1\x1b[0m\n');
      formatted = formatted.replace(/\*\*(.*?)\*\*/g, '\x1b[1m$1\x1b[0m');
    }

    return formatted;
  }

  private getLanguageFromExtension(ext?: string): string | undefined {
    const mapping: Record<string, string> = {
      'js': 'javascript',
      'jsx': 'javascript',
      'ts': 'typescript',
      'tsx': 'typescript',
      'py': 'python',
      'go': 'go',
      'rs': 'rust',
      'java': 'java',
      'cpp': 'cpp',
      'c': 'c',
      'cs': 'csharp',
      'php': 'php',
      'rb': 'ruby',
      'sh': 'bash',
      'bash': 'bash',
      'zsh': 'bash'
    };

    return ext ? mapping[ext] : undefined;
  }

  private showUsage(): void {
    const usage = `
Learn Code MCP CLI v0.1
Fast, deterministic code explanations

USAGE:
  teach explain [options] [file]

INPUT OPTIONS:
  <file>                    Read from specific file
  --lines <start-end>       Line range (e.g., 10-20)
  --language <lang>         Override language detection

OUTPUT OPTIONS:
  --length <type>           micro|short|paragraph|deep (default: short)
  -l <type>                Short alias for --length
  --format <type>          markdown|plain (default: markdown)
  --no-color               Disable ANSI colors
  --no-redact              Disable secret redaction

DEBUG OPTIONS:
  --debug                  Show MCP communication details

EXAMPLES:
  teach explain app.py --length short
  cat main.js | teach explain -l micro
  git diff HEAD~1 | teach explain --format plain
  teach explain utils.py --lines 45-67 --length deep
  teach explain component.tsx --language typescript

STDIN USAGE:
  echo "function test() { return 42; }" | teach explain
  cat file.js | teach explain --length paragraph
  git show HEAD:src/app.py | teach explain -l deep

For more information, visit: https://github.com/little-bear-apps/learn-code-mcp
    `.trim();

    console.log(usage);
  }
}

// Main execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const cli = new LearnCodeCLI();
  cli.run().catch((error) => {
    console.error('CLI failed:', error.message);
    process.exit(1);
  });
}