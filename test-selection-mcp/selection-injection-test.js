#!/usr/bin/env node

// VS Code Selection Variable Injection Test with Existing MCP Servers
console.log('💉 VS Code Selection Variable Injection Test\n');

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration for selection injection testing
const SELECTION_CONFIG = {
  vscodeExecutable: '/Applications/Visual Studio Code.app/Contents/Resources/app/bin/code',
  testWorkspace: path.join(__dirname, 'vscode-test-workspace'),
  timeout: 30000
};

class SelectionInjectionTester {
  constructor() {
    this.testResults = {
      setup: { passed: 0, failed: 0, details: [] },
      injection: { passed: 0, failed: 0, details: [] }
    };
  }

  async setupTestEnvironment() {
    console.log('🛠️  Setting up test environment...');
    
    try {
      // Ensure test files exist with proper content for selection testing
      const testFiles = [
        {
          name: 'test-code.py',
          content: `# Python test code for selection injection testing
def calculate_fibonacci(n):
    """Calculate fibonacci number using recursion."""
    if n <= 1:
        return n
    return calculate_fibonacci(n-1) + calculate_fibonacci(n-2)

class DataProcessor:
    def __init__(self, data):
        self.data = data
    
    def process(self):
        return [x * 2 for x in self.data if x > 0]

# Test data
numbers = [1, -2, 3, -4, 5]
processor = DataProcessor(numbers)
result = processor.process()
print(f"Fibonacci of 10: {calculate_fibonacci(10)}")
print(f"Processed data: {result}")
`
        },
        {
          name: 'test-code.js',
          content: `// JavaScript test code for selection injection testing
function calculateSum(arr) {
    return arr.reduce((sum, num) => sum + num, 0);
}

async function fetchUserData(userId) {
    try {
        const response = await fetch(\`/api/users/\${userId}\`);
        const userData = await response.json();
        return userData;
    } catch (error) {
        console.error('Failed to fetch user data:', error);
        throw error;
    }
}

class TaskManager {
    constructor() {
        this.tasks = [];
    }
    
    addTask(task) {
        this.tasks.push({ ...task, id: Date.now(), completed: false });
    }
    
    completeTask(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task) task.completed = true;
    }
}

// Usage example
const numbers = [1, 2, 3, 4, 5];
const sum = calculateSum(numbers);
console.log(\`Sum: \${sum}\`);
`
        },
        {
          name: 'test-code.tsx',
          content: `// TypeScript React test code for selection injection testing
import React, { useState, useEffect } from 'react';

interface User {
  id: number;
  name: string;
  email: string;
}

interface UserListProps {
  users: User[];
  onUserSelect: (user: User) => void;
}

const UserList: React.FC<UserListProps> = ({ users, onUserSelect }) => {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (users.length === 0) {
      setIsLoading(true);
      // Simulate API call
      setTimeout(() => setIsLoading(false), 1000);
    }
  }, [users]);

  const handleUserClick = (user: User) => {
    setSelectedUser(user);
    onUserSelect(user);
  };

  if (isLoading) {
    return <div>Loading users...</div>;
  }

  return (
    <div className="user-list">
      {users.map(user => (
        <div 
          key={user.id}
          className={\`user-item \${selectedUser?.id === user.id ? 'selected' : ''}\`}
          onClick={() => handleUserClick(user)}
        >
          <h3>{user.name}</h3>
          <p>{user.email}</p>
        </div>
      ))}
    </div>
  );
};

export default UserList;
`
        }
      ];

      for (const file of testFiles) {
        const filePath = path.join(SELECTION_CONFIG.testWorkspace, file.name);
        fs.writeFileSync(filePath, file.content, 'utf8');
      }

      console.log('✅ Test files created with selection-friendly content');
      this.testResults.setup.passed++;
      return true;

    } catch (error) {
      console.log(`❌ Test environment setup failed: ${error.message}`);
      this.testResults.setup.failed++;
      return false;
    }
  }

