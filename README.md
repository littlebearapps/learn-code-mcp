# Learn Code MCP v0.1

> Fast, deterministic code explanations through Model Context Protocol (MCP) with VS Code extension and CLI support.

![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)
![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)
![MCP Version](https://img.shields.io/badge/MCP-2024--11--05-orange)

## ✨ Features

- **4 Length Presets**: micro, short, paragraph, deep explanations
- **Dual Interface**: VS Code extension + CLI for automation
- **Security First**: Built-in secret redaction with 11+ patterns
- **Context Aware**: Workspace integration with project type detection
- **Cross-Platform**: Works on macOS, Linux, Windows
- **Automation Ready**: Unix pipeline compatible CLI

## 🚀 Quick Start

### Installation

```bash
npm install -g @learn-code/mcp
```

### CLI Usage

```bash
# File input
teach explain app.py --length short

# Stdin pipeline  
cat main.js | teach explain -l micro

# Line range selection
teach explain utils.py --lines 45-67 --length deep

# Format options
git diff HEAD~1 | teach explain --format plain
```

### VS Code Integration

Add to your `.vscode/settings.json`:
```json
{
  "mcp.servers": {
    "learn-code": {
      "type": "stdio", 
      "command": "node",
      "args": ["./node_modules/@learn-code/mcp/dist/server.js"]
    }
  }
}
```

Use hotkeys `⌘K L 1/2/3/4` or Chat Participant `/learn-code explain`

## 📏 Length Presets

| Preset | Output | Tokens | Use Case |
|--------|--------|--------|----------|
| `micro` | 1-3 bullets | 150 | Quick overview |
| `short` | 4-6 bullets | 250 | Standard explanation |  
| `paragraph` | 120-180 words + example | 450 | Detailed with usage |
| `deep` | 250-350 words + checklist | 700 | Comprehensive analysis |

## 💻 CLI Reference

### Input Options
- `<file>` - Read from specific file
- `--lines <start-end>` - Line range (e.g., 10-20)
- `--language <lang>` - Override language detection

### Output Options  
- `--length <type>` - micro|short|paragraph|deep (default: short)
- `-l <type>` - Short alias for --length
- `--format <type>` - markdown|plain (default: markdown)
- `--no-color` - Disable ANSI colors
- `--no-redact` - Disable secret redaction

### Debug Options
- `--debug` - Show MCP communication details
- `--help` - Show usage information

## 🔒 Security Features

Automatically detects and redacts 11+ types of secrets:
- API keys (OpenAI, AWS, etc.)
- Database URLs and connection strings
- JWT tokens and bearer tokens
- Private keys and certificates
- Passwords and secrets
- GitHub tokens
- Email addresses in auth contexts

```bash
# Input with secrets gets automatically redacted
echo 'const key = "sk-1234567890abcdef";' | teach explain
# 🔒 Security Notice: 1 potential secret redacted for privacy
```

## 📁 Examples

### Basic Usage

```bash
# Explain a Python function
teach explain calculate_distance.py --length short

# Quick overview of JavaScript
echo "const users = await User.find({ active: true });" | teach explain -l micro

# Deep analysis with context
teach explain complex-algorithm.cpp --length deep --language cpp
```

### Pipeline Workflows

```bash
# Git integration
git show HEAD:src/auth.ts | teach explain --format plain

# Find and explain specific functions
grep -A 10 "function processData" app.js | teach explain -l paragraph

# Explain recent changes
git diff HEAD~1 | teach explain --length short
```

### Line Range Selection

```bash
# Focus on specific lines
teach explain large-file.py --lines 100-120 --length deep

# Error handling section
teach explain server.js --lines 45-67 --language javascript
```

## ⚡ Performance

- **Startup time**: ~77ms average (CLI + MCP server)
- **Processing**: ~75ms for typical code snippets  
- **Memory usage**: ~47MB (optimized with V8 flags)
- **Cross-platform**: Native performance on all platforms

```bash
# Run performance benchmark
npm run benchmark
```

## 🏗️ Architecture

### MCP Server
- **Prompts**: 4 manual explanation prompts for any MCP client
- **Tools**: 3 tools for VS Code extension communication
- **Transport**: stdio JSON-RPC for universal compatibility

### VS Code Extension  
- **Chat Participant**: Native VS Code chat integration
- **Selection Capture**: Automatic code selection via hotkeys
- **Context Collection**: Workspace metadata and project detection
- **MCP Communication**: Direct server communication via tools

### CLI Interface
- **Pipeline Compatible**: Standard Unix tool behavior
- **Format Options**: Markdown (colored) or plain text
- **Input Flexibility**: Files, stdin, line ranges
- **Cross-Platform**: Handles paths, Unicode, line endings

## 🔧 Development

### Local Setup

```bash
git clone https://github.com/little-bear-apps/learn-code-mcp.git
cd learn-code-mcp
npm install
npm run build
```

### Testing

```bash
# Run all tests
npm run test:all

# CLI tests only (12/12 passing)
npm run test:cli

# Cross-platform compatibility (5/5 passing)
npm run test:cross-platform

# Validate before publish
npm run validate
```

### Manual Testing

```bash
# Start MCP server in dev mode
npm run dev:server

# Test CLI in dev mode  
npm run dev:cli -- test-file.js --length micro --debug

# Test comprehensive functionality
./test-cli-comprehensive.sh
```

## 🛠️ Troubleshooting

### Common Issues

**CLI not found after install**:
```bash
# Check global bin path
npm list -g --depth=0
# Or use npx
npx @learn-code/mcp explain file.js
```

**VS Code extension not working**:
```bash
# Verify MCP server path
node ./node_modules/@learn-code/mcp/dist/server.js
```

**Permission errors**:
```bash
# Fix CLI permissions
chmod +x ./node_modules/.bin/teach
```

### Debug Mode

Use `--debug` flag to see MCP communication:
```bash
teach explain file.js --debug --length micro
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes with tests
4. Run `npm run validate` 
5. Submit a pull request

## 📜 License

MIT © Little Bear Apps

## 🗺️ Roadmap

- [x] **v0.1**: Core MCP server + CLI + VS Code extension ✅
- [ ] **v0.2**: Enhanced workspace context and LLM integration
- [ ] **v0.3**: Plugin system and custom explanation templates
- [ ] **v1.0**: Stable API and marketplace publishing

---

**Built with [Model Context Protocol](https://modelcontextprotocol.io) | Status: Production Ready 🚀**