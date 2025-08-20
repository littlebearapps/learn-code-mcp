# CLI Usage Examples & Workflows

This document provides comprehensive examples and automation workflows for the Learn Code MCP CLI tool.

## Basic Usage Patterns

### File Analysis

```bash
# Explain a complete file
teach explain app.py --length short

# Focus on specific function
teach explain utils.js --lines 45-67 --length paragraph

# Override language detection
teach explain config.txt --language yaml --length micro

# Deep analysis with context
teach explain complex-algorithm.cpp --length deep --language cpp
```

### Pipeline Integration

```bash
# Git integration
git show HEAD:src/auth.ts | teach explain --format plain
git diff HEAD~1 | teach explain --length short

# Find and explain patterns
grep -A 10 "function processData" *.js | teach explain -l paragraph
find . -name "*.py" -exec grep -l "async def" {} \; | head -1 | xargs teach explain

# Code review workflow
git diff --name-only HEAD~1 | while read file; do
  echo "=== Explaining changes in $file ==="
  git show HEAD:$file | teach explain --length short --filename $file
done
```

### Interactive Usage

```bash
# Quick code snippet explanation
echo "const users = await User.find({ active: true });" | teach explain -l micro

# Multi-line code explanation
cat << 'EOF' | teach explain --length paragraph
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}
EOF
```

## Development Workflows

### Code Review Automation

```bash
#!/bin/bash
# review-changes.sh - Automated code review helper

echo "📋 Code Review Assistant"
echo "======================="

# Get changed files
changed_files=$(git diff --name-only HEAD~1)

for file in $changed_files; do
  echo -e "\n📄 Analyzing: $file"
  echo "-------------------"
  
  # Explain the changes
  git show HEAD:$file | teach explain --length short --filename "$file" --format plain
  
  # Show the actual diff for context
  echo -e "\n🔍 Changes:"
  git diff HEAD~1 -- "$file" | head -20
done
```

### Learning New Codebases

```bash
#!/bin/bash
# explore-codebase.sh - Learn about a new project

project_path="${1:-.}"
echo "🔍 Exploring codebase: $project_path"

# Find main entry points
echo -e "\n📋 Main Files:"
find "$project_path" -name "main.*" -o -name "index.*" -o -name "app.*" | head -5 | while read file; do
  echo "=== $file ==="
  teach explain "$file" --length short
done

# Find configuration files
echo -e "\n⚙️  Configuration:"
find "$project_path" -name "*.config.*" -o -name "*.json" -o -name "Dockerfile" | head -3 | while read file; do
  echo "=== $file ==="
  teach explain "$file" --length micro
done
```

### Documentation Generation

```bash
#!/bin/bash
# generate-docs.sh - Auto-generate code documentation

output_dir="docs/code-explanations"
mkdir -p "$output_dir"

echo "📚 Generating Code Documentation"

# Process all source files
find src/ -name "*.js" -o -name "*.ts" -o -name "*.py" | while read file; do
  output_file="$output_dir/$(basename "$file" | sed 's/\.[^.]*$/.md/')"
  
  echo "Processing: $file -> $output_file"
  
  {
    echo "# $(basename "$file")"
    echo ""
    echo "**File:** \`$file\`"
    echo ""
    echo "## Overview"
    echo ""
    teach explain "$file" --length paragraph --format plain
    echo ""
    echo "## Source Code"
    echo ""
    echo '```'$(basename "$file" | sed 's/.*\.//')
    cat "$file"
    echo '```'
  } > "$output_file"
done
```

## Advanced Automation

### CI/CD Integration

```yaml
# .github/workflows/code-explanation.yml
name: Generate Code Explanations

on:
  pull_request:
    types: [opened, synchronize]

jobs:
  explain-changes:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
        with:
          fetch-depth: 2
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install Learn Code MCP
        run: npm install -g @learn-code/mcp
        
      - name: Explain Changed Files
        run: |
          echo "## 📝 Code Explanations" >> explanation.md
          echo "" >> explanation.md
          
          git diff --name-only HEAD~1 | while read file; do
            if [[ $file =~ \.(js|ts|py|go|rs)$ ]]; then
              echo "### $file" >> explanation.md
              echo "" >> explanation.md
              git show HEAD:$file | teach explain --format plain --length short >> explanation.md
              echo "" >> explanation.md
            fi
          done
          
      - name: Comment PR
        uses: actions/github-script@v6
        with:
          script: |
            const fs = require('fs');
            const explanation = fs.readFileSync('explanation.md', 'utf8');
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: explanation
            });
```

### Pre-commit Hooks

```bash
#!/bin/bash
# .git/hooks/pre-commit - Explain staged changes

echo "🔍 Analyzing staged changes..."

# Get staged files
staged_files=$(git diff --cached --name-only)

for file in $staged_files; do
  # Only process source code files
  if [[ $file =~ \.(js|ts|py|go|rs|java|cpp|c)$ ]]; then
    echo "Explaining: $file"
    
    # Explain the staged changes
    git show :$file | teach explain --length micro --filename "$file"
    
    # Ask for confirmation if complex changes detected
    complexity=$(git show :$file | teach explain --length micro | wc -w)
    if [ $complexity -gt 50 ]; then
      echo "⚠️  Complex changes detected in $file ($complexity words)"
      read -p "Continue with commit? (y/N): " -n 1 -r
      echo
      if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Commit aborted"
        exit 1
      fi
    fi
  fi
