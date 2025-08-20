#!/usr/bin/env node

// Large Input Handling and Memory Limits Test
console.log('📏 Starting Large Input Handling Test\n');

const fs = require('fs');
const path = require('path');

// Configuration from integration plan (60-line limit mentioned)
const LIMITS = {
  maxLines: 60,              // Integration plan mentions 60-line limit
  maxCharacters: 8000,       // Reasonable character limit for code snippets
  maxTokensEstimate: 2000,   // Conservative token estimate
  warningThreshold: 0.8      // Warn at 80% of limits
};

// Test cases for different input sizes
const INPUT_TESTS = [
  {
    name: 'Small Function (Normal)',
    lines: 5,
    complexity: 'simple',
    expectedTrimmed: false
  },
  {
    name: 'Medium Function (Under Limit)', 
    lines: 15,
    complexity: 'simple',
    expectedTrimmed: false
  },
  {
    name: 'Large Class (Should Trim)',
    lines: 80,
    complexity: 'medium',
    expectedTrimmed: true
  },
  {
    name: 'Very Large File (Heavy Trim)',
    lines: 500,
    complexity: 'complex',
    expectedTrimmed: true
  },
  {
    name: 'Extremely Large Input (Stress Test)',
    lines: 2000,
    complexity: 'complex',
    expectedTrimmed: true
  }
];

// Generate test code of specified size and complexity
function generateTestCode(lines, complexity, language = 'javascript') {
  let code = '';
  let lineCount = 0;
  
  // Add header comment
  code += `// Generated ${complexity} ${language} code for testing\n`;
  lineCount++;
  
  switch (complexity) {
    case 'simple':
      // Simple function pattern
      for (let i = 0; i < Math.min(lines - 2, 10); i++) {
        code += `function func${i}() {\n`;
        code += `  return ${i} * 2;\n`;
        code += `}\n`;
        lineCount += 3;
      }
      break;
      
    case 'medium':
      // Class with methods pattern
      code += `class TestClass {\n`;
      code += `  constructor() {\n`;
      code += `    this.value = 0;\n`;
      code += `  }\n`;
      lineCount += 4;
      
      for (let i = 0; i < Math.min(lines - 10, 20); i++) {
        code += `\n`;
        code += `  method${i}(param) {\n`;
        code += `    // Process parameter\n`;
        code += `    const result = param * ${i};\n`;
        code += `    return result + this.value;\n`;
        code += `  }\n`;
        lineCount += 6;
      }
      
      code += `}\n`;
      lineCount++;
      break;
      
    case 'complex':
      // Complex nested structure
      code += `// Complex nested module pattern\n`;
      code += `const ComplexModule = (() => {\n`;
      code += `  let privateState = {};\n`;
      code += `\n`;
      lineCount += 4;
      
      // Generate many functions and classes
      const functionsToGenerate = Math.min(Math.floor((lines - 10) / 8), 200);
      for (let i = 0; i < functionsToGenerate; i++) {
        code += `  function process${i}(data) {\n`;
        code += `    try {\n`;
        code += `      const transformed = data.map(item => ({\n`;
        code += `        id: item.id || ${i},\n`;
        code += `        value: item.value * ${i + 1},\n`;
        code += `        processed: true\n`;
        code += `      }));\n`;
        code += `      return transformed;\n`;
        code += `    } catch (error) {\n`;
        code += `      console.error('Processing error:', error);\n`;
        code += `      return [];\n`;
        code += `    }\n`;
        code += `  }\n`;
        code += `\n`;
        lineCount += 14;
        
        if (lineCount >= lines - 5) break;
      }
      
      code += `  return { process${functionsToGenerate - 1} };\n`;
      code += `})();\n`;
      lineCount += 2;
      break;
  }
  
  return code;
}

// Snippet trimming function (simulates MCP server behavior)
function trimLargeInput(code, limits = LIMITS) {
  const lines = code.split('\n');
  const originalLength = code.length;
  const originalLines = lines.length;
  
  let trimmed = false;
  let result = code;
  let trimReason = null;
  
  // Check line limit
  if (lines.length > limits.maxLines) {
    const keepLines = Math.floor(limits.maxLines * 0.7); // Keep first 70%
    const endLines = Math.floor(limits.maxLines * 0.3);  // Keep last 30%
    
    const startPart = lines.slice(0, keepLines);
    const endPart = lines.slice(-endLines);
    const removedCount = lines.length - keepLines - endLines;
    
    result = [
      ...startPart,
      '',
      `// ... [${removedCount} lines removed for brevity] ...`,
      '',
      ...endPart
    ].join('\n');
    
    trimmed = true;
    trimReason = `line_limit_${limits.maxLines}`;
  }
  
  // Check character limit
  if (result.length > limits.maxCharacters) {
    const keepChars = Math.floor(limits.maxCharacters * 0.8);
    result = result.substring(0, keepChars) + '\n\n// ... [content truncated] ...';
    trimmed = true;
    trimReason = `char_limit_${limits.maxCharacters}`;
  }
  
  return {
    original: code,
    trimmed: result,
    wasTrimmed: trimmed,
    trimReason,
    stats: {
      originalLines,
      originalChars: originalLength,
      resultLines: result.split('\n').length,
      resultChars: result.length,
      reductionPercent: Math.round((1 - result.length / originalLength) * 100)
    }
  };
}

// Memory usage monitoring
function measureMemoryUsage() {
  const used = process.memoryUsage();
  return {
    rss: Math.round(used.rss / 1024 / 1024 * 100) / 100,        // Resident Set Size
    heapTotal: Math.round(used.heapTotal / 1024 / 1024 * 100) / 100,  // Total heap
    heapUsed: Math.round(used.heapUsed / 1024 / 1024 * 100) / 100,    // Used heap
    external: Math.round(used.external / 1024 / 1024 * 100) / 100     // External memory
  };
}

