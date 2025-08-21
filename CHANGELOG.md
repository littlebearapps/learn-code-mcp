# Changelog

All notable changes to Learn Code MCP will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2025-08-20 🚀

### ✨ Initial Production Release - Terminal/CLI Excellence

This marks the first production release of Learn Code MCP, focusing on terminal automation workflows and Claude Code integration.

### Added

#### Core MCP Server
- **4 MCP Prompts**: `explain_micro`, `explain_short`, `explain_paragraph`, `explain_deep`
- **3 MCP Tools**: `explain_selection`, `classify_construct`, `set_preferences`
- **JSON-RPC 2.0** stdio transport with Model Context Protocol support
- **Secret Redaction**: 11+ patterns for API keys, tokens, passwords, database URLs
- **Construct Classification**: Regex-based code pattern detection (functions, classes, etc.)
- **Workspace Context**: Project type detection and dependency analysis

#### CLI Implementation (`teach explain`)
- **File Input**: Direct file reading with language auto-detection
- **Stdin Pipelines**: Full Unix pipeline compatibility for automation
- **Line Range Selection**: `--lines 10-20` for focusing on specific code sections
- **Format Options**: Markdown (with colors) or plain text output
- **Language Override**: Manual language specification when auto-detection fails
- **Debug Mode**: MCP communication logging for troubleshooting
- **Cross-Platform**: Native performance on macOS, Linux, Windows

#### Claude Code Integration
- **Direct Commands**: `/learn-code-mcp:explain_*` working out-of-the-box
- **All Length Presets**: micro, short, paragraph, deep explanations available
- **Code Selection**: Seamless integration with Claude Code's selection system
- **No Setup Required**: Works immediately after npm install

#### Performance & Security
- **Fast Startup**: <400ms total execution time (server + CLI + processing)
- **Memory Efficient**: 32MB memory limit with V8 optimization flags
- **Security First**: Automatic secret redaction with detailed notices
- **Safe by Default**: No persistent state, stateless operation

#### Automation Features
- **Git Integration**: Perfect for `git diff`, `git show`, code review workflows
- **CI/CD Ready**: Pipeline-compatible with proper exit codes and error handling
- **PR Documentation**: Automated change analysis and documentation generation
- **Development Workflows**: File monitoring, pre-commit hooks, build integration

### Technical Details

#### Architecture
- **Prompts-First Design**: Uses MCP prompts to avoid double-LLM overhead
- **Hybrid Approach**: Manual prompts for any MCP client + tools for VS Code extension
- **Transport Agnostic**: stdio JSON-RPC for universal compatibility
- **Stateless**: No persistent connections or state between calls

#### Length Presets
- **micro**: 1-3 bullet points (150 token cap)
- **short**: 4-6 bullet points (250 token cap) 
- **paragraph**: 120-180 words + example (450 token cap)
- **deep**: 250-350 words + checklist (700 token cap)

#### Testing & Quality
- **17/17 Tests Passing**: Complete CLI and cross-platform compatibility validation
- **Performance Benchmarked**: Sub-400ms execution with memory optimization
- **Cross-Platform Verified**: macOS, Linux, Windows compatibility confirmed
- **Production Ready**: Comprehensive error handling and graceful degradation

### Examples

#### Basic CLI Usage
```bash
# File input with length presets
teach explain app.py --length short
teach explain utils.js --lines 45-67 --length deep

# Stdin pipeline automation
cat main.py | teach explain -l micro
git diff HEAD~1 | teach explain --format plain
```

#### Git Integration
```bash
# Code review automation
git show HEAD | teach explain --length paragraph
git diff --name-only HEAD~1 | xargs -I {} teach explain {} -l short

# PR documentation
git diff HEAD~1 | teach explain > pr-analysis.md
```

#### Claude Code Integration
```bash
# Direct usage in Claude Code terminal
/learn-code-mcp:explain_short [select your code]
/learn-code-mcp:explain_deep [select your code]
```

### Performance Metrics
- **Average Startup**: 380ms (CLI + MCP server + processing)
- **Memory Usage**: ~32MB with V8 optimization flags
- **Cross-Platform**: Native performance across all supported platforms
- **Throughput**: Suitable for CI/CD and automation workflows

### Notes
- **VS Code Extension**: Deferred to v0.2.0 to focus on terminal excellence
- **Focus**: Terminal automation workflows and developer CLI tools
- **Compatibility**: Requires Node.js ≥18.0.0
- **License**: MIT

---

## Future Releases

### [Planned] v0.2.0 - VS Code Extension Integration
- Native VS Code chat participant
- Workspace context collection
- Selection hotkeys and context menus
- Direct LLM integration

### [Planned] v0.3.0 - Enhanced Intelligence  
- Project type detection
- Framework-specific insights
- Custom explanation templates
- Plugin system

### [Planned] v1.0.0 - Stable API
- Stable public API
- Marketplace publishing
- Enterprise features
- Performance optimizations

---

**Built with [Model Context Protocol](https://modelcontextprotocol.io) 🚀**