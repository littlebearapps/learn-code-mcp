
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
            isMultiLine: selectedText.includes('\n'),
            characterCount: selectedText.length,
            lineCount: selectedText.split('\n').length,
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
        const resultMessage = `MCP Selection Test Results:
• Selected: ${testResults.characterCount} chars, ${testResults.lineCount} lines
• Language: ${testResults.languageId}
• File: ${path.basename(testResults.fileName)}
• MCP Commands: ${testResults.mcpCommandsAvailable?.length || 0} found
• Execution: ${testResults.mcpExecutionSuccess ? 'SUCCESS' : testResults.mcpExecutionError || 'No attempt'}`;

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
        
        const summary = `MCP Test Suite Complete:
• Total Tests: ${results.total}
• Passed: ${results.passed}
• Failed: ${results.failed}
• Success Rate: ${Math.round((results.passed / results.total) * 100)}%`;

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
                    const firstFunctionMatch = document.getText().match(/function \w+[^}]+}/);
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