done
```

### Team Onboarding Scripts

```bash
#!/bin/bash
# onboard-developer.sh - Help new team members understand codebase

developer_name="$1"
echo "👋 Welcome $developer_name! Let's explore the codebase together."

# Create personalized learning guide
learning_guide="docs/onboarding-$developer_name.md"
{
  echo "# $developer_name's Learning Guide"
  echo ""
  echo "Generated on: $(date)"
  echo ""
  echo "## Project Architecture"
  echo ""
  
  # Explain main architecture files
  for file in src/index.* src/app.* src/main.*; do
    if [ -f "$file" ]; then
      echo "### $(basename "$file")"
      echo ""
      teach explain "$file" --length paragraph --format plain
      echo ""
    fi
  done
  
  echo "## Key Components"
  echo ""
  
  # Find and explain important modules
  find src/ -name "*.js" -o -name "*.ts" | head -10 | while read file; do
    echo "### $file"
    echo ""
    teach explain "$file" --length short --format plain
    echo ""
  done
  
} > "$learning_guide"

echo "📚 Learning guide created: $learning_guide"
```

## Specialized Workflows

### Security Analysis

```bash
#!/bin/bash
# security-review.sh - Analyze code for security patterns

echo "🔒 Security Analysis"
echo "==================="

# Find files that might contain security-sensitive code
security_files=$(find . -name "*.js" -o -name "*.ts" -o -name "*.py" | xargs grep -l -i "password\|token\|secret\|auth\|encrypt" | head -10)

for file in $security_files; do
  echo -e "\n🔍 Security review: $file"
  echo "----------------------------"
  
  # Get security-focused explanation
  teach explain "$file" --length deep --format plain | grep -i "security\|password\|token\|auth\|encrypt"
done
```

### Performance Analysis

```bash
#!/bin/bash
# performance-review.sh - Identify performance bottlenecks

echo "⚡ Performance Analysis"
echo "====================="

# Find potentially performance-sensitive files
perf_files=$(find . -name "*.js" -o -name "*.ts" -o -name "*.py" | xargs grep -l -i "loop\|async\|await\|promise\|performance" | head -5)

for file in $perf_files; do
  echo -e "\n📊 Performance review: $file"
  echo "------------------------------"
  
  # Analyze for performance patterns
  teach explain "$file" --length paragraph --format plain
done
```

### Testing Strategy

```bash
#!/bin/bash
# test-analysis.sh - Understand testing patterns

echo "🧪 Test Analysis"
echo "==============="

# Find test files
test_files=$(find . -path "*/test*" -name "*.js" -o -path "*/spec*" -name "*.js" -o -name "*.test.*" -o -name "*.spec.*" | head -5)

for file in $test_files; do
  echo -e "\n🔬 Test file: $file"
  echo "--------------------"
  
  teach explain "$file" --length short --format plain
done
```

## Integration Examples

### Editor Integration (Vim/Neovim)

```vim
" Add to .vimrc / init.vim
" Explain selected code
vnoremap <leader>e :'<,'>!teach explain --length short --format plain<CR>

" Explain current function
nnoremap <leader>ef :?^function\\|^def\\|^class<CR>V/^}\\|^$<CR>:'<,'>!teach explain --length paragraph --format plain<CR>

" Explain current file
nnoremap <leader>eF :!teach explain % --length short --format plain<CR>
```

### Emacs Integration

```elisp
;; Add to .emacs or init.el
(defun explain-region (start end)
  "Explain selected code region"
  (interactive "r")
  (shell-command-on-region start end "teach explain --length short --format plain" t))

(global-set-key (kbd "C-c e") 'explain-region)

(defun explain-buffer ()
  "Explain entire buffer"
  (interactive)
  (shell-command (concat "teach explain " buffer-file-name " --length short") "*Code Explanation*"))

(global-set-key (kbd "C-c E") 'explain-buffer)
```

### VS Code Task Integration

```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Explain Selection",
      "type": "shell",
      "command": "echo '${selectedText}' | teach explain -l short",
      "group": "build",
      "presentation": {
        "echo": true,
        "reveal": "always"
      }
    },
    {
      "label": "Explain Current File", 
      "type": "shell",
      "command": "teach explain '${file}' --length paragraph",
      "group": "build"
    }
  ]
}
```

## Troubleshooting Common Workflows

### Debug Failed Explanations

```bash
# Enable debug mode for troubleshooting
teach explain problem-file.js --debug --length micro

# Test with minimal input
echo "console.log('test');" | teach explain --debug

# Check server communication
teach explain --help
```

### Handle Large Files

```bash
# Process large files in chunks
split -l 100 large-file.py chunk_
for chunk in chunk_*; do
  echo "=== Processing $chunk ==="
  teach explain "$chunk" --length micro
done
rm chunk_*

# Focus on specific functions
grep -n "^function\|^def\|^class" large-file.js | while read line; do
  line_num=$(echo $line | cut -d: -f1)
  end_line=$((line_num + 20))
  teach explain large-file.js --lines "$line_num-$end_line" --length micro
done
```

### Batch Processing Optimization

```bash
#!/bin/bash
# Parallel processing for large codebases
find src/ -name "*.js" | xargs -P 4 -I {} bash -c 'teach explain "{}" --length micro > "explanations/$(basename {} .js).txt"'
```

This comprehensive guide provides practical examples for integrating Learn Code MCP CLI into various development workflows, from simple code review to complex CI/CD automation.