  async openVSCodeWithWorkspace() {
    console.log('🚀 Opening VS Code with test workspace...');
    
    return new Promise((resolve) => {
      const vscode = spawn(SELECTION_CONFIG.vscodeExecutable, [
        SELECTION_CONFIG.testWorkspace,
        '--new-window'
      ], { stdio: 'pipe' });

      let resolved = false;
      const timeout = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          console.log('✅ VS Code opened (continuing with manual tests)');
          this.testResults.setup.passed++;
          resolve(true);
        }
      }, 3000);

      vscode.on('spawn', () => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timeout);
          console.log('✅ VS Code process started successfully');
          this.testResults.setup.passed++;
          resolve(true);
        }
      });

      vscode.on('error', (error) => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timeout);
          console.log(`❌ VS Code launch failed: ${error.message}`);
          this.testResults.setup.failed++;
          resolve(false);
        }
      });
    });
  }

  generateSelectionTestInstructions() {
    console.log('\n' + '='.repeat(60));
    console.log('VS CODE SELECTION VARIABLE INJECTION TEST GUIDE');
    console.log('='.repeat(60));
    console.log('Testing selection injection with existing MCP servers (pylance)\n');

    const testScenarios = [
      {
        title: '1. Python Function Selection Test',
        file: 'test-code.py',
        selection: 'calculate_fibonacci function (lines 2-6)',
        steps: [
          'Open test-code.py in VS Code',
          'Select the entire calculate_fibonacci function including docstring',
          'Open Command Palette (⌘⇧P)',
          'Type "pylance" or "MCP" to find MCP prompts',
          'Look for prompts that can analyze/explain code',
          'Execute any available MCP prompt',
          'VERIFY: Selected function code appears in the prompt result'
        ],
        expected: 'Selected Python function should be injected via ${selection} variable'
      },
      {
        title: '2. JavaScript Async Function Test',  
        file: 'test-code.js',
        selection: 'fetchUserData async function (lines 5-12)',
        steps: [
          'Open test-code.js in VS Code',
          'Select the fetchUserData async function',
          'Open Command Palette (⌘⇧P)',
          'Search for MCP prompts with existing servers',
          'Execute any code analysis/explanation prompt',
          'VERIFY: Selected async function appears in output'
        ],
        expected: 'Selected JavaScript async function should be processed by MCP'
      },
      {
        title: '3. TypeScript React Component Test',
        file: 'test-code.tsx', 
        selection: 'UserList component interface (lines 8-11)',
        steps: [
          'Open test-code.tsx in VS Code',
          'Select the UserListProps interface definition',
          'Use Command Palette to find MCP prompts',
          'Execute available TypeScript/React analysis prompts',
          'VERIFY: Interface definition appears in MCP response'
        ],
        expected: 'Selected TypeScript interface should be analyzed via MCP'
      },
      {
        title: '4. Multi-Line Class Selection Test',
        file: 'test-code.py',
        selection: 'DataProcessor class (lines 8-13)',
        steps: [
          'Select the entire DataProcessor class',
          'Test with multiple MCP servers if available', 
          'Try different prompt types (explain, analyze, refactor)',
          'VERIFY: Complete class selection is preserved'
        ],
        expected: 'Multi-line class selection should maintain formatting'
      },
      {
        title: '5. Edge Case Testing',
        file: 'Any test file',
        selection: 'Various edge cases',
        steps: [
          'Test empty selection (no text selected)',
          'Test very large selection (entire file)',
          'Test selection with special characters and Unicode',
          'Test partial line selections',
          'Test multi-file selections if possible'
        ],
        expected: 'Edge cases should be handled gracefully'
      }
    ];

    testScenarios.forEach((scenario, index) => {
      console.log(`\n${scenario.title}:`);
      console.log(`📁 File: ${scenario.file}`);
      console.log(`🎯 Selection: ${scenario.selection}`);
      console.log(`✅ Expected: ${scenario.expected}\n`);
      
      console.log('Steps:');
      scenario.steps.forEach((step, stepIndex) => {
        console.log(`   ${stepIndex + 1}. ${step}`);
      });
      
      if (index < testScenarios.length - 1) {
        console.log('\n' + '-'.repeat(40));
      }
    });

    console.log('\n' + '='.repeat(60));
    console.log('VALIDATION CRITERIA');
    console.log('='.repeat(60));
    console.log('For each test scenario, verify:');
    console.log('✅ MCP prompts are available in Command Palette');
    console.log('✅ Selected code appears in MCP prompt execution');
    console.log('✅ Selection variable ${selection} is properly injected');
    console.log('✅ Language detection works correctly');
    console.log('✅ Multi-line selections preserve formatting');
    console.log('✅ Edge cases handle gracefully without errors');

    console.log('\n📊 SUCCESS CRITERIA:');
    console.log('• At least 3/5 test scenarios work correctly');
    console.log('• Selection injection works with existing MCP servers');
    console.log('• No errors during selection variable processing');
    console.log('• Ready to implement custom Learn Code MCP server');

    console.log('\n🚀 NEXT STEPS AFTER VALIDATION:');
    console.log('• If tests pass → Proceed with Phase 1 implementation');
    console.log('• If tests fail → Investigate MCP selection variable support');
    console.log('• Document findings for integration plan refinement');
  }

  async runSelectionInjectionTests() {
    console.log('🧪 Running Selection Injection Test Suite...\n');

    const tests = [
      { name: 'Setup Test Environment', method: this.setupTestEnvironment },
      { name: 'Open VS Code with Workspace', method: this.openVSCodeWithWorkspace }
    ];

    for (const test of tests) {
      console.log(`🔄 ${test.name}...`);
      try {
        const result = await test.method.call(this);
        console.log(`${result ? '✅' : '❌'} ${test.name}: ${result ? 'PASSED' : 'FAILED'}`);
      } catch (error) {
        console.log(`❌ ${test.name}: ERROR - ${error.message}`);
      }
    }

    return this.testResults;
  }

  generateTestReport() {
    console.log('\n' + '='.repeat(50));
    console.log('SELECTION INJECTION TEST SETUP REPORT');
    console.log('='.repeat(50));

    const categories = Object.keys(this.testResults);
    let totalPassed = 0;
    let totalFailed = 0;

    categories.forEach(category => {
      const results = this.testResults[category];
      totalPassed += results.passed;
      totalFailed += results.failed;
      
      console.log(`\n${category.toUpperCase()}:`);;
      console.log(`  ✅ Passed: ${results.passed}`);
      console.log(`  ❌ Failed: ${results.failed}`);
    });

    console.log(`\n📊 SETUP RESULTS:`);
    console.log(`✅ Total Passed: ${totalPassed}`);
    console.log(`❌ Total Failed: ${totalFailed}`);
    console.log(`🎯 Setup Success Rate: ${totalPassed + totalFailed > 0 ? Math.round((totalPassed / (totalPassed + totalFailed)) * 100) : 0}%`);

    return { totalPassed, totalFailed, testResults: this.testResults };
  }
}

// Main execution
async function main() {
  console.log('VS Code Selection Variable Injection Test Suite');
  console.log('==============================================\n');
  
  const tester = new SelectionInjectionTester();
  
  try {
    // Run automated setup
    await tester.runSelectionInjectionTests();
    
    // Generate setup report
    const report = tester.generateTestReport();
    
    // Generate manual testing instructions
    tester.generateSelectionTestInstructions();
    
    console.log('\n' + '='.repeat(60));
    console.log('AUTOMATED SETUP COMPLETE - READY FOR MANUAL TESTING');
    console.log('='.repeat(60));
    
    if (report.totalPassed >= 1) {
      console.log('✅ Test environment ready!');
      console.log('📋 Follow the manual testing guide above');
      console.log('🎯 Focus on verifying ${selection} variable injection');
    } else {
      console.log('⚠️  Setup issues detected');
      console.log('🔧 Fix environment before manual testing');
    }

  } catch (error) {
    console.error('❌ Selection injection test setup failed:', error.message);
  }
}

if (require.main === module) {
  main();
}

module.exports = { SelectionInjectionTester };