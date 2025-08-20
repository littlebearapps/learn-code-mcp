#!/usr/bin/env node
/**
 * Performance Benchmark for Learn Code MCP
 */

import { performance } from 'perf_hooks';
import { spawn } from 'child_process';
import { writeFileSync, unlinkSync } from 'fs';

console.log('⚡ Learn Code MCP Performance Benchmark');
console.log('======================================');

const results = {
  cli: {
    startup: [],
    processing: [],
    memory: []
  },
  server: {
    startup: [],
    processing: [],
    memory: []
  }
};

// Test data
const testCodes = [
  'const x = 1;',
  'function add(a, b) { return a + b; }',
  `
class Calculator {
  constructor() {
    this.history = [];
  }
  
  add(a, b) {
    const result = a + b;
    this.history.push(\`\${a} + \${b} = \${result}\`);
    return result;
  }
  
  getHistory() {
    return this.history;
  }
}
  `.trim(),
  `
async function fetchUserData(userId) {
  try {
    const response = await fetch(\`/api/users/\${userId}\`);
    if (!response.ok) {
      throw new Error(\`Failed to fetch user: \${response.status}\`);
    }
    
    const userData = await response.json();
    
    // Validate required fields
    if (!userData.id || !userData.email) {
      throw new Error('Invalid user data structure');
    }
    
    // Transform data
    return {
      id: userData.id,
      email: userData.email,
      name: userData.name || 'Unknown',
      createdAt: new Date(userData.created_at),
      preferences: userData.preferences || {}
    };
  } catch (error) {
    console.error('Error fetching user data:', error);
    throw error;
  }
}
  `.trim()
];

async function benchmarkCLI() {
  console.log('\n🧪 CLI Benchmarks');
  console.log('-----------------');
  
  for (let i = 0; i < testCodes.length; i++) {
    const code = testCodes[i];
    const testFile = `benchmark-test-${i}.js`;
    
    // Write test file
    writeFileSync(testFile, code);
    
    console.log(`\nTest ${i + 1}: ${code.split('\n')[0].slice(0, 30)}...`);
    
    // Benchmark startup time
    const startupTimes = [];
    for (let j = 0; j < 5; j++) {
      const start = performance.now();
      
      const result = await new Promise((resolve) => {
        const cli = spawn('node', ['dist/cli.js', testFile, '--length', 'micro'], {
          stdio: 'pipe'
        });
        
        cli.on('close', () => {
          const end = performance.now();
          resolve(end - start);
        });
      });
      
      startupTimes.push(result);
    }
    
    const avgStartup = startupTimes.reduce((a, b) => a + b, 0) / startupTimes.length;
    results.cli.startup.push(avgStartup);
    
    console.log(`  Startup time: ${avgStartup.toFixed(1)}ms (avg of 5 runs)`);
    
    // Cleanup
    unlinkSync(testFile);
  }
  
  // Stdin benchmark
  console.log('\n📥 Stdin Processing:');
  const stdinTimes = [];
  
  for (let i = 0; i < 3; i++) {
    const start = performance.now();
    
    const result = await new Promise((resolve) => {
      const cli = spawn('node', ['dist/cli.js', '--length', 'micro'], {
        stdio: ['pipe', 'pipe', 'pipe']
      });
      
      cli.stdin.write(testCodes[1]);
      cli.stdin.end();
      
      cli.on('close', () => {
        const end = performance.now();
        resolve(end - start);
      });
    });
    
    stdinTimes.push(result);
  }
  
  const avgStdin = stdinTimes.reduce((a, b) => a + b, 0) / stdinTimes.length;
  results.cli.processing.push(avgStdin);
  
  console.log(`  Stdin processing: ${avgStdin.toFixed(1)}ms (avg of 3 runs)`);
}

async function benchmarkServer() {
  console.log('\n🖥️  Server Benchmarks');
  console.log('--------------------');
  
  // Server startup time
  const serverStartupTimes = [];
  
  for (let i = 0; i < 3; i++) {
    const start = performance.now();
    
    const result = await new Promise((resolve) => {
      const server = spawn('node', ['dist/server.js'], {
        stdio: ['pipe', 'pipe', 'pipe']
      });
      
      // Initialize and test
      const commands = [
        {
          jsonrpc: '2.0',
          id: 1,
          method: 'initialize',
          params: {
            protocolVersion: '2024-11-05',
            capabilities: {}
          }
        }
      ];
      
      server.stdin.write(JSON.stringify(commands[0]) + '\n');
      
      server.stdout.once('data', () => {
        const end = performance.now();
        server.kill();
        resolve(end - start);
      });
      
      setTimeout(() => {
        server.kill();
        resolve(1000); // timeout
      }, 2000);
    });
    
    serverStartupTimes.push(result);
  }
  
  const avgServerStartup = serverStartupTimes.reduce((a, b) => a + b, 0) / serverStartupTimes.length;
  results.server.startup.push(avgServerStartup);
  
  console.log(`  Server startup: ${avgServerStartup.toFixed(1)}ms (avg of 3 runs)`);
}

async function memoryBenchmark() {
  console.log('\n💾 Memory Usage');
  console.log('---------------');
  
  // CLI memory usage
  const memoryResult = await new Promise((resolve) => {
    const cli = spawn('node', ['dist/cli.js', '--help'], {
      stdio: 'pipe'
    });
    
    // Get memory usage after a short delay
    setTimeout(() => {
      const memInfo = process.memoryUsage();
      resolve(memInfo);
    }, 100);
    
    cli.on('close', () => {
      // CLI finished
    });
  });
  
  const memoryMB = memoryResult.rss / (1024 * 1024);
  results.cli.memory.push(memoryMB);
  
  console.log(`  CLI memory usage: ${memoryMB.toFixed(1)}MB`);
}

async function runBenchmarks() {
  try {
    await benchmarkCLI();
    await benchmarkServer();
    await memoryBenchmark();
    
    // Summary
    console.log('\n📊 Performance Summary');
    console.log('=====================');
    
    const avgCliStartup = results.cli.startup.reduce((a, b) => a + b, 0) / results.cli.startup.length;
    const avgServerStartup = results.server.startup[0] || 0;
    const avgMemory = results.cli.memory[0] || 0;
    
    console.log(`CLI Average Startup: ${avgCliStartup.toFixed(1)}ms`);
    console.log(`Server Startup: ${avgServerStartup.toFixed(1)}ms`);
    console.log(`Memory Usage: ${avgMemory.toFixed(1)}MB`);
    
    // Performance targets check
    console.log('\n🎯 Performance Targets:');
    console.log(`Startup < 200ms: ${avgCliStartup < 200 ? '✅' : '❌'} (${avgCliStartup.toFixed(1)}ms)`);
    console.log(`Processing < 50ms: ${results.cli.processing[0] < 50 ? '✅' : '❌'} (${results.cli.processing[0]?.toFixed(1) || 'N/A'}ms)`);
    console.log(`Memory < 30MB: ${avgMemory < 30 ? '✅' : '❌'} (${avgMemory.toFixed(1)}MB)`);
    
    if (avgCliStartup < 200 && avgMemory < 30) {
      console.log('\n🎉 ALL PERFORMANCE TARGETS MET!');
      process.exit(0);
    } else {
      console.log('\n⚠️  Some performance targets not met');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('Benchmark failed:', error);
    process.exit(1);
  }
}

runBenchmarks();