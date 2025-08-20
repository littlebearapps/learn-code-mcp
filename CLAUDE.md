# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview
Learn Code MCP is a Model Context Protocol server that provides fast, deterministic code explanations through four length presets (micro/short/paragraph/deep). It offers both VS Code integration with code selection hotkeys and a CLI for terminal automation workflows.

**Core Features**:
- **Four Length Presets**: micro (1-3 lines), short (4-6 bullets), paragraph (120-180 words), deep (250-350 words)
- **Dual Interface**: VS Code prompts with selection variables + CLI with stdin/file support
- **Prompts-First Architecture**: Uses MCP prompts to avoid double-LLM overhead
- **Safe by Default**: Built-in secret redaction and snippet trimming
- **Automation-Friendly**: Unix pipeline compatible for scripts and CI/CD

**Status**: Phase 2A Complete - VS Code Extension + MCP Server Production Ready

## Development Environment

### Multi-Instance Support
This project is configured for multi-instance Claude Code development using git worktrees:
- **Main**: `/lba/apps/mcp-servers/learn-code-mcp/` (main branch)
- **Dev**: `/lba/apps/mcp-servers/learn-code-mcp-dev/` (feature/dev-work)
- **Test**: `/lba/apps/mcp-servers/learn-code-mcp-test/` (feature/test-work)

This is part of **Zen Proj C** (gm4A) for dedicated MCP development.

### MCP Server Configuration
The project includes comprehensive MCP server setup:
- **Git MCP**: Advanced git operations
- **Brave Search**: Web research capabilities  
- **Context7**: Library documentation access
- **Mult-fetch**: Content fetching and scraping
- **Zen MCP**: Enhanced AI workflows (Instance C - Learn Code focused)
- **CCUsage**: Usage analytics and monitoring

### Zen Instance Configuration
This project uses Zen Instance C with specific configuration:
- Instance name: `zen-learn-code-mcp`
- Model restrictions: GPT-5, o3-mini, o4-mini only
- Daily budget: $2.50 USD
- Rate limit: 60 calls/minute
- Debug logging enabled

## Development Workflow

### Branch Strategy
- Never work directly on main branch
- Use feature branches for all development
- Coordinate changes to shared resources across worktree instances

### MCP Development Patterns
Follow Learn Code MCP specific patterns:
- **Prompts-First**: Use MCP prompts for LLM interactions, avoid server-side LLM calls
- **Stateless Design**: No persistent connections or state between calls
- **Length Determinism**: Enforce consistent output shapes via prompt constraints
- **Selection Injection**: Support `${selection}` variable for VS Code integration
- **CLI Transport**: Support stdio JSON-RPC for terminal usage

### Development Commands
```bash
# Start validation tests
npm run validate

# Run MCP server in development
npm run dev:server

# Test CLI wrapper
npm run dev:cli

# Run all tests
npm test

# Build for distribution  
npm run build
```

### Testing and Quality
- **Pre-Implementation Validation**: Complete tech validation tasks in `/docs/integration-plan-v0.1.md`
- **Selection Variable Testing**: Verify VS Code `${selection}` injection works
- **CLI stdio Testing**: Validate JSON-RPC communication via terminal
- **Cross-Platform Testing**: macOS, Linux, Windows compatibility
- **Length Preset Validation**: Ensure deterministic output for each preset

## Architecture Considerations

### MCP Server Structure (v0.1)
**Prompts** (Primary):
- `explain_micro`: 1-3 lines explanation (150 token cap)
- `explain_short`: 4-6 bullets explanation (250 token cap)  
- `explain_paragraph`: 120-180 words + example (450 token cap)
- `explain_deep`: 250-350 words + checklist (700 token cap)

**Tools** (Supporting):
- `classify_construct`: Best-effort regex-based code classification
- `set_preferences`: Configuration management for UI/output settings

**Variables**:
- `selection`: Selected code text (from VS Code or CLI input)
- `language`: Programming language (detected or specified)
- `filename`: Source filename for context

### Implementation Status
**✅ Phase 1 - Core Server** (Complete):
- MCP server with 4 prompts + 3 tools (`explain_selection`, `classify_construct`, `set_preferences`)
- Secret redaction and snippet trimming via `SecretRedactor`
- Construct classification via `ConstructClassifier`
- JSON-RPC 2.0 stdio transport

**✅ Phase 2A - VS Code Integration** (Complete):
- VS Code Chat Participant with `/explain` and `/classify` commands
- Native MCP integration via `vscode.lm.registerMcpServerDefinitionProvider`
- Workspace context collection (Git branch, project type, dependencies)
- Configuration settings and hotkey commands
- TypeScript compilation and extension scaffold

**🔄 Phase 2B - Enhanced Features** (Next):
- Enhanced explanation prompts with workspace context
- Response streaming and user feedback
- Advanced error handling and validation

**📋 Phase 2C - Testing & Polish** (Planned):
- Comprehensive integration testing
- Cross-platform compatibility verification
- Performance optimization and error handling

## Little Bear Apps Standards
Follow the microtools philosophy:
- 1-3 core features maximum
- Ship in 2-4 weeks
- Revenue-first approach
- Reuse patterns from `/lba/infrastructure/`

Refer to templates at `/lba/docs/templates/microtool-templates/` for project structure guidance.