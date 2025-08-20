#!/usr/bin/env node

// Secret Redaction Pattern Test Suite
console.log('🔒 Starting Secret Redaction Pattern Test\n');

// Common secret patterns to detect and redact
const SECRET_PATTERNS = [
  // API Keys
  { pattern: /sk-[a-zA-Z0-9\-_]{20,}/g, name: 'OpenAI API Key' },
  { pattern: /ghp_[a-zA-Z0-9]{36}/g, name: 'GitHub Personal Access Token' },
  { pattern: /gho_[a-zA-Z0-9]{36}/g, name: 'GitHub OAuth Token' },
  { pattern: /github_pat_[a-zA-Z0-9_]{82}/g, name: 'GitHub PAT' },
  
  // AWS Secrets
  { pattern: /AKIA[0-9A-Z]{16}/g, name: 'AWS Access Key' },
  { pattern: /aws_secret_access_key\s*=\s*[^\s\n]+/gi, name: 'AWS Secret Key' },
  
  // Generic patterns
  { pattern: /Bearer\s+[a-zA-Z0-9\-._~+/]+=*/g, name: 'Bearer Token' },
  { pattern: /password\s*[:=]\s*['"]\S+['"]/gi, name: 'Password Field' },
  { pattern: /api_key\s*[:=]\s*['"]\S+['"]/gi, name: 'API Key Field' },
  { pattern: /secret\s*[:=]\s*['"]\S+['"]/gi, name: 'Secret Field' },
  
  // Database URLs
  { pattern: /postgresql:\/\/[^:]+:[^@]+@[^\/]+\/\S+/gi, name: 'PostgreSQL URL' },
  { pattern: /mysql:\/\/[^:]+:[^@]+@[^\/]+\/\S+/gi, name: 'MySQL URL' },
  { pattern: /mongodb:\/\/[^:]+:[^@]+@[^\/]+\/\S+/gi, name: 'MongoDB URL' },
  
  // Certificates
  { pattern: /-----BEGIN\s+[A-Z\s]+KEY-----[\s\S]*?-----END\s+[A-Z\s]+KEY-----/gi, name: 'Private Key' },
  { pattern: /-----BEGIN\s+CERTIFICATE-----[\s\S]*?-----END\s+CERTIFICATE-----/gi, name: 'Certificate' },
];

// Test cases with various secret types
const TEST_CASES = [
  {
    name: 'OpenAI API Key',
    input: `const openaiKey = "sk-proj-abcdefghijklmnopqrstuvwxyz1234567890ABCDEF";
const client = new OpenAI({ apiKey: openaiKey });`,
    expectedRedacted: true
  },
  {
    name: 'GitHub Token in Environment',
    input: `export GITHUB_TOKEN="ghp_1234567890abcdefghijklmnopqrstuvwxyz"
git clone https://github.com/user/repo.git`,
    expectedRedacted: true
  },
  {
    name: 'AWS Credentials',
    input: `AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
aws_secret_access_key = wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY`,
    expectedRedacted: true
  },
  {
    name: 'Database Connection String',
    input: `const dbUrl = "postgresql://username:password123@localhost:5432/mydb";
mongoose.connect("mongodb://admin:secret@cluster.mongodb.net/app");`,
    expectedRedacted: true
  },
  {
    name: 'Bearer Token',
    input: `const headers = {
  'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.example'
};`,
    expectedRedacted: true
  },
  {
    name: 'Private Key',
    input: `const privateKey = \`-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC7VJTUt9Us8cKB
-----END PRIVATE KEY-----\`;`,
    expectedRedacted: true
  },
  {
    name: 'Safe Code - No Secrets',
    input: `function calculateSum(a, b) {
  return a + b;
}
const result = calculateSum(5, 3);`,
    expectedRedacted: false
  },
  {
    name: 'Mixed Content',
    input: `// Configuration
const config = {
  api_key: "sk-1234567890abcdefghijklmnopqrstuvwxyz123456",
  database_url: "postgresql://user:pass@localhost/db",
  debug: true,
  port: 3000
};

function processData(data) {
  return data.map(item => item.value * 2);
}`,
    expectedRedacted: true
  }
];

// Secret redaction function
function redactSecrets(text) {
  let redacted = text;
  const redactedPatterns = [];
  
  SECRET_PATTERNS.forEach(({ pattern, name }) => {
    const matches = text.match(pattern);
    if (matches) {
      redactedPatterns.push({ name, count: matches.length });
      redacted = redacted.replace(pattern, '[REDACTED]');
    }
  });
  
  return {
    text: redacted,
    hasSecrets: redactedPatterns.length > 0,
    redactedPatterns
  };
}

// Run tests
function runSecretRedactionTests() {
  let passed = 0;
  let failed = 0;
  
  console.log('Running secret redaction test cases...\n');
  
  TEST_CASES.forEach((testCase, index) => {
    console.log(`Test ${index + 1}: ${testCase.name}`);
    console.log('Input:', testCase.input.substring(0, 100) + '...');
    
    const result = redactSecrets(testCase.input);
    
    console.log('Secrets detected:', result.hasSecrets);
    console.log('Patterns found:', result.redactedPatterns.map(p => p.name).join(', ') || 'None');
    
    const testPassed = result.hasSecrets === testCase.expectedRedacted;
    
    if (testPassed) {
      console.log('✅ PASSED\n');
      passed++;
    } else {
      console.log('❌ FAILED');
      console.log(`Expected redaction: ${testCase.expectedRedacted}, Got: ${result.hasSecrets}\n`);
      failed++;
    }
  });
  
  // Summary
  console.log('='.repeat(50));
  console.log(`Secret Redaction Test Results:`);
  console.log(`✅ Passed: ${passed}/${TEST_CASES.length}`);
  console.log(`❌ Failed: ${failed}/${TEST_CASES.length}`);
  
  if (failed === 0) {
    console.log('\n🎉 All secret redaction tests passed!');
    console.log('✅ Ready for production - secrets will be properly redacted');
  } else {
    console.log('\n⚠️  Some tests failed - review secret detection patterns');
  }
  
  return failed === 0;
}

// Example of redacted output
function showRedactionExample() {
  console.log('\n' + '='.repeat(50));
  console.log('Example Redaction Output:\n');
  
  const exampleCode = `const config = {
  openai_key: "sk-proj-abcdefghijklmnopqrstuvwxyz1234567890ABCDEF",
  github_token: "ghp_1234567890abcdefghijklmnopqrstuvwxyz",
  database_url: "postgresql://user:secretpass@localhost:5432/myapp",
  port: 3000
};`;
  
  console.log('BEFORE redaction:');
  console.log(exampleCode);
  
  const redacted = redactSecrets(exampleCode);
  console.log('\nAFTER redaction:');
  console.log(redacted.text);
  
  console.log('\nRedacted patterns:');
  redacted.redactedPatterns.forEach(p => {
    console.log(`- ${p.name} (${p.count} occurrence${p.count > 1 ? 's' : ''})`);
  });
}

// Run the test suite
if (require.main === module) {
  const success = runSecretRedactionTests();
  showRedactionExample();
  
  process.exit(success ? 0 : 1);
}

module.exports = { redactSecrets, SECRET_PATTERNS };