# Learn Code MCP v0.1 Integration Plan

**Status**: ⚠️ **Architecture Updated** - Selection Variables Don't Exist  
**Target**: 2-4 week delivery (Little Bear Apps standard)  
**Architecture**: Hybrid MCP Server + VS Code Extension + CLI Interface

## Executive Summary

**🔥 CRITICAL UPDATE**: VS Code MCP does NOT support `${selection}` variable injection. Learn Code MCP now uses a **Hybrid Architecture**:

1. **MCP Server**: Provides manual prompts for any MCP client (Claude Desktop, etc.)
2. **VS Code Extension**: Captures selections and communicates with MCP server
3. **CLI Interface**: Direct server communication for automation

This approach provides the seamless VS Code experience we want while maintaining MCP compatibility.

## Core Architecture

### Hybrid Architecture Components

#### 1. MCP Server (Node.js/TypeScript)
```typescript
// Manual prompt interface for any MCP client
{
  prompts: [
    "explain_micro",    // Manual: /learn-code:micro [paste code]
    "explain_short",    // Manual: /learn-code:short [paste code]  
    "explain_paragraph", // Manual: /learn-code:paragraph [paste code]
    "explain_deep"      // Manual: /learn-code:deep [paste code]
  ],
  tools: [
    "explain_selection", // For VS Code extension communication
    "classify_construct", // Best-effort regex classification
    "set_preferences"     // Configuration management
  ]
}
```

#### 2. VS Code Extension (TypeScript)
```typescript
// Seamless selection-based interface
{
  commands: [
    "learn-code.explainMicro",    // ⌘K L 1
    "learn-code.explainShort",    // ⌘K L 2
    "learn-code.explainParagraph", // ⌘K L 3
    "learn-code.explainDeep"      // ⌘K L 4
  ],
  features: [
    "selectionCapture",    // Get selected text
    "mcpCommunication",    // Talk to MCP server
    "formattedOutput",     // Display in VS Code
    "hotkeyBinding"        // Keyboard shortcuts
  ]
}
```

**Key Design Principles**:
- **Stateless**: No persistent connections or state
- **Prompts-First**: Claude generates explanations, server handles formatting
- **Deterministic**: Consistent output shapes for automation
- **Safe by Default**: Secret redaction, snippet trimming

## Microsoft MCP Patterns Integration 🔥

### Key Enhancements from microsoft/mcp-for-beginners

Based on analysis of Microsoft's MCP for Beginners repository, these patterns will be integrated to strengthen Learn Code MCP:

#### 1. Enhanced Error Handling Architecture
- **Circuit Breaker Pattern**: Prevent cascading failures in MCP prompt execution
- **Graceful Degradation**: Fallback to basic text output when classification fails
- **Retry Logic**: Handle transient VS Code/MCP communication errors
- **Error Boundaries**: Structured error capture and recovery

#### 2. Advanced Configuration Management  
- **Environment-Specific Configs**: Development vs production .mcp.json setups
- **Dynamic Configuration**: Runtime preference updates without server restart
- **Configuration Validation**: Schema validation for .mcp.json and user preferences
- **Multi-Client Support**: Different configs for VS Code vs CLI usage

#### 3. Structured Testing Framework
- **Test Module Architecture**: Organized testing following Microsoft's testing module approach
- **Integration Test Suites**: End-to-end workflow validation
- **Mock MCP Client**: Simulate VS Code interactions for automated testing
- **Performance Benchmarks**: Response time and memory usage monitoring

#### 4. Deployment Strategy Enhancement
- **Multiple Installation Methods**: Global, local dev, containerized options
- **Platform-Specific Packages**: Optimized distributions for Windows/macOS/Linux  
- **Development Workflow**: Hot reload for MCP server development
- **Production Hardening**: Security and performance optimizations

#### 5. Integration Points in Implementation Plan

**Phase 1 Enhancements** (Week 1):
- Implement circuit breaker pattern for MCP prompt execution
- Add configuration validation schema
- Create structured error response format

