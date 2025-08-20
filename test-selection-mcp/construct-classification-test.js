#!/usr/bin/env node

// Construct Classification Test Suite
console.log('🔍 Starting Construct Classification Test\n');

// Language-specific pattern detection (from integration plan)
const LANGUAGE_PATTERNS = {
  javascript: {
    patterns: {
      function: /(function\s+\w+|const\s+\w+\s*=\s*function|\w+\s*=\s*\(\s*.*?\s*\)\s*=>)/,
      class: /class\s+\w+/,
      method: /\w+\s*\([^)]*\)\s*\{/,
      arrow_function: /=>\s*\{?/,
      async_function: /async\s+(function|\w+)/,
      react_hook: /(useState|useEffect|useContext|useMemo|useCallback)\s*\(/,
      import: /import\s+.*?\s+from\s+['"`]/,
      export: /export\s+(default\s+)?(class|function|const|let|var)/
    },
    extensions: ['.js', '.jsx', '.mjs', '.cjs']
  },
  typescript: {
    patterns: {
      interface: /interface\s+\w+/,
      type_alias: /type\s+\w+\s*=/,
      generic: /<[^>]+>/,
      class: /class\s+\w+/,
      function: /(function\s+\w+|const\s+\w+\s*:\s*\([^)]*\)\s*=>)/,
      enum: /enum\s+\w+/,
      namespace: /namespace\s+\w+/,
      decorator: /@\w+/
    },
    extensions: ['.ts', '.tsx', '.d.ts']
  },
  python: {
    patterns: {
      function: /def\s+\w+\s*\(/,
      async_function: /async\s+def\s+\w+\s*\(/,
      class: /class\s+\w+/,
      method: /\s+def\s+\w+\s*\(self/,
      decorator: /@\w+/,
      with_statement: /with\s+\w+/,
      yield_statement: /yield\s+/,
      import: /(from\s+\w+\s+)?import\s+/,
      lambda: /lambda\s+.*?:/
    },
    extensions: ['.py', '.pyw', '.pyx']
  },
  rust: {
    patterns: {
      function: /fn\s+\w+/,
      struct: /struct\s+\w+/,
      enum: /enum\s+\w+/,
      impl: /impl\s+/,
      trait: /trait\s+\w+/,
      macro: /macro_rules!\s+\w+/,
      use_statement: /use\s+\w+/,
      pub_item: /pub\s+(fn|struct|enum|trait)/
    },
    extensions: ['.rs']
  },
  go: {
    patterns: {
      function: /func\s+\w+/,
      method: /func\s+\(\w+\s+\*?\w+\)\s+\w+/,
      struct: /type\s+\w+\s+struct/,
      interface: /type\s+\w+\s+interface/,
      goroutine: /go\s+\w+/,
      channel: /<-\s*chan|chan\s*<-/,
      package: /package\s+\w+/,
      import: /import\s+/
    },
    extensions: ['.go']
  }
};

// Test code samples for classification
const TEST_SAMPLES = [
  // JavaScript samples
  {
    name: 'JavaScript Function Declaration',
    code: 'function calculateSum(a, b) {\n  return a + b;\n}',
    language: 'javascript',
    expectedConstruct: 'function',
    confidence: 0.9
  },
  {
    name: 'JavaScript Arrow Function',
    code: 'const multiply = (x, y) => x * y;',
    language: 'javascript', 
    expectedConstruct: 'arrow_function',
    confidence: 0.9
  },
  {
    name: 'JavaScript Class',
    code: 'class Calculator {\n  constructor() {\n    this.value = 0;\n  }\n}',
    language: 'javascript',
    expectedConstruct: 'class',
    confidence: 0.95
  },
  {
    name: 'React Hook Usage',
    code: 'const [state, setState] = useState(0);',
    language: 'javascript',
    expectedConstruct: 'react_hook',
    confidence: 0.9
  },

  // TypeScript samples
  {
    name: 'TypeScript Interface',
    code: 'interface User {\n  name: string;\n  age: number;\n}',
    language: 'typescript',
    expectedConstruct: 'interface',
    confidence: 0.95
  },
  {
    name: 'TypeScript Generic Function',
    code: 'function identity<T>(arg: T): T {\n  return arg;\n}',
    language: 'typescript',
    expectedConstruct: 'generic',
    confidence: 0.8
  },

  // Python samples
  {
    name: 'Python Function',
    code: 'def process_data(items):\n    return [item.upper() for item in items]',
    language: 'python',
    expectedConstruct: 'function',
    confidence: 0.95
  },
  {
    name: 'Python Async Function',
    code: 'async def fetch_data(url):\n    response = await client.get(url)\n    return response.json()',
    language: 'python',
    expectedConstruct: 'async_function',
    confidence: 0.95
  },
  {
    name: 'Python Class',
    code: 'class DataProcessor:\n    def __init__(self, config):\n        self.config = config',
    language: 'python',
    expectedConstruct: 'class',
    confidence: 0.95
  },

  // Rust samples
  {
    name: 'Rust Function',
    code: 'fn add_numbers(a: i32, b: i32) -> i32 {\n    a + b\n}',
    language: 'rust',
    expectedConstruct: 'function',
    confidence: 0.95
  },
  {
    name: 'Rust Struct',
    code: 'struct Point {\n    x: f64,\n    y: f64,\n}',
    language: 'rust',
    expectedConstruct: 'struct',
    confidence: 0.95
  },

  // Go samples
  {
    name: 'Go Function',
    code: 'func ProcessItems(items []string) []string {\n    return items\n}',
    language: 'go',
    expectedConstruct: 'function',
    confidence: 0.95
  },
  {
    name: 'Go Struct',
    code: 'type User struct {\n    Name string\n    Age  int\n}',
    language: 'go',
    expectedConstruct: 'struct',
    confidence: 0.9
  }
];

// Construct classification function (best-effort regex-based)
function classifyConstruct(code, language = null) {
  // Auto-detect language if not provided
  if (!language) {
    language = detectLanguage(code);
  }
  
  const languageData = LANGUAGE_PATTERNS[language];
  if (!languageData) {
    return {
      language: 'unknown',
      construct: 'unknown',
      confidence: 0.1,
      detectedPatterns: []
    };
  }
  
  const detectedPatterns = [];
  let bestMatch = null;
  let highestConfidence = 0;
  
  // Test each pattern for the language
  Object.entries(languageData.patterns).forEach(([constructName, pattern]) => {
    const matches = code.match(pattern);
    if (matches) {
      // Calculate confidence based on pattern specificity and context
      let confidence = 0.7; // Base confidence for regex match
      
      // Boost confidence for more specific patterns
      if (constructName.includes('async')) confidence += 0.1;
      if (constructName.includes('class')) confidence += 0.1;
      if (constructName.includes('interface')) confidence += 0.1;
      if (constructName.includes('generic')) confidence += 0.05;
      if (constructName.includes('arrow')) confidence += 0.05;
      if (constructName.includes('react')) confidence += 0.05;
      
      // Reduce confidence for very generic patterns
      if (constructName === 'method' && !code.includes('self')) confidence -= 0.2;
      if (constructName === 'function' && code.includes('=>')) confidence -= 0.05; // Prefer arrow_function
      
      detectedPatterns.push({
        construct: constructName,
        confidence,
        matchCount: matches.length
      });
      
      // Update best match with tie-breaking logic
      if (confidence > highestConfidence || 
          (confidence === highestConfidence && constructName.length > (bestMatch?.length || 0))) {
        highestConfidence = confidence;
        bestMatch = constructName;
      }
    }
  });
  
  return {
    language,
    construct: bestMatch || 'unknown',
    confidence: highestConfidence,
    detectedPatterns
  };
}

// Simple language detection based on syntax patterns
function detectLanguage(code) {
  const detectionPatterns = {
    python: [/def\s+\w+/, /import\s+\w+/, /class\s+\w+.*:/, /__init__/],
    javascript: [/function\s+\w+/, /const\s+\w+\s*=/, /=>\s*\{?/, /console\.log/],
    typescript: [/interface\s+\w+/, /type\s+\w+\s*=/, /:\s*\w+\s*[=;]/, /<[^>]+>/],
    rust: [/fn\s+\w+/, /struct\s+\w+/, /impl\s+/, /let\s+mut/, /pub\s+fn/],
    go: [/func\s+\w+/, /package\s+\w+/, /type\s+\w+\s+struct/, /go\s+\w+/]
  };
  
  let bestMatch = 'javascript'; // default fallback
  let maxMatches = 0;
  
  Object.entries(detectionPatterns).forEach(([lang, patterns]) => {
    const matchCount = patterns.reduce((count, pattern) => {
      return count + (pattern.test(code) ? 1 : 0);
    }, 0);
    
    if (matchCount > maxMatches) {
      maxMatches = matchCount;
      bestMatch = lang;
    }
  });
  
  return bestMatch;
}

// Run construct classification tests
function runClassificationTests() {
  console.log('Running construct classification test cases...\n');
  
  let passed = 0;
  let failed = 0;
  const results = [];
  
  TEST_SAMPLES.forEach((sample, index) => {
    console.log(`Test ${index + 1}: ${sample.name}`);
    console.log(`Code: ${sample.code.substring(0, 60)}...`);
    
    const result = classifyConstruct(sample.code, sample.language);
    
    console.log(`Expected: ${sample.expectedConstruct} (${sample.language})`);
    console.log(`Detected: ${result.construct} (${result.language}) [confidence: ${result.confidence.toFixed(2)}]`);
    
    // Test passes if construct matches and confidence is reasonable
    const constructMatch = result.construct === sample.expectedConstruct;
    const languageMatch = result.language === sample.language;
    const confidenceOk = result.confidence >= 0.5;
    
    const testPassed = constructMatch && languageMatch && confidenceOk;
    
    if (testPassed) {
      console.log('✅ PASSED');
      passed++;
    } else {
      console.log('❌ FAILED');
      if (!constructMatch) console.log(`  - Construct mismatch: expected ${sample.expectedConstruct}, got ${result.construct}`);
      if (!languageMatch) console.log(`  - Language mismatch: expected ${sample.language}, got ${result.language}`);
      if (!confidenceOk) console.log(`  - Low confidence: ${result.confidence.toFixed(2)} < 0.5`);
      failed++;
    }
    
    console.log(`Detected patterns: ${result.detectedPatterns.map(p => `${p.construct}(${p.confidence.toFixed(2)})`).join(', ') || 'None'}\n`);
    
    results.push({
      sample: sample.name,
      passed: testPassed,
      expected: sample.expectedConstruct,
      actual: result.construct,
      confidence: result.confidence,
      detectedPatterns: result.detectedPatterns
    });
  });
  
  return { passed, failed, results };
}

// Show classification examples
function showClassificationExamples() {
  console.log('='.repeat(50));
  console.log('Classification Examples:\n');
  
  const examples = [
    'function test() { return 42; }',
    'class MyClass extends Base {}',
    'const arrow = () => {}',
    'async def fetch_data(): pass',
    'fn main() { println!("Hello"); }',
    'interface User { name: string; }'
  ];
  
  examples.forEach(code => {
    const result = classifyConstruct(code);
    console.log(`Code: ${code}`);
    console.log(`→ ${result.language} ${result.construct} (confidence: ${result.confidence.toFixed(2)})\n`);
  });
}

// Run the test suite
if (require.main === module) {
  const { passed, failed, results } = runClassificationTests();
  
  console.log('='.repeat(50));
  console.log('Construct Classification Test Results:');
  console.log(`✅ Passed: ${passed}/${passed + failed}`);
  console.log(`❌ Failed: ${failed}/${passed + failed}`);
  
  if (failed === 0) {
    console.log('\n🎉 All construct classification tests passed!');
    console.log('✅ Ready for production - code constructs detected reliably');
  } else {
    console.log('\n⚠️  Some tests failed - review pattern detection logic');
    console.log('\nFailed tests:');
    results.filter(r => !r.passed).forEach(r => {
      console.log(`- ${r.sample}: expected ${r.expected}, got ${r.actual} (${r.confidence.toFixed(2)})`);
    });
  }
  
  showClassificationExamples();
  
  process.exit(failed === 0 ? 0 : 1);
}

module.exports = { classifyConstruct, detectLanguage, LANGUAGE_PATTERNS };