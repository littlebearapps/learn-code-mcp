#!/usr/bin/env node

// VS Code Extension API Test Suite for MCP Integration
console.log('🔧 VS Code Extension API Test Suite for MCP Integration\n');

const fs = require('fs');
const path = require('path');

// This test explores if we can create a minimal VS Code extension 
// to automate MCP testing via the Extension API

const EXTENSION_MANIFEST = {
  "name": "learn-code-mcp-test",
  "displayName": "Learn Code MCP Test Extension",
  "description": "Test extension for automating MCP integration tests",
  "version": "0.0.1",
  "engines": {
    "vscode": "^1.74.0"
  },
  "categories": ["Testing"],
  "activationEvents": [],
  "main": "./out/extension.js",
  "contributes": {
    "commands": [
      {
        "command": "learnCodeMcpTest.runTests",
        "title": "Run MCP Integration Tests"
      },
      {
        "command": "learnCodeMcpTest.testSelection",
        "title": "Test MCP Selection Injection"
      }
    ]
  },
  "scripts": {
    "vscode:prepublish": "npm run compile",
    "compile": "tsc -p ./",
    "test": "node ./out/test/runTest.js"
  },
  "devDependencies": {
    "@types/vscode": "^1.74.0",
    "@types/node": "16.x",
    "@vscode/test-electron": "^2.2.0",
    "typescript": "^4.9.4"
  }
};

const EXTENSION_CODE = `
import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
    console.log('Learn Code MCP Test Extension activated');

    // Test 1: MCP Selection Variable Injection
    const testSelection = vscode.commands.registerCommand('learnCodeMcpTest.testSelection', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active editor');
            return;
        }

        const selection = editor.selection;
        const selectedText = editor.document.getText(selection);
        
        if (!selectedText) {
            vscode.window.showWarningMessage('No text selected');
            return;
        }

        // Test different selection scenarios
        const testResults = {
            hasSelection: selectedText.length > 0,
            isMultiLine: selectedText.includes('\\n'),
            characterCount: selectedText.length,
            lineCount: selectedText.split('\\n').length,
            languageId: editor.document.languageId,
            fileName: editor.document.fileName
        };

        // Try to invoke MCP command if available
        try {
            // This would be the actual MCP command invocation
            const mcpCommands = await vscode.commands.getCommands(true);
            const mcpTestCommands = mcpCommands.filter(cmd => cmd.includes('test-learn-code'));
            
            if (mcpTestCommands.length > 0) {
                testResults.mcpCommandsAvailable = mcpTestCommands;
                
                // Try to execute MCP command with selection
                // Note: This might not work without proper MCP client integration
                try {
                    await vscode.commands.executeCommand(mcpTestCommands[0], {
                        selection: selectedText,
                        language: editor.document.languageId,
                        filename: path.basename(editor.document.fileName)
                    });
                    testResults.mcpExecutionSuccess = true;
                } catch (error) {
                    testResults.mcpExecutionError = error.message;
                }
            } else {
                testResults.mcpCommandsAvailable = [];
            }
        } catch (error) {
            testResults.mcpCommandError = error.message;
        }

        // Show test results
        const resultMessage = \`MCP Selection Test Results:
• Selected: \${testResults.characterCount} chars, \${testResults.lineCount} lines
• Language: \${testResults.languageId}
• File: \${path.basename(testResults.fileName)}
• MCP Commands: \${testResults.mcpCommandsAvailable?.length || 0} found
• Execution: \${testResults.mcpExecutionSuccess ? 'SUCCESS' : testResults.mcpExecutionError || 'No attempt'}\`;

        vscode.window.showInformationMessage(resultMessage);
        
        // Write results to test output file
        const testOutputPath = path.join(context.extensionPath, 'test-results.json');
        fs.writeFileSync(testOutputPath, JSON.stringify(testResults, null, 2));
        
        console.log('MCP Selection Test Results:', testResults);
    });

    // Test 2: Full MCP Integration Test Suite
    const runTests = vscode.commands.registerCommand('learnCodeMcpTest.runTests', async () => {
        const testSuite = new MCPTestSuite();
        const results = await testSuite.runAllTests();
        
        const summary = \`MCP Test Suite Complete:
• Total Tests: \${results.total}
• Passed: \${results.passed}
• Failed: \${results.failed}
• Success Rate: \${Math.round((results.passed / results.total) * 100)}%\`;

        vscode.window.showInformationMessage(summary);
        
        // Write full results
        const testOutputPath = path.join(context.extensionPath, 'full-test-results.json');
        fs.writeFileSync(testOutputPath, JSON.stringify(results, null, 2));
    });

    context.subscriptions.push(testSelection, runTests);
}

class MCPTestSuite {
    async runAllTests() {
        const results = {
            total: 0,
            passed: 0,
            failed: 0,
            details: []
        };

        // Test 1: Check if MCP commands are available
        try {
            const commands = await vscode.commands.getCommands(true);
            const mcpCommands = commands.filter(cmd => cmd.includes('mcp') || cmd.includes('test-learn-code'));
            
            results.total++;
            if (mcpCommands.length > 0) {
                results.passed++;
                results.details.push({
                    test: 'MCP Commands Available',
                    status: 'PASSED',
                    data: { commands: mcpCommands }
                });
            } else {
                results.failed++;
                results.details.push({
                    test: 'MCP Commands Available',
                    status: 'FAILED',
                    error: 'No MCP commands found'
                });
            }
        } catch (error) {
            results.total++;
            results.failed++;
            results.details.push({
                test: 'MCP Commands Available',
                status: 'ERROR',
                error: error.message
            });
        }

        // Test 2: Test file opening and selection
        try {
            const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
            if (workspaceFolder) {
                const testFilePath = path.join(workspaceFolder.uri.fsPath, 'test-code.js');
                
                if (fs.existsSync(testFilePath)) {
                    const document = await vscode.workspace.openTextDocument(testFilePath);
                    const editor = await vscode.window.showTextDocument(document);
                    
                    // Test automatic selection
                    const firstFunctionMatch = document.getText().match(/function \\w+[^}]+}/);
                    if (firstFunctionMatch) {
                        const startPos = document.positionAt(document.getText().indexOf(firstFunctionMatch[0]));
                        const endPos = document.positionAt(document.getText().indexOf(firstFunctionMatch[0]) + firstFunctionMatch[0].length);
                        
                        editor.selection = new vscode.Selection(startPos, endPos);
                        
                        results.total++;
                        results.passed++;
                        results.details.push({
                            test: 'Automatic Selection',
                            status: 'PASSED',
                            data: {
                                selectedText: firstFunctionMatch[0].substring(0, 100) + '...',
                                selectionLength: firstFunctionMatch[0].length
                            }
                        });
                    } else {
                        results.total++;
                        results.failed++;
                        results.details.push({
                            test: 'Automatic Selection',
                            status: 'FAILED',
                            error: 'No function found to select'
                        });
                    }
                } else {
                    results.total++;
                    results.failed++;
                    results.details.push({
                        test: 'Test File Opening',
                        status: 'FAILED',
                        error: 'Test file not found: ' + testFilePath
                    });
                }
            } else {
                results.total++;
                results.failed++;
                results.details.push({
                    test: 'Workspace Access',
                    status: 'FAILED',
                    error: 'No workspace folder available'
                });
            }
        } catch (error) {
            results.total++;
            results.failed++;
            results.details.push({
                test: 'File Operations',
                status: 'ERROR',
                error: error.message
            });
        }

        return results;
    }
}

export function deactivate() {}
`;

