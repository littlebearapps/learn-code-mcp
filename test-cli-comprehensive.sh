#!/bin/bash

# Comprehensive CLI Test Suite
echo "🚀 Learn Code MCP CLI Test Suite"
echo "=================================="

cd "/Users/nathanschram/Library/Mobile Documents/com~apple~CloudDocs/claude-code-tools/lba/apps/mcp-servers/learn-code-mcp"

passed=0
total=0

# Test function
test_cli() {
    local name="$1"
    local command="$2"
    local expected_exit="$3"
    
    total=$((total + 1))
    echo -e "\n🧪 TEST $total: $name"
    
    if eval "$command" > /tmp/cli-test.out 2>&1; then
        actual_exit=0
    else
        actual_exit=$?
    fi
    
    if [ "$actual_exit" -eq "$expected_exit" ]; then
        echo "✅ PASSED (exit code: $actual_exit)"
        passed=$((passed + 1))
    else
        echo "❌ FAILED (expected exit: $expected_exit, got: $actual_exit)"
        echo "Output:"
        cat /tmp/cli-test.out
    fi
}

# Create test file
cat > test-func.py << 'EOF'
def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n-1) + fibonacci(n-2)

def factorial(n):
    if n <= 1:
        return 1
    return n * factorial(n-1)
EOF

echo "📁 Created test files"

# Test 1: Help command
test_cli "Help Command" "node dist/cli.js --help" 0

# Test 2: File input
test_cli "File Input" "node dist/cli.js test-func.py --length micro" 0

# Test 3: Line range
test_cli "Line Range Selection" "node dist/cli.js test-func.py --lines 1-3 --length micro" 0

# Test 4: Language override
test_cli "Language Override" "node dist/cli.js test-func.py --language python --length micro" 0

# Test 5: Stdin pipeline
test_cli "Stdin Pipeline" "echo 'const add = (a, b) => a + b;' | node dist/cli.js --length micro" 0

# Test 6: Format options
test_cli "Plain Format" "echo 'let x = 5;' | node dist/cli.js --format plain --length micro" 0

# Test 7: No color option
test_cli "No Color Option" "echo 'let y = 10;' | node dist/cli.js --no-color --length micro" 0

# Test 8: Invalid file
test_cli "Invalid File Handling" "node dist/cli.js nonexistent.txt" 1

# Test 9: Invalid length
test_cli "Invalid Length Argument" "node dist/cli.js --length invalid" 1

# Test 10: Invalid lines format
test_cli "Invalid Lines Format" "node dist/cli.js test-func.py --lines invalid" 1

# Test 11: No input
test_cli "No Input Provided" "echo '' | node dist/cli.js" 1

# Test 12: Debug mode
test_cli "Debug Mode" "echo 'function test() {}' | node dist/cli.js --debug --length micro" 0

# Clean up
rm -f test-func.py /tmp/cli-test.out

# Results
echo -e "\n📊 TEST RESULTS:"
echo "Tests passed: $passed/$total"
echo "Success rate: $(( passed * 100 / total ))%"

if [ "$passed" -eq "$total" ]; then
    echo -e "\n🎉 ALL TESTS PASSED! CLI is fully functional!"
    exit 0
else
    echo -e "\n⚠️  $(( total - passed )) test(s) failed"
    exit 1
fi