// Run large input handling tests
function runLargeInputTests() {
  console.log('Running large input handling tests...\n');
  
  const initialMemory = measureMemoryUsage();
  console.log('Initial memory usage:', JSON.stringify(initialMemory), 'MB\n');
  
  let passed = 0;
  let failed = 0;
  const results = [];
  
  INPUT_TESTS.forEach((test, index) => {
    console.log(`Test ${index + 1}: ${test.name}`);
    console.log(`Generating ${test.lines} lines of ${test.complexity} code...`);
    
    const startMemory = measureMemoryUsage();
    const startTime = Date.now();
    
    try {
      // Generate large input
      const code = generateTestCode(test.lines, test.complexity);
      const generateTime = Date.now() - startTime;
      
      console.log(`Generated: ${code.split('\n').length} lines, ${code.length} characters`);
      
      // Test trimming behavior
      const trimResult = trimLargeInput(code);
      const totalTime = Date.now() - startTime;
      const endMemory = measureMemoryUsage();
      
      console.log(`Trimmed: ${trimResult.wasTrimmed ? 'Yes' : 'No'} ${trimResult.trimReason ? `(${trimResult.trimReason})` : ''}`);
      console.log(`Result: ${trimResult.stats.resultLines} lines, ${trimResult.stats.resultChars} characters`);
      if (trimResult.wasTrimmed) {
        console.log(`Reduction: ${trimResult.stats.reductionPercent}%`);
      }
      
      // Verify expectations
      const trimExpected = test.expectedTrimmed;
      const trimActual = trimResult.wasTrimmed;
      const testPassed = trimExpected === trimActual;
      
      // Performance checks
      const memoryIncrease = endMemory.heapUsed - startMemory.heapUsed;
      const memoryReasonable = memoryIncrease < 50; // Less than 50MB increase
      const timeReasonable = totalTime < 5000; // Less than 5 seconds
      
      console.log(`Performance: ${totalTime}ms, +${memoryIncrease.toFixed(1)}MB heap`);
      console.log(`Expectations: trim=${trimExpected}, actual=${trimActual}`);
      
      const allChecksPassed = testPassed && memoryReasonable && timeReasonable;
      
      if (allChecksPassed) {
        console.log('Status: ✅ PASSED\n');
        passed++;
      } else {
        console.log('Status: ❌ FAILED');
        if (!testPassed) console.log(`  - Trim expectation: expected ${trimExpected}, got ${trimActual}`);
        if (!memoryReasonable) console.log(`  - Memory usage: ${memoryIncrease.toFixed(1)}MB increase (limit: 50MB)`);
        if (!timeReasonable) console.log(`  - Processing time: ${totalTime}ms (limit: 5000ms)`);
        console.log();
        failed++;
      }
      
      results.push({
        name: test.name,
        passed: allChecksPassed,
        stats: trimResult.stats,
        performance: {
          time: totalTime,
          memory: memoryIncrease
        },
        wasTrimmed: trimResult.wasTrimmed,
        expectedTrimmed: test.expectedTrimmed
      });
      
    } catch (error) {
      console.log(`Error: ${error.message}`);
      console.log('Status: ❌ FAILED\n');
      
      failed++;
      results.push({
        name: test.name,
        passed: false,
        error: error.message
      });
    }
  });
  
  const finalMemory = measureMemoryUsage();
  console.log('Final memory usage:', JSON.stringify(finalMemory), 'MB');
  console.log(`Total memory increase: +${(finalMemory.heapUsed - initialMemory.heapUsed).toFixed(1)}MB\n`);
  
  return { passed, failed, results, initialMemory, finalMemory };
}

// Show memory and performance recommendations
function showPerformanceRecommendations() {
  console.log('='.repeat(50));
  console.log('Performance and Memory Recommendations:\n');
  
  console.log('Production Settings:');
  console.log(`• Maximum lines: ${LIMITS.maxLines} (adjustable)`);
  console.log(`• Maximum characters: ${LIMITS.maxCharacters} (adjustable)`);
  console.log(`• Warning threshold: ${Math.round(LIMITS.warningThreshold * 100)}% of limits`);
  console.log(`• Estimated max tokens: ~${LIMITS.maxTokensEstimate}`);
  console.log();
  
  console.log('Memory Management:');
  console.log('• Process large inputs in chunks');
  console.log('• Trim aggressively for very large files');
  console.log('• Monitor memory usage in production');
  console.log('• Consider streaming for extremely large inputs');
  console.log();
  
  console.log('User Experience:');
  console.log('• Show trim notifications to users');
  console.log('• Provide line range selection options');
  console.log('• Suggest breaking large files into smaller chunks');
  console.log('• Offer preview of what will be processed');
}

// Run the test suite
if (require.main === module) {
  const { passed, failed, results, initialMemory, finalMemory } = runLargeInputTests();
  
  console.log('='.repeat(50));
  console.log('Large Input Handling Test Results:');
  console.log(`✅ Passed: ${passed}/${passed + failed}`);
  console.log(`❌ Failed: ${failed}/${passed + failed}`);
  
  if (failed === 0) {
    console.log('\n🎉 All large input tests passed!');
    console.log('✅ Ready for production - memory limits and trimming work correctly');
  } else {
    console.log('\n⚠️  Some large input tests failed:');
    results.filter(r => !r.passed).forEach(r => {
      console.log(`- ${r.name}: ${r.error || 'Performance or trimming issue'}`);
    });
  }
  
  showPerformanceRecommendations();
  
  process.exit(failed === 0 ? 0 : 1);
}

module.exports = { trimLargeInput, generateTestCode, measureMemoryUsage, LIMITS };