const TSCONFIG = {
  "compilerOptions": {
    "module": "commonjs",
    "target": "ES2020",
    "outDir": "out",
    "lib": ["ES2020"],
    "sourceMap": true,
    "rootDir": "src",
    "strict": true
  }
};

class VSCodeExtensionTester {
  constructor() {
    this.extensionPath = path.join(__dirname, 'vscode-test-extension');
  }

  async createTestExtension() {
    console.log('Creating VS Code test extension for MCP automation...');

    try {
      // Create extension directory structure
      if (!fs.existsSync(this.extensionPath)) {
        fs.mkdirSync(this.extensionPath, { recursive: true });
      }

      const srcPath = path.join(this.extensionPath, 'src');
      if (!fs.existsSync(srcPath)) {
        fs.mkdirSync(srcPath);
      }

      // Write package.json
      fs.writeFileSync(
        path.join(this.extensionPath, 'package.json'),
        JSON.stringify(EXTENSION_MANIFEST, null, 2)
      );

      // Write TypeScript source
      fs.writeFileSync(
        path.join(srcPath, 'extension.ts'),
        EXTENSION_CODE
      );

      // Write tsconfig.json
      fs.writeFileSync(
        path.join(this.extensionPath, 'tsconfig.json'),
        JSON.stringify(TSCONFIG, null, 2)
      );

      console.log('✅ VS Code test extension created');
      console.log(`   Location: ${this.extensionPath}`);
      
      return true;

    } catch (error) {
      console.log(`❌ Failed to create test extension: ${error.message}`);
      return false;
    }
  }

  async checkVSCodeExtensionCapabilities() {
    console.log('Checking VS Code Extension API capabilities for MCP testing...');

    const capabilities = {
      commandExecution: 'vscode.commands.executeCommand() - Can trigger MCP commands',
      textSelection: 'vscode.window.activeTextEditor.selection - Can read/set selections',
      documentAccess: 'vscode.workspace.openTextDocument() - Can open test files',
      languageDetection: 'document.languageId - Can detect programming languages',
      fileOperations: 'fs module - Can create/read test files',
      automation: 'Extension can run headless via @vscode/test-electron',
      mcpIntegration: 'Depends on VS Code MCP extension exposing commands'
    };

    console.log('\nVS Code Extension API Capabilities:');
    Object.entries(capabilities).forEach(([feature, description]) => {
      console.log(`✅ ${feature}: ${description}`);
    });

    return capabilities;
  }

