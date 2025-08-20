# Learn Code MCP

Model Context Protocol server providing fast, deterministic code explanations through four length presets.

## Overview

Learn Code MCP delivers instant code explanations without repository context, focusing on generic language concepts and patterns. It supports both VS Code/Claude Code integration and terminal automation through a dual-interface approach.

**Key Features:**
- Four length presets: micro (1-3 lines), short (4-6 bullets), paragraph (120-180 words), deep (250-350 words)
- Prompts-first MCP architecture (no double-LLM overhead)
- Secret redaction and snippet trimming for safety
- Cross-platform CLI support with Unix pipeline compatibility
- Hotkey-driven workflows in VS Code

## Quick Start

### VS Code Integration
```bash
# Install and configure
npm install -g @learn-code/mcp

# Add to .mcp.json
{
  "servers": {
    "learn-code": {
      "type": "stdio",
      "command": "node",
      "args": ["./node_modules/@learn-code/mcp/dist/server.js"]
    }
  }
}

# Bind hotkeys (⌘⇧1/2/3/4) to explain_micro/short/paragraph/deep prompts
```

### CLI Usage
```bash
# File input with line ranges
teach explain mycode.py --lines 10-20 --length short

# Unix pipeline integration
cat utils.js | teach explain -l micro
git diff HEAD~1 | teach explain --format plain

# Quick explanations
teach explain component.tsx --length deep
```

## Architecture

**Prompts** (Primary):
- `explain_micro`: 1-3 lines explanation (150 token cap)
- `explain_short`: 4-6 bullets explanation (250 token cap)
- `explain_paragraph`: 120-180 words + example (450 token cap)  
- `explain_deep`: 250-350 words + checklist (700 token cap)

**Tools** (Configuration):
- `classify_construct`: Best-effort regex classification
- `set_preferences`: UI, output, and redaction settings

## Development

This project supports multi-instance Claude Code development using git worktrees.

### Project Status
- **Current Phase**: ✅ **v0.1 IMPLEMENTATION COMPLETE**
- **Architecture**: Hybrid MCP Server + VS Code Extension + CLI Interface
- **Core Features**: 4 prompts, 3 tools, secret redaction, construct classification, preferences management
- **Next Phase**: VS Code extension development (Phase 2)

### Development Commands
```bash
# Build the TypeScript project
npm run build

# Start development server  
npm run dev

# Test the MCP server
node test-server.cjs

# Test with manual commands
node run-server.mjs

# Test specific functionality
echo '{"jsonrpc": "2.0", "id": 1, "method": "tools/list"}' | node run-server.mjs
```

### Testing the v0.1 Implementation

```bash
# 1. Test server startup
node run-server.mjs

# 2. Test prompts list
(echo '{"jsonrpc": "2.0", "id": 1, "method": "initialize", "params": {"protocolVersion": "2024-11-05", "capabilities": {}, "clientInfo": {"name": "test", "version": "1.0.0"}}}'; echo '{"jsonrpc": "2.0", "id": 2, "method": "prompts/list"}') | node run-server.mjs

# 3. Test tools
(echo '{"jsonrpc": "2.0", "id": 1, "method": "initialize", "params": {"protocolVersion": "2024-11-05", "capabilities": {}, "clientInfo": {"name": "test", "version": "1.0.0"}}}'; echo '{"jsonrpc": "2.0", "id": 2, "method": "tools/list"}') | node run-server.mjs

# 4. Test classify_construct tool
(echo '{"jsonrpc": "2.0", "id": 1, "method": "initialize", "params": {"protocolVersion": "2024-11-05", "capabilities": {}, "clientInfo": {"name": "test", "version": "1.0.0"}}}'; echo '{"jsonrpc": "2.0", "id": 2, "method": "tools/call", "params": {"name": "classify_construct", "arguments": {"code": "function test() { return 42; }"}}}') | node run-server.mjs
```