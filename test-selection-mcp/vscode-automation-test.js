#!/usr/bin/env node

// VS Code MCP Integration Automated Test Suite
console.log('🤖 Starting VS Code MCP Integration Automated Test Suite\n');

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Test configuration
const TEST_CONFIG = {
  vscodeExecutable: '/Applications/Visual Studio Code.app/Contents/Resources/app/bin/code',
  testWorkspace: path.join(__dirname, 'vscode-test-workspace'),
  mcpConfigFile: path.join(__dirname, '.mcp.json'),
  serverFile: path.join(__dirname, 'diagnostic-server.js'),
  timeout: 30000, // 30 seconds max per test
  headless: true
};

// Test files to create for VS Code testing
const TEST_FILES = {
  'test-code.js': `// JavaScript test file for MCP selection testing
function calculateSum(a, b) {
  return a + b;
}

class Calculator {
  constructor() {
    this.result = 0;
  }
  
  add(value) {
    this.result += value;
    return this;
  }
  
  getResult() {
    return this.result;
  }
}

const arrow = (x, y) => x * y;

async function fetchData(url) {
  const response = await fetch(url);
  return response.json();
}`,

  'test-code.py': `# Python test file for MCP selection testing
def process_data(items):
    """Process a list of items and return transformed results."""
    return [item.upper() for item in items if item.strip()]

class DataProcessor:
    def __init__(self, config):
        self.config = config
        self.processed_count = 0
    
    async def process_async(self, data):
        """Async processing method."""
        result = []
        for item in data:
            processed = await self.transform_item(item)
            result.append(processed)
            self.processed_count += 1
        return result
    
    def transform_item(self, item):
        return item * 2 if isinstance(item, (int, float)) else str(item).upper()`,

  'test-code.tsx': `// TypeScript React test file
import React, { useState, useEffect } from 'react';

interface User {
  id: number;
  name: string;
  email: string;
}

const UserProfile: React.FC<{ userId: number }> = ({ userId }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUser(userId).then(userData => {
      setUser(userData);
      setLoading(false);
    });
  }, [userId]);

  const handleUpdate = (newData: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...newData });
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!user) return <div>User not found</div>;

  return (
    <div className="user-profile">
      <h1>{user.name}</h1>
      <p>{user.email}</p>
    </div>
  );
};`
};

// VS Code automation utilities
class VSCodeAutomation {
  constructor() {
    this.vscodeProcess = null;
    this.testResults = {
      setup: { passed: 0, failed: 0, details: [] },
      connection: { passed: 0, failed: 0, details: [] },
      selection: { passed: 0, failed: 0, details: [] },
      commands: { passed: 0, failed: 0, details: [] }
    };
  }

  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async setupTestEnvironment() {
    console.log('Setting up VS Code test environment...');
    
    try {
      // Create test workspace directory
      if (!fs.existsSync(TEST_CONFIG.testWorkspace)) {
        fs.mkdirSync(TEST_CONFIG.testWorkspace, { recursive: true });
      }

      // Create test files
      for (const [filename, content] of Object.entries(TEST_FILES)) {
        const filePath = path.join(TEST_CONFIG.testWorkspace, filename);
        fs.writeFileSync(filePath, content);
        console.log(`✅ Created test file: ${filename}`);
      }

      // Verify MCP server file exists
      if (!fs.existsSync(TEST_CONFIG.serverFile)) {
        throw new Error(`MCP server file not found: ${TEST_CONFIG.serverFile}`);
      }

      // Verify .mcp.json exists
      if (!fs.existsSync(TEST_CONFIG.mcpConfigFile)) {
        throw new Error(`MCP config file not found: ${TEST_CONFIG.mcpConfigFile}`);
      }

      console.log('✅ Test environment setup complete');
      this.testResults.setup.passed++;
      return true;

    } catch (error) {
      console.log(`❌ Test environment setup failed: ${error.message}`);
      this.testResults.setup.failed++;
      this.testResults.setup.details.push({
        test: 'Environment Setup',
        error: error.message,
        passed: false
      });
      return false;
    }
  }

