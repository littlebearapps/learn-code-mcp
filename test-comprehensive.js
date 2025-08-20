#!/usr/bin/env node

import { spawn } from 'child_process';

console.log('🚀 COMPREHENSIVE Learn Code MCP Test Suite\n');

const server = spawn('node', ['dist/server.js'], {
  stdio: ['pipe', 'pipe', 'pipe']
});

let testsPassed = 0;
let testsTotal = 0;

function runTest(name, testFn) {
  testsTotal++;
  console.log(`\n🧪 TEST ${testsTotal}: ${name}`);
  const result = testFn();
  if (result) {
    testsPassed++;
    console.log(`✅ PASSED`);
  } else {
    console.log(`❌ FAILED`);
  }
  return result;
}

server.stdout.on('data', (data) => {
  const responses = data.toString().trim().split('\n').filter(Boolean);
  responses.forEach(response => {
    try {
      const json = JSON.parse(response);
      processResponse(json);
    } catch (e) {
      console.log('UNPARSEABLE:', response);
    }
  });
});

server.stderr.on('data', (data) => {
  console.log('SERVER:', data.toString().trim());
});

server.on('close', (code, signal) => {
  console.log(`\n📊 TEST SUMMARY:`);
  console.log(`Tests passed: ${testsPassed}/${testsTotal}`);
  console.log(`Success rate: ${((testsPassed/testsTotal)*100).toFixed(1)}%`);
  console.log(`Server closed: code ${code}, signal ${signal}\n`);
  
  if (testsPassed === testsTotal) {
    console.log(`🎉 ALL TESTS PASSED! Learn Code MCP is fully functional!`);
  } else {
    console.log(`⚠️  ${testsTotal - testsPassed} test(s) failed`);
  }
  process.exit(testsPassed === testsTotal ? 0 : 1);
});

const responses = [];
function processResponse(json) {
  responses.push(json);
  
  // Test initialization response
  if (json.id === 1) {
    runTest('Server Initialization', () => {
      return json.result?.protocolVersion === '2024-11-05' &&
             json.result?.serverInfo?.name === 'learn-code-mcp' &&
             json.result?.capabilities?.prompts &&
             json.result?.capabilities?.tools;
    });
  }
  
  // Test prompts list
  if (json.id === 2) {
    runTest('Prompts List', () => {
      const prompts = json.result?.prompts || [];
      return prompts.length === 4 &&
             prompts.some(p => p.name === 'explain_micro') &&
             prompts.some(p => p.name === 'explain_short') &&
             prompts.some(p => p.name === 'explain_paragraph') &&
             prompts.some(p => p.name === 'explain_deep');
    });
  }
  
  // Test tools list
  if (json.id === 3) {
    runTest('Tools List', () => {
      const tools = json.result?.tools || [];
      return tools.length === 3 &&
             tools.some(t => t.name === 'explain_selection') &&
             tools.some(t => t.name === 'classify_construct') &&
             tools.some(t => t.name === 'set_preferences');
    });
  }
  
  // Test explanation prompt generation
  if (json.id === 4) {
    runTest('Explanation Prompt Generation', () => {
      const content = json.result?.messages?.[0]?.content?.text || '';
      return content.includes('Explain this javascript') &&
             content.includes('exactly 1-3 bullet points') &&
             content.includes('function add(a, b)');
    });
  }
  
  // Test explanation tool with context
  if (json.id === 5) {
    runTest('Explanation Tool with Context', () => {
      const content = json.result?.content?.[0]?.text || '';
      return content.includes('Node.js project') &&
             content.includes('Express') &&
             content.includes('feature/users branch') &&
             content.includes('Processing Summary');
    });
  }
  
  // Test secret redaction
  if (json.id === 6) {
    runTest('Secret Redaction', () => {
      const content = json.result?.content?.[0]?.text || '';
      return content.includes('PASSWORD_REDACTED') &&
             content.includes('Security Notice: 1 potential secret') &&
             content.includes('1 Password') &&
             !content.includes('secret123');
    });
  }
  
  // Test construct classification
  if (json.id === 7) {
    runTest('Construct Classification', () => {
      const content = json.result?.content?.[0]?.text || '';
      return content.includes('class') && 
             content.includes('confidence:');
    });
  }
  
  // Test preferences setting
  if (json.id === 8) {
    runTest('Preferences Setting', () => {
      const content = json.result?.content?.[0]?.text || '';
      return content.includes('Preferences updated successfully');
    });
    
    // All tests complete - show summary and exit
    setTimeout(() => server.kill('SIGTERM'), 1000);
  }
}

// Run test sequence
setTimeout(() => {
  console.log('Initializing server...');
  server.stdin.write(JSON.stringify({
    jsonrpc: "2.0", id: 1, method: "initialize",
    params: { protocolVersion: "2024-11-05", capabilities: {}, clientInfo: { name: "test-client", version: "1.0.0" }}
  }) + '\n');
  
  setTimeout(() => {
    server.stdin.write(JSON.stringify({ jsonrpc: "2.0", id: 2, method: "prompts/list" }) + '\n');
    setTimeout(() => {
      server.stdin.write(JSON.stringify({ jsonrpc: "2.0", id: 3, method: "tools/list" }) + '\n');
      setTimeout(() => {
        server.stdin.write(JSON.stringify({
          jsonrpc: "2.0", id: 4, method: "prompts/get",
          params: { name: "explain_micro", arguments: { code: "function add(a, b) { return a + b; }", language: "javascript" }}
        }) + '\n');
        setTimeout(() => {
          server.stdin.write(JSON.stringify({
            jsonrpc: "2.0", id: 5, method: "tools/call",
            params: {
              name: "explain_selection",
              arguments: {
                code: "const users = await User.find({ active: true });",
                length: "short", language: "javascript", filename: "users.js",
                context: { repo: { rootName: "my-app", gitBranch: "feature/users" }, project: { type: "Node.js", frameworkHints: ["Express"] }}
              }
            }
          }) + '\n');
          setTimeout(() => {
            server.stdin.write(JSON.stringify({
              jsonrpc: "2.0", id: 6, method: "tools/call",
              params: {
                name: "explain_selection",
                arguments: {
                  code: "const apiKey = 'sk-1234567890abcdef'; const password = 'secret123';",
                  length: "micro", language: "javascript"
                }
              }
            }) + '\n');
            setTimeout(() => {
              server.stdin.write(JSON.stringify({
                jsonrpc: "2.0", id: 7, method: "tools/call",
                params: { name: "classify_construct", arguments: { code: "class MyClass extends BaseClass {}", language: "javascript" }}
              }) + '\n');
              setTimeout(() => {
                server.stdin.write(JSON.stringify({
                  jsonrpc: "2.0", id: 8, method: "tools/call",
                  params: { name: "set_preferences", arguments: { preferences: { test: true }}}
                }) + '\n');
              }, 500);
            }, 500);
          }, 500);
        }, 500);
      }, 500);
    }, 500);
  }, 1000);
}, 1000);