  generateInstallationInstructions() {
    console.log('\n' + '='.repeat(60));
    console.log('VS CODE EXTENSION AUTOMATION SETUP');
    console.log('='.repeat(60));

    const instructions = [
      '1. Install extension dependencies:',
      `   cd ${this.extensionPath}`,
      '   npm install',
      '',
      '2. Compile TypeScript:',
      '   npm run compile',
      '',
      '3. Install extension in VS Code:',
      '   - Open VS Code',
      '   - Go to Extensions view (⌘⇧X)',
      '   - Click "..." menu → "Install from VSIX..."',
      '   - Or use command line: code --install-extension ./extension.vsix',
      '',
      '4. Alternative - Development mode:',
      '   - Open the extension folder in VS Code',
      '   - Press F5 to launch Extension Development Host',
      '   - Open test workspace in the new window',
      '',
      '5. Run automated tests:',
      '   - Command Palette (⌘⇧P)',
      '   - Run "Learn Code MCP Test: Run MCP Integration Tests"',
      '   - Check output in Problems panel and extension folder',
      '',
      '6. Manual testing with automation assistance:',
      '   - Command Palette → "Test MCP Selection Injection"',
      '   - Extension will automatically select code and attempt MCP calls',
      '   - Results saved to test-results.json'
    ];

    instructions.forEach(instruction => console.log(instruction));

    return instructions;
  }

  async analyzeAutomationFeasibility() {
    console.log('\n' + '='.repeat(50));
    console.log('MCP AUTOMATION FEASIBILITY ANALYSIS');
    console.log('='.repeat(50));

    const analysis = {
      fullyAutomatable: [
        'VS Code launch and workspace setup',
        'File creation and opening',
        'Text selection and manipulation',
        'Language detection and file operations',
        'Extension command execution',
        'Test result collection and reporting'
      ],
      partiallyAutomatable: [
        'MCP command discovery (depends on MCP extension)',
        'MCP prompt execution (requires MCP client integration)',
        'Selection variable injection (needs MCP command support)',
        'Hotkey testing (can simulate but not fully validate UX)'
      ],
      manualRequired: [
        'VS Code MCP extension installation verification',
        'Chat interface response validation',
        'User experience and workflow validation',
        'Visual confirmation of formatted output'
      ]
    };

    console.log('\n✅ FULLY AUTOMATABLE (Via Extension API):');
    analysis.fullyAutomatable.forEach(item => console.log(`   • ${item}`));

    console.log('\n🔄 PARTIALLY AUTOMATABLE (Extension + Manual):');
    analysis.partiallyAutomatable.forEach(item => console.log(`   • ${item}`));

    console.log('\n👤 MANUAL TESTING REQUIRED:');
    analysis.manualRequired.forEach(item => console.log(`   • ${item}`));

    console.log('\n📊 AUTOMATION COVERAGE:');
    const total = analysis.fullyAutomatable.length + analysis.partiallyAutomatable.length + analysis.manualRequired.length;
    const automated = analysis.fullyAutomatable.length;
    const coverage = Math.round((automated / total) * 100);
    console.log(`   ${coverage}% fully automatable, ${100 - coverage}% requires manual validation`);

    return { analysis, coverage };
  }
}

// Main execution
async function main() {
  const tester = new VSCodeExtensionTester();
  
  console.log('VS Code Extension-Based MCP Testing Analysis');
  console.log('============================================\n');
  
  // Check capabilities
  await tester.checkVSCodeExtensionCapabilities();
  
  // Create test extension
  const created = await tester.createTestExtension();
  
  if (created) {
    // Generate setup instructions
    tester.generateInstallationInstructions();
    
    // Analyze what can be automated
    const { analysis, coverage } = await tester.analyzeAutomationFeasibility();
    
    console.log('\n' + '='.repeat(50));
    console.log('RECOMMENDATION:');
    console.log('='.repeat(50));
    
    if (coverage >= 70) {
      console.log('✅ VS Code Extension approach is HIGHLY RECOMMENDED');
      console.log('   High automation coverage with comprehensive test capabilities');
    } else {
      console.log('🔄 VS Code Extension approach is PARTIALLY RECOMMENDED');
      console.log('   Good automation but requires significant manual validation');
    }
    
    console.log('\n📋 NEXT STEPS:');
    console.log('1. Run the basic automation test first (vscode-automation-test.js)');
    console.log('2. If basic tests pass, set up the VS Code extension for advanced automation');
    console.log('3. Use extension for repeatable automated testing');
    console.log('4. Manually validate MCP-specific functionality as guided');
  }
}

if (require.main === module) {
  main();
}

module.exports = { VSCodeExtensionTester, EXTENSION_MANIFEST };