  async testMCPServerConnection() {
    console.log('Testing MCP server connection...');
    
    return new Promise((resolve) => {
      const serverProcess = spawn('node', [TEST_CONFIG.serverFile], {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let stdout = '';
      let stderr = '';
      let resolved = false;

      const timeout = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          serverProcess.kill();
          console.log('❌ MCP server connection test timed out');
          this.testResults.connection.failed++;
          this.testResults.connection.details.push({
            test: 'Server Connection',
            error: 'Connection timeout',
            passed: false
          });
          resolve(false);
        }
      }, 10000);

      serverProcess.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      serverProcess.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      // Test JSON-RPC initialization
      const initMessage = JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
          protocolVersion: '2024-11-05',
          capabilities: {}
        }
      }) + '\n';

      serverProcess.stdin.write(initMessage);

      // Wait for response
      setTimeout(() => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timeout);
          serverProcess.kill();

          if (stdout.includes('jsonrpc')) {
            console.log('✅ MCP server connection successful');
            this.testResults.connection.passed++;
            this.testResults.connection.details.push({
              test: 'Server Connection',
              stdout: stdout.substring(0, 200),
              passed: true
            });
            resolve(true);
          } else {
            console.log('❌ MCP server connection failed - no JSON-RPC response');
            console.log('STDOUT:', stdout);
            console.log('STDERR:', stderr);
            this.testResults.connection.failed++;
            this.testResults.connection.details.push({
              test: 'Server Connection',
              error: 'No JSON-RPC response',
              stdout,
              stderr,
              passed: false
            });
            resolve(false);
          }
        }
      }, 3000);
    });
  }

  async testVSCodeLaunch() {
    console.log('Testing VS Code launch with test workspace...');

    try {
      // Check if VS Code executable exists
      if (!fs.existsSync(TEST_CONFIG.vscodeExecutable)) {
        throw new Error('VS Code executable not found at expected path');
      }

      return new Promise((resolve) => {
        // Launch VS Code with test workspace
        const vscodeArgs = [
          TEST_CONFIG.testWorkspace,
          '--wait',
          '--new-window'
        ];

        const vscodeProcess = spawn(TEST_CONFIG.vscodeExecutable, vscodeArgs, {
          stdio: ['ignore', 'pipe', 'pipe'],
          detached: false
        });

        let resolved = false;
        const timeout = setTimeout(() => {
          if (!resolved) {
            resolved = true;
            vscodeProcess.kill();
            console.log('❌ VS Code launch test timed out');
            this.testResults.setup.failed++;
            resolve(false);
          }
        }, 15000);

        vscodeProcess.on('spawn', () => {
          if (!resolved) {
            resolved = true;
            clearTimeout(timeout);
            console.log('✅ VS Code launched successfully');
            this.testResults.setup.passed++;
            
            // Give VS Code time to fully load, then close it
            setTimeout(() => {
              vscodeProcess.kill();
            }, 3000);
            
            resolve(true);
          }
        });

        vscodeProcess.on('error', (error) => {
          if (!resolved) {
            resolved = true;
            clearTimeout(timeout);
            console.log(`❌ VS Code launch failed: ${error.message}`);
            this.testResults.setup.failed++;
            this.testResults.setup.details.push({
              test: 'VS Code Launch',
              error: error.message,
              passed: false
            });
            resolve(false);
          }
        });
      });

    } catch (error) {
      console.log(`❌ VS Code launch test failed: ${error.message}`);
      this.testResults.setup.failed++;
      return false;
    }
  }

  async testMCPConfigValidation() {
    console.log('Testing MCP configuration validation...');

    try {
      const mcpConfig = JSON.parse(fs.readFileSync(TEST_CONFIG.mcpConfigFile, 'utf8'));
      
      // Validate MCP config structure (handles both 'servers' and 'mcpServers')
      const serverField = mcpConfig.servers ? 'servers' : mcpConfig.mcpServers ? 'mcpServers' : null;
      
      if (!serverField) {
        throw new Error('Missing required field: servers or mcpServers');
      }

      // Check if test server is configured
      const servers = Object.keys(mcpConfig[serverField] || {});
      if (servers.length === 0) {
        throw new Error('No MCP servers configured');
      }

      // Check if our test server is specifically configured
      const testServerExists = servers.includes('test-learn-code');
      if (!testServerExists) {
        console.log(`⚠️  Warning: test-learn-code server not found in MCP config`);
        console.log(`   Available servers: ${servers.join(', ')}`);
      }

      console.log(`✅ MCP config validation passed (${servers.length} servers configured)`);
      console.log(`   Servers: ${servers.join(', ')}`);
      console.log(`   Test server present: ${testServerExists ? 'Yes' : 'No'}`);
      
      this.testResults.setup.passed++;
      this.testResults.setup.details.push({
        test: 'MCP Config Validation',
        servers: servers,
        testServerConfigured: testServerExists,
        passed: true
      });
      
      return true;

    } catch (error) {
      console.log(`❌ MCP config validation failed: ${error.message}`);
      this.testResults.setup.failed++;
      this.testResults.setup.details.push({
        test: 'MCP Config Validation',
        error: error.message,
        passed: false
      });
      return false;
    }
  }

  async generateManualTestInstructions() {
    console.log('\n' + '='.repeat(60));
    console.log('MANUAL TESTING INSTRUCTIONS');
    console.log('='.repeat(60));
    console.log('The following tests require manual interaction with VS Code:');
    console.log();

    const instructions = [
      {
        title: '1. MCP Server Connection Test',
        steps: [
          '1. Open VS Code and navigate to the test workspace',
          '2. Open Command Palette (⌘⇧P)',
          '3. Type "MCP" and look for MCP-related commands',
          '4. Check if test-learn-code appears in the MCP server list',
          '5. Try running: /test-learn-code (should show available prompts)'
        ],
        automation: 'Could potentially be automated with VS Code extension API'
      },
      {
        title: '2. Selection Variable Injection Test',
        steps: [
          '1. Open test-code.js in VS Code',
          '2. Select the calculateSum function (lines 2-4)',
          '3. Open Command Palette (⌘⇧P)',
          '4. Run the MCP prompt: /test-learn-code:Simple Test (MCP)',
          '5. Verify that the selected code appears in the prompt',
          '6. Repeat with different selections (class, arrow function, etc.)'
        ],
        automation: 'Requires VS Code extension API or browser automation'
      },
      {
        title: '3. Multi-Language Selection Test',
        steps: [
          '1. Test selection in test-code.py (Python)',
          '2. Test selection in test-code.tsx (TypeScript/React)',
          '3. Verify language detection works correctly',
          '4. Test Unicode characters and special symbols',
          '5. Test very large selections (entire files)'
        ],
        automation: 'Same as above - extension API needed'
      },
      {
        title: '4. Edge Cases Test',
        steps: [
          '1. Test empty selection (no text selected)',
          '2. Test single character selection',
          '3. Test multi-line selection with mixed indentation',
          '4. Test selection with tabs vs spaces',
          '5. Test selection containing secrets (should be redacted)'
        ],
        automation: 'Extension API or sophisticated screen automation'
      }
    ];

    instructions.forEach((instruction, index) => {
      console.log(`${instruction.title}:`);
      instruction.steps.forEach(step => console.log(`   ${step}`));
      console.log(`   Automation potential: ${instruction.automation}`);
      console.log();
    });

    console.log('AUTOMATED ALTERNATIVE:');
    console.log('If VS Code Extension API access is available, these tests could be');
    console.log('fully automated using the VS Code Extension Test Runner.');
    console.log();
    
    return instructions;
  }

  async runAutomatedTests() {
    console.log('Running all automated VS Code MCP tests...\n');

    const tests = [
      { name: 'Setup Test Environment', method: this.setupTestEnvironment },
      { name: 'MCP Server Connection', method: this.testMCPServerConnection },
      { name: 'VS Code Launch', method: this.testVSCodeLaunch },
      { name: 'MCP Config Validation', method: this.testMCPConfigValidation }
    ];

    for (const test of tests) {
      console.log(`Running: ${test.name}...`);
      const result = await test.method.call(this);
      console.log(`${test.name}: ${result ? '✅ PASSED' : '❌ FAILED'}\n`);
    }

    return this.testResults;
  }

  generateTestReport() {
    console.log('\n' + '='.repeat(50));
    console.log('VS CODE MCP AUTOMATED TEST REPORT');
    console.log('='.repeat(50));

    const categories = Object.keys(this.testResults);
    let totalPassed = 0;
    let totalFailed = 0;

    categories.forEach(category => {
      const results = this.testResults[category];
      totalPassed += results.passed;
      totalFailed += results.failed;
      
      console.log(`\n${category.toUpperCase()}:`);
      console.log(`  ✅ Passed: ${results.passed}`);
      console.log(`  ❌ Failed: ${results.failed}`);
      
      if (results.details.length > 0) {
        console.log('  Details:');
        results.details.forEach(detail => {
          console.log(`    - ${detail.test || 'Test'}: ${detail.passed ? 'PASSED' : 'FAILED'}`);
          if (detail.error) console.log(`      Error: ${detail.error}`);
        });
      }
    });

    console.log(`\nOVERALL RESULTS:`);
    console.log(`✅ Total Passed: ${totalPassed}`);
    console.log(`❌ Total Failed: ${totalFailed}`);
    console.log(`📊 Success Rate: ${totalPassed + totalFailed > 0 ? Math.round((totalPassed / (totalPassed + totalFailed)) * 100) : 0}%`);

    const automatedTestsPassed = totalFailed === 0;
    console.log(`\n${automatedTestsPassed ? '🎉' : '⚠️'} Automated Tests: ${automatedTestsPassed ? 'ALL PASSED' : 'SOME FAILED'}`);
    
    return {
      totalPassed,
      totalFailed,
      successRate: totalPassed / (totalPassed + totalFailed),
      automatedTestsPassed
    };
  }
}

// Run the test suite
async function main() {
  const automation = new VSCodeAutomation();
  
  try {
    // Run automated tests
    await automation.runAutomatedTests();
    
    // Generate report
    const report = automation.generateTestReport();
    
    // Generate manual testing instructions
    await automation.generateManualTestInstructions();
    
    console.log('\n' + '='.repeat(50));
    console.log('NEXT STEPS:');
    console.log('='.repeat(50));
    
    if (report.automatedTestsPassed) {
      console.log('✅ All automated tests passed!');
      console.log('📋 Proceed with manual VS Code testing using instructions above');
      console.log('🔄 Manual tests will validate MCP prompt execution and selection injection');
    } else {
      console.log('⚠️  Some automated tests failed - fix these issues first:');
      console.log('   - Check VS Code installation path');
      console.log('   - Verify MCP server configuration');
      console.log('   - Ensure test workspace setup is correct');
    }
    
    process.exit(report.automatedTestsPassed ? 0 : 1);

  } catch (error) {
    console.error('❌ Test suite failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { VSCodeAutomation, TEST_CONFIG };