#!/usr/bin/env node

/**
 * Cross-platform compatibility test for Learn Code MCP CLI
 */

import { platform } from 'os';
import { spawn } from 'child_process';
import { writeFileSync, unlinkSync } from 'fs';

console.log('🌍 Cross-Platform Compatibility Test');
console.log('====================================');
console.log(`Platform: ${platform()}`);
console.log(`Node.js: ${process.version}`);

// Test platform-specific behaviors
const tests = [];

// Test 1: Path handling with spaces
tests.push({
  name: 'Path with Spaces',
  test: () => {
    const testFile = 'test file with spaces.js';
    writeFileSync(testFile, 'const test = "hello world";');
    
    return new Promise((resolve) => {
      const cli = spawn('node', ['dist/cli.js', testFile, '--length', 'micro'], {
        stdio: 'pipe'
      });
      
      cli.on('close', (code) => {
        unlinkSync(testFile);
        resolve(code === 0);
      });
      
      cli.on('error', () => {
        try { unlinkSync(testFile); } catch {}
        resolve(false);
      });
    });
  }
});

// Test 2: Unicode handling
tests.push({
  name: 'Unicode Content',
  test: () => {
    return new Promise((resolve) => {
      const cli = spawn('node', ['dist/cli.js', '--length', 'micro'], {
        stdio: ['pipe', 'pipe', 'pipe']
      });
      
      cli.stdin.write('const emoji = "🚀 Hello 世界";');
      cli.stdin.end();
      
      cli.on('close', (code) => resolve(code === 0));
      cli.on('error', () => resolve(false));
    });
  }
});

// Test 3: Line ending handling
tests.push({
  name: 'Line Endings',
  test: () => {
    const testContent = 'function test() {\r\n  return "windows line endings";\r\n}';
    
    return new Promise((resolve) => {
      const cli = spawn('node', ['dist/cli.js', '--length', 'micro'], {
        stdio: ['pipe', 'pipe', 'pipe']
      });
      
      cli.stdin.write(testContent);
      cli.stdin.end();
      
      cli.on('close', (code) => resolve(code === 0));
      cli.on('error', () => resolve(false));
    });
  }
});

// Test 4: Long file paths (Windows MAX_PATH issues)
tests.push({
  name: 'Long File Path Handling',
  test: () => {
    // Create a reasonably long filename that could cause issues on Windows
    const longName = 'a'.repeat(100) + '.js';
    writeFileSync(longName, 'const x = 1;');
    
    return new Promise((resolve) => {
      const cli = spawn('node', ['dist/cli.js', longName, '--length', 'micro'], {
        stdio: 'pipe'
      });
      
      cli.on('close', (code) => {
        try { unlinkSync(longName); } catch {}
        resolve(code === 0);
      });
      
      cli.on('error', () => {
        try { unlinkSync(longName); } catch {}
        resolve(false);
      });
    });
  }
});

// Test 5: Process exit handling
tests.push({
  name: 'Process Exit Codes',
  test: () => {
    return new Promise((resolve) => {
      const cli = spawn('node', ['dist/cli.js', 'nonexistent-file-xyz.js'], {
        stdio: 'pipe'
      });
      
      cli.on('close', (code) => resolve(code === 1)); // Should exit with error code 1
      cli.on('error', () => resolve(false));
    });
  }
});

// Run tests
async function runTests() {
  let passed = 0;
  let total = tests.length;
  
  for (let i = 0; i < tests.length; i++) {
    const test = tests[i];
    process.stdout.write(`\n🧪 TEST ${i + 1}: ${test.name} ... `);
    
    try {
      const result = await test.test();
      if (result) {
        console.log('✅ PASSED');
        passed++;
      } else {
        console.log('❌ FAILED');
      }
    } catch (error) {
      console.log(`❌ ERROR: ${error.message}`);
    }
  }
  
  console.log(`\n📊 CROSS-PLATFORM TEST RESULTS:`);
  console.log(`Platform: ${platform()}`);
  console.log(`Tests passed: ${passed}/${total}`);
  console.log(`Success rate: ${((passed/total)*100).toFixed(1)}%`);
  
  // Platform-specific warnings
  if (platform() === 'win32' && passed < total) {
    console.log('\n⚠️  Windows-specific issues detected:');
    console.log('- Check PowerShell vs Command Prompt compatibility');
    console.log('- Verify path separator handling');
    console.log('- Test with Windows Terminal vs legacy console');
  }
  
  if (platform() === 'linux' && passed < total) {
    console.log('\n⚠️  Linux-specific issues detected:');
    console.log('- Check shell compatibility (bash, zsh, fish)');
    console.log('- Verify terminal emulator support');
    console.log('- Test file permissions');
  }
  
  if (passed === total) {
    console.log(`\n🎉 ALL CROSS-PLATFORM TESTS PASSED for ${platform()}!`);
    console.log('CLI should work reliably across different environments.');
  } else {
    console.log(`\n⚠️  ${total - passed} test(s) failed on ${platform()}`);
  }
  
  process.exit(passed === total ? 0 : 1);
}

runTests();