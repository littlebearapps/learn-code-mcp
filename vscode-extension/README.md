# Learn Code VS Code Extension

Fast, deterministic code explanations with context-aware prompts powered by Model Context Protocol (MCP).

## ✨ Features

- **🎯 Four Length Presets**: micro, short, paragraph, deep explanations
- **🧠 Context-Aware**: Automatically includes workspace, project, and dependency context
- **💬 Chat Integration**: Native VS Code chat participant (`@learn-code`)
- **🔧 MCP Powered**: Uses Learn Code MCP server for explanations
- **🛡️ Privacy First**: Optional path anonymization and context control

## 🚀 Quick Start

### Installation

1. **Install the Extension** (when published to marketplace)
2. **Install Learn Code MCP Server**:
   ```bash
   cd your-workspace
   npm install @learn-code/mcp
   ```

3. **Configure MCP Server** (automatic via extension)

### Usage

Open VS Code Chat and use the Learn Code participant:

```
@learn-code /explain short
@learn-code /explain micro
@learn-code /classify
```

**Direct Commands** (via Command Palette):
- `Learn Code: Micro Explanation`
- `Learn Code: Short Explanation` 
- `Learn Code: Paragraph Explanation`
- `Learn Code: Deep Explanation`

## 📖 Examples

### Basic Usage
```
@learn-code /explain short
```
Select code → Explains with 4-6 bullet points including context

### Specific Length
```
@learn-code /explain deep
```
Comprehensive 250-350 word explanation with checklist

### Code Classification
```
@learn-code /classify
```
Identifies code construct type (function, class, hook, test, etc.)

## ⚙️ Configuration

### Context Collection
- **`learnCode.context.enable`**: `"off" | "light" | "full"` (default: `"light"`)
  - `off`: No workspace context
  - `light`: Basic project info + top dependencies
  - `full`: Complete workspace analysis

### Privacy Settings
- **`learnCode.privacy.anonymizePaths`**: `boolean` (default: `true`)
  - Redacts absolute paths in context for privacy

### Defaults
- **`learnCode.defaults.style`**: `"micro" | "short" | "paragraph" | "deep"` (default: `"short"`)
- **`learnCode.context.maxDeps`**: `number` (default: `20`)

### Example Settings
```json
{
  "learnCode.context.enable": "light",
  "learnCode.privacy.anonymizePaths": true,
  "learnCode.defaults.style": "short",
  "learnCode.context.maxDeps": 20
}
```

## 🏗️ Architecture

### Components
- **Chat Participant**: Handles `/explain` and `/classify` commands
- **MCP Server Provider**: Registers Learn Code MCP server with VS Code
- **Context Collector**: Gathers workspace, project, and dependency information
- **MCP Integration**: Uses VS Code's native MCP broker for communication

### Context Collection
Automatically detects and includes:
- **Repository**: Name, branch, monorepo status
- **Project Type**: Node.js, Python, Go, Rust, Java
- **Frameworks**: React, Vue, Angular, Express, Next.js, etc.
- **Test Framework**: Jest, Vitest, Mocha, pytest, etc.
- **Dependencies**: Top N dependencies from manifest files

### Privacy & Security
- Workspace trust required for context collection
- Optional path anonymization (`<workspace>` replacement)
- Built-in secret redaction via MCP server
- Configurable context levels

## 🛠️ Development

### Prerequisites
- VS Code 1.95.0+
- Node.js 18+
- Learn Code MCP server

### Build
```bash
npm install
npm run compile
```

### Test
```bash
npm run test
```

### Package
```bash
npm run vscode:prepublish
```

## 🔧 MCP Server Integration

This extension automatically registers the Learn Code MCP server with VS Code. The server provides:

- **Prompts**: `explain_micro`, `explain_short`, `explain_paragraph`, `explain_deep`
- **Tools**: `explain_selection`, `classify_construct`, `set_preferences`
- **Features**: Secret redaction, construct classification, workspace context

## 📚 Commands

| Command | Description |
|---------|-------------|
| `@learn-code /explain [style]` | Explain selection with optional style |
| `@learn-code /classify` | Classify code construct |
| `Learn Code: Open Settings` | Open extension settings |
| `Learn Code: Micro Explanation` | Quick micro explanation |
| `Learn Code: Short Explanation` | Standard short explanation |
| `Learn Code: Paragraph Explanation` | Detailed paragraph explanation |
| `Learn Code: Deep Explanation` | Comprehensive deep explanation |

## 🐛 Troubleshooting

### Extension Not Working
1. Check VS Code version (1.95.0+ required)
2. Verify workspace trust is enabled
3. Ensure MCP server is installed: `node dist/server.js`

### No Context Information
1. Check `learnCode.context.enable` setting
2. Verify workspace contains supported project files
3. Ensure workspace is trusted

### MCP Server Issues
1. Check **Output** → **Learn Code MCP** for logs
2. Run **MCP: List Servers** command
3. Verify server path in `.mcp.json`

## 📄 License

MIT License - see [LICENSE](../LICENSE) for details.

---

**Learn Code Extension v0.2.0** - Context-aware code explanations for VS Code