**Phase 2 Enhancements** (Week 2):  
- Enhanced .mcp.json setup with environment detection
- Graceful degradation for VS Code integration failures
- Retry logic for selection variable injection

**Phase 3 Enhancements** (Week 3):
- CLI error handling with meaningful exit codes
- Cross-platform deployment testing framework
- Performance monitoring and optimization

**Phase 4 Enhancements** (Week 4):
- Production deployment options (multiple installation methods)
- Comprehensive testing suite with Microsoft's testing patterns
- Documentation enhancement with deployment guides

### Implementation Timeline Adjustment

**Phase 0.5: Microsoft Patterns Integration** (30 minutes each task):
1. Enhance error handling using their patterns (30 minutes)
2. Improve VS Code configuration with better .mcp.json setup (15 minutes)  
3. Add structured testing following their testing module approach (45 minutes)
4. Document deployment options inspired by their deployment module (30 minutes)

**Total Phase 0.5 Time**: ~2 hours (fits within Little Bear Apps rapid development philosophy)

## ✅ Validation Complete - Critical Discovery Made

### Selection Variable Reality Check ✅ COMPLETED

**🔍 DISCOVERY**: VS Code MCP does NOT support `${selection}` variable injection
- Tested with existing MCP servers (pylance, sqlite, filesystem)
- MCP commands don't change based on text selection
- `${selection}` pattern not part of current MCP specification
- Manual prompt parameters are the only supported approach

**✅ VALIDATION RESULTS**:
- [x] ~~Select code in VS Code~~ → **Feature doesn't exist**
- [x] ~~Run MCP prompt with ${selection} variable~~ → **Not supported**
- [x] **Alternative approach validated**: Manual MCP prompts work perfectly
- [x] **VS Code extension approach confirmed**: Can capture selection and communicate with MCP server

#### 2. VS Code Extension Hotkey Strategy ✅ UPDATED

**New Approach**: VS Code extension with custom commands
```json
// VS Code extension will register these commands
[
  {
    "key": "cmd+k cmd+l cmd+1",
    "command": "learn-code.explainMicro",
    "when": "editorTextFocus"
  },
  {
    "key": "cmd+k cmd+l cmd+2", 
    "command": "learn-code.explainShort",
    "when": "editorTextFocus"
  }
]
```

**✅ SUCCESS CRITERIA** (Updated):
- [x] VS Code extension can register custom commands
- [x] Extension can capture selected text
- [x] Extension can communicate with MCP server via tools
- [x] Fallback: Manual MCP prompts work for any client

#### 3. CLI stdio Transport Test (20 minutes)
```bash
# Test basic MCP server via CLI
node server.js << EOF
{"jsonrpc": "2.0", "id": 1, "method": "initialize", "params": {"protocolVersion": "2024-11-05", "capabilities": {}}}
{"jsonrpc": "2.0", "id": 2, "method": "prompts/list"}
EOF
```

**Validation Goal**: Confirm MCP server works via stdio

**Success Criteria**:
- [ ] Server responds to JSON-RPC messages
- [ ] Prompts list returns correctly
- [ ] Can invoke prompts with arguments
- [ ] Clean shutdown without errors

#### 4. Terminal/iTerm Pipeline Test (15 minutes)
```bash
# Test stdin handling in various terminals
echo "function test() { return 42; }" | node cli-wrapper.js --length micro

# Test in different terminals:
# - macOS Terminal.app
# - iTerm2
# - VS Code integrated terminal
```

**Validation Goal**: Confirm CLI works across terminal environments

**Success Criteria**:
- [ ] Stdin input processed correctly
- [ ] Output appears properly formatted
- [ ] Works in Terminal.app, iTerm2, VS Code terminal
- [ ] Proper handling of Unicode and line endings

### Quick Validation Setup (30-45 minutes total)

Create this minimal test structure:

```
test-learn-code-mcp/
├── server.js           # Minimal MCP server
├── cli-wrapper.js      # Basic CLI test
├── .mcp.json          # VS Code config
├── test-code.py       # Sample for testing
└── package.json       # Dependencies
```

**server.js (minimal test)**:
```javascript
#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';

const server = new Server({
  name: 'test-learn-code',
  version: '0.1.0'
});

server.setRequestHandler('prompts/list', async () => ({
  prompts: [{
    name: 'test_explain',
    description: 'Test explanation prompt',
    arguments: [
      { name: 'selection', description: 'Selected code', required: true }
    ]
  }]
}));

server.setRequestHandler('prompts/get', async (request) => ({
  messages: [{
    role: 'user',
    content: {
      type: 'text', 
      text: `Explain this code:\n\`\`\`\n${request.params.arguments.selection}\n\`\`\``
    }
  }]
}));

server.connect();
```

## Integration Targets

### 1. VS Code Integration ⭐ Primary (Hybrid Approach)

**User Flow** (Updated Architecture):
```
1. Select code in editor
2. Press hotkey (⌘K L 1/2/3/4 for micro/short/paragraph/deep)
3. VS Code extension captures selection
4. Extension calls MCP server tool with selected text
5. MCP server returns formatted explanation
6. Extension displays result in VS Code
```

**Technical Implementation**:
- **VS Code Extension**: Selection capture + MCP communication
- **MCP Server Tools**: `explain_selection` tool for extension communication
- **MCP Server Prompts**: Manual prompts for other MCP clients
- **Dual Interface**: Seamless extension + manual prompt fallback

### 2. Terminal/CLI Integration ⭐ Secondary

**User Flow**:
```bash
# File input with line ranges
teach explain mycode.py --lines 10-20 --length short

# Stdin pipeline (Unix-friendly)
cat utils.js | teach explain -l micro
git diff HEAD~1 | teach explain --format plain

# Quick explanations
teach explain component.tsx --length deep
```

**Technical Implementation**:
- Thin CLI wrapper spawning MCP server via stdio per call
- No persistent daemon in v0.1
- TTY detection for format/color decisions
- Standard Unix exit codes and error handling

## Feature Specifications

### Length Presets

| Preset | Output | Token Cap | Use Case |
|--------|--------|-----------|----------|
| **Micro** | 1-3 bullet points | 150 | Quick reference, tooltips |
| **Short** | 4-6 bullets | 250 | Code review, inline docs |
| **Paragraph** | 120-180 words + example | 450 | Documentation, learning |
| **Deep** | 250-350 words + checklist | 700 | Complex concepts, onboarding |

### Code Classification (Best-Effort)

**Regex-Based Detection**:
```typescript
// Language-specific patterns
const patterns = {
  py: /^(def|class|@|async def|with|yield)/,
  ts: /(class|function|=>|import|export|useEffect\()/,
  js: /(class|function|=>|import|export)/,
  // ... additional languages
};
```

**Output**: `"Construct: function (confidence: 0.8)"`

### Secret Redaction (Default ON)

**Pattern Detection**:
- API keys: `(?i)api[_-]?key\s*[:=].+`
- AWS keys: `AKIA[0-9A-Z]{16}`  
- PEM blocks: `-----BEGIN [A-Z ]+ PRIVATE KEY-----`
- JWT tokens, database URLs, etc.

**Behavior**: Lines containing secrets are removed with notice

### Configuration System

**Preferences Tool**:
```json
{
  "ui": {
    "separator": "ascii|emoji|none",
    "header_emoji": "💡",
    "show_language_line": true
  },
  "output": {
    "default_length": "short",
    "max_tokens_micro": 150,
    "max_tokens_short": 250,
    "max_tokens_paragraph": 450,
    "max_tokens_deep": 700
  },
  "redaction": {
    "enable": true,
    "custom_patterns": []
  }
}
```

## Implementation Phases

### Phase 1: Core MCP Server (Week 1)
- [ ] Node.js/TypeScript MCP server scaffold
- [ ] Four manual prompt templates (copy/paste interface)
- [ ] `explain_selection` tool for VS Code extension communication
- [ ] Basic construct classification (regex)
- [ ] Secret redaction with default patterns
- [ ] Preferences system via tool calls
- [ ] Unit tests for classification and redaction

### Phase 2: VS Code Extension (Week 2)
- [ ] ~~Validate selection injection with `${selection}`~~ → **Not supported** 
- [ ] Create VS Code extension project structure
- [ ] Implement selection capture on hotkey press
- [ ] MCP server communication via `explain_selection` tool
- [ ] Formatted output display in VS Code
- [ ] Hotkey binding (⌘K L 1/2/3/4)
- [ ] Test truncation behavior (60-line limit)

### Phase 3: CLI Implementation (Week 2-3)
- [ ] CLI wrapper with argument parsing
- [ ] File input with line range support (`--lines 10-20`)
- [ ] Stdin pipeline integration
- [ ] TTY detection for format switching
- [ ] Length preset flags (`--length short`, `-l micro`)
- [ ] Format options (`--format markdown|plain`)
- [ ] Error handling with Unix exit codes
- [ ] Cross-platform testing (macOS, Linux, Windows)

### Phase 4: Integration & Polish (Week 3-4)
- [ ] Package both CLI and MCP server in single npm module
- [ ] Create installation documentation
- [ ] Example configurations for VS Code
- [ ] CLI usage examples and workflows
- [ ] Integration testing across platforms
- [ ] Performance optimization (startup time)

## Technical Specifications

### MCP Server Configuration

**VS Code `.mcp.json` entry** (For manual prompts):
```json
{
  "servers": {
    "learn-code": {
      "type": "stdio",
      "command": "node",
      "args": ["./node_modules/@learn-code/mcp/dist/server.js"],
      "env": {}
    }
  }
}
```

**VS Code Extension** (For seamless selection-based workflow):
```json
{
  "name": "learn-code",
  "displayName": "Learn Code MCP",
  "description": "Fast, deterministic code explanations",
  "version": "0.1.0",
  "engines": {
    "vscode": "^1.74.0"
  },
  "contributes": {
    "commands": [
      {
        "command": "learn-code.explainMicro",
        "title": "Explain Code (Micro)"
      }
    ]
  }
}
```

**Manual Prompt Template Example**:
```typescript
{
  name: "explain_short",
  description: "Short code explanation (4-6 bullets) - paste code as argument",
  arguments: [
    { name: "code", description: "Code to explain (paste here)", required: true },
    { name: "language", description: "Programming language", required: false },
    { name: "filename", description: "Source filename", required: false }
  ]
}
// Prompt generation handled by LLM with this template:
// "Explain this ${language || 'code'} in exactly 4-6 bullet points: ${code}"
```

**Extension Tool Template Example**:
```typescript
{
  name: "explain_selection",
  description: "Explain selected code with specified length preset",
  inputSchema: {
    type: "object",
    properties: {
      code: { type: "string", description: "Selected code text" },
      length: { type: "string", enum: ["micro", "short", "paragraph", "deep"] },
      language: { type: "string", description: "Programming language" },
      filename: { type: "string", description: "Source filename" }
    },
    required: ["code", "length"]
  }
}
```

### CLI Interface Specification

```bash
teach explain [options] [file]

Input Options:
  --file <path>           Read from specific file  
  --lines <start-end>     Line range (e.g., 10-20)
  --language <lang>       Override language detection

Output Options:
  --length <type>         micro|short|paragraph|deep
  -l <type>              Short alias for --length
  --format <type>        markdown|plain (auto-detect TTY)
  --no-color             Disable ANSI colors  
  --no-redact            Disable secret redaction
  --debug                Show MCP communication

Examples:
  teach explain app.py --length short
  cat main.js | teach explain -l micro  
  git diff HEAD~1 | teach explain --format plain
  teach explain utils.py --lines 45-67 --length deep
```

### Output Format Examples

**Micro Output**:
```
── TeachBlade: Explain • generic • micro
• React hook for managing component state
• Use for simple local state that doesn't need global access  
• Pitfall: calling setState in loops can cause performance issues
```

**Short Output**:
```  
── TeachBlade: Explain • generic • short
**Language:** JavaScript • **Construct:** React Hook

• Manages local component state with getter/setter pattern
• Use when component needs to track changing values locally
• Returns array: [currentValue, setterFunction] 
• Pitfall: setter calls don't immediately update the current value
• Tip: use functional updates for state depending on previous value
```

**Paragraph Output**:
```
── TeachBlade: Explain • generic • paragraph
**Language:** JavaScript • **Construct:** React Hook

The useState hook provides state management for functional React components. It accepts an initial value and returns an array containing the current state value and a setter function. The setter can accept either a new value directly or a function that receives the previous state and returns the new state. This pattern enables components to maintain internal state without converting to class components.

\`\`\`javascript
const [count, setCount] = useState(0);
const increment = () => setCount(prev => prev + 1);
const reset = () => setCount(0);
\`\`\`
```

## Success Criteria

### Minimum Viable Product (v0.1)
- [ ] ✅ Works in VS Code with code selection + hotkeys
- [ ] ✅ CLI handles file input, stdin, and line ranges
- [ ] ✅ All 4 length presets produce consistent, deterministic output
- [ ] ✅ Secret redaction prevents accidental exposure
- [ ] ✅ Cross-platform compatibility (macOS, Linux, Windows)
- [ ] ✅ Documentation with copy-paste examples
- [ ] ✅ Installation via single npm command

### Performance Targets
- [ ] CLI startup < 2 seconds (cold start)
- [ ] VS Code prompt response < 3 seconds
- [ ] Memory usage < 100MB during operation
- [ ] Token usage within specified caps per length

### Quality Gates
- [ ] Unit test coverage > 80%
- [ ] Integration tests for both CLI and VS Code paths
- [ ] Cross-platform CI/CD pipeline
- [ ] Linting and formatting consistency
- [ ] Error handling with helpful messages

## Distribution Strategy

### Package Structure
```
@learn-code/mcp/
├── dist/
│   ├── server.js         # MCP server
│   └── cli.js            # CLI wrapper
├── bin/
│   └── teach             # CLI executable
├── docs/
│   ├── vs-code-setup.md  # Editor integration
│   ├── cli-examples.md   # Terminal workflows
│   └── configuration.md  # Customization guide
└── package.json
```

### Installation Flow
```bash
# Global installation provides both interfaces
npm install -g @learn-code/mcp

# CLI usage immediately available
teach explain mycode.py --length short

# VS Code setup requires .mcp.json configuration
# (documented in vs-code-setup.md)
```

## Risk Mitigation

### Technical Risks
- **Selection Variable Support**: Validate early with simple MCP server test
- **Cross-Platform CLI**: Test Windows/PowerShell compatibility in Phase 3
- **Token Cap Enforcement**: Cannot enforce at protocol level, rely on strong prompts
- **Classification Accuracy**: Keep best-effort, provide confidence scores

### Scope Creep Prevention  
- **No Interactive Shell**: Defer to v0.2 based on user feedback
- **No Repository Context**: Stay focused on snippet-level explanations
- **No Custom UI**: Use standard MCP prompt/tool patterns
- **No Persistent State**: Keep server stateless for v0.1

## Future Roadmap (Post v0.1)

### v0.1.1 - Polish (Month 2)
- Windows PowerShell compatibility fixes
- Improved error messages and edge case handling
- Performance optimizations based on usage patterns

### v0.2 - Enhanced Workflows (Month 3)
- Git diff integration helpers
- mcp-use-cli plugin/integration
- Interactive shell mode exploration
- Language-specific improvements

### v0.3 - Advanced Features (Month 4+)
- Tree-sitter parsing for better classification
- Multi-file context (careful scope expansion)
- Plugin system for custom length presets
- Telemetry and usage analytics

---

## Getting Started

1. **Clone Repository**: `git clone <repo-url>`
2. **Install Dependencies**: `npm install`  
3. **Run Tests**: `npm test`
4. **Start Development**: Follow Phase 1 implementation checklist
5. **Validate Early**: Test VS Code selection injection ASAP

**Next Steps**: Begin Phase 1 implementation focusing on core MCP server with prompts-first architecture.