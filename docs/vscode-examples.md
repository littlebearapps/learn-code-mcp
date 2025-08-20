# VS Code Examples & Configuration

This document provides complete setup examples and usage patterns for VS Code integration with Learn Code MCP.

## Configuration Examples

### Basic MCP Server Setup

Add to your workspace or global VS Code settings (`.vscode/settings.json`):

```json
{
  "mcp.servers": {
    "learn-code": {
      "type": "stdio",
      "command": "node", 
      "args": ["./node_modules/@learn-code/mcp/dist/server.js"],
      "capabilities": {
        "prompts": true,
        "tools": true
      }
    }
  }
}
```

### Global Installation Setup

For globally installed package:

```json
{
  "mcp.servers": {
    "learn-code": {
      "type": "stdio",
      "command": "node",
      "args": ["-e", "console.log(require.resolve('@learn-code/mcp/dist/server.js'))"],
      "capabilities": {
        "prompts": true,
        "tools": true
      }
    }
  }
}
```

### Development Setup

For local development with source files:

```json
{
  "mcp.servers": {
    "learn-code-dev": {
      "type": "stdio", 
      "command": "tsx",
      "args": ["./src/server.ts"],
      "capabilities": {
        "prompts": true,
        "tools": true
      },
      "env": {
        "DEBUG": "learn-code:*"
      }
    }
  }
}
```

## Hotkey Configuration

### Default Hotkeys

Add to your VS Code keybindings (`keybindings.json`):

```json
[
  {
    "key": "cmd+k cmd+l cmd+1",
    "command": "mcp.executePrompt",
    "args": {
      "server": "learn-code",
      "prompt": "explain_micro",
      "variables": {
        "selection": "${selection}",
        "language": "${languageId}",
        "filename": "${relativeFile}"
      }
    },
    "when": "editorHasSelection"
  },
  {
    "key": "cmd+k cmd+l cmd+2", 
    "command": "mcp.executePrompt",
    "args": {
      "server": "learn-code",
      "prompt": "explain_short",
      "variables": {
        "selection": "${selection}",
        "language": "${languageId}",
        "filename": "${relativeFile}"
      }
    },
    "when": "editorHasSelection"
  },
  {
    "key": "cmd+k cmd+l cmd+3",
    "command": "mcp.executePrompt", 
    "args": {
      "server": "learn-code",
      "prompt": "explain_paragraph",
      "variables": {
        "selection": "${selection}",
        "language": "${languageId}",
        "filename": "${relativeFile}"
      }
    },
    "when": "editorHasSelection"
  },
  {
    "key": "cmd+k cmd+l cmd+4",
    "command": "mcp.executePrompt",
    "args": {
      "server": "learn-code",
      "prompt": "explain_deep", 
      "variables": {
        "selection": "${selection}",
        "language": "${languageId}",
        "filename": "${relativeFile}"
      }
    },
    "when": "editorHasSelection"
  }
]
```

### Alternative Hotkey Schemes

#### Single-key Shortcuts (F1-F4)
```json
[
  {
    "key": "f1",
    "command": "mcp.executePrompt",
    "args": {
      "server": "learn-code", 
      "prompt": "explain_micro",
      "variables": {
        "selection": "${selection}",
        "language": "${languageId}",
        "filename": "${relativeFile}"
      }
    },
    "when": "editorHasSelection && editorLangId == 'javascript'"
  }
]
```

#### Context Menu Integration
```json
[
  {
    "key": "ctrl+shift+e",
    "command": "mcp.executePrompt",
    "args": {
      "server": "learn-code",
      "prompt": "explain_short",
      "variables": {
        "selection": "${selection}",
        "language": "${languageId}",
        "filename": "${relativeFile}"
      }
    },
    "when": "editorHasSelection"
  }
]
```

## Chat Participant Usage

### Basic Chat Commands

Use the `/learn-code` chat participant in VS Code Chat:

```
/learn-code explain micro
```

```
/learn-code explain short --selection
```

```
/learn-code explain paragraph --context
```

### Advanced Chat Integration

With workspace context:

```
/learn-code explain deep --workspace --context=current-function
```

With specific language override:

```
/learn-code explain short --language=typescript --selection
```

## Workspace Configuration Examples

### Multi-Project Setup

For workspaces with multiple projects:

```json
{
  "mcp.servers": {
    "learn-code-frontend": {
      "type": "stdio",
      "command": "node",
      "args": ["./frontend/node_modules/@learn-code/mcp/dist/server.js"],
      "workspaceFolder": "./frontend"
    },
    "learn-code-backend": {
      "type": "stdio", 
      "command": "node",
      "args": ["./backend/node_modules/@learn-code/mcp/dist/server.js"],
      "workspaceFolder": "./backend"
    }
  }
}
```

### Language-Specific Configuration

Enhanced configuration for specific languages:

```json
{
  "mcp.servers": {
    "learn-code": {
      "type": "stdio",
      "command": "node",
      "args": ["./node_modules/@learn-code/mcp/dist/server.js"],
      "capabilities": {
        "prompts": true,
        "tools": true
      },
      "languagePreferences": {
        "javascript": {
          "defaultLength": "short",
          "includeContext": true
        },
        "typescript": {
          "defaultLength": "paragraph", 
          "includeContext": true
        },
        "python": {
          "defaultLength": "short",
          "includeContext": false
        }
      }
    }
  }
}
```

### Team Settings

Project-wide settings for team use (`.vscode/settings.json`):

```json
{
  "mcp.servers": {
    "learn-code": {
      "type": "stdio",
      "command": "node",
      "args": ["./node_modules/@learn-code/mcp/dist/server.js"],
      "description": "Team code explanation tool",
      "capabilities": {
        "prompts": true,
        "tools": true
      }
    }
  },
  "mcp.promptDefaults": {
    "learn-code": {
      "includeContext": true,
      "defaultLength": "short"
    }
  }
}
```

## Usage Workflows

### Code Review Workflow

1. **Select problematic code**
2. **Press `⌘K L 3`** for detailed explanation
3. **Use explanation in PR comments**

### Learning Workflow

1. **Select unfamiliar pattern**
2. **Press `⌘K L 4`** for comprehensive analysis  
3. **Review examples and best practices**

### Documentation Workflow

1. **Select function or class**
2. **Press `⌘K L 2`** for standard explanation
3. **Copy explanation to code comments**

### Debugging Workflow

1. **Select error-prone code**
2. **Press `⌘K L 4`** for deep analysis
3. **Review potential issues and improvements**

## Troubleshooting

### MCP Server Not Starting

Check VS Code Developer Console (`Help > Toggle Developer Tools`):

```javascript
// Look for MCP-related errors
console.log('MCP servers:', mcp.servers);
```

### Selection Not Working

Verify variable substitution:

```json
{
  "key": "cmd+k cmd+l cmd+1",
  "command": "mcp.executePrompt",
  "args": {
    "server": "learn-code",
    "prompt": "explain_micro", 
    "variables": {
      "selection": "${selection}",
      "language": "${languageId}",
      "filename": "${file}"
    }
  },
  "when": "editorHasSelection"
}
```

### Performance Issues

Use development mode for debugging:

```json
{
  "mcp.servers": {
    "learn-code": {
      "type": "stdio",
      "command": "node",
      "args": ["./node_modules/@learn-code/mcp/dist/server.js"],
      "env": {
        "DEBUG": "learn-code:*",
        "NODE_ENV": "development"
      }
    }
  }
}
```

### Fallback Configuration

If MCP integration fails, use task-based approach:

```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Explain Code",
      "type": "shell",
      "command": "echo '${selectedText}' | teach explain -l short",
      "group": "build",
      "presentation": {
        "echo": true,
        "reveal": "always",
        "focus": false,
        "panel": "new"
      }
    }
  ]
}
```

## Advanced Features

### Custom Prompt Templates

Create custom prompts for specific use cases:

```json
{
  "mcp.customPrompts": {
    "learn-code": {
      "explain_security": {
        "template": "Analyze this code for security vulnerabilities: ${selection}",
        "length": "deep"
      },
      "explain_performance": {
        "template": "Review this code for performance issues: ${selection}",
        "length": "paragraph"
      }
    }
  }
}
```

### Integration with Other Extensions

Works well with:

- **GitLens**: Explain code in git blame annotations
- **Thunder Client**: Explain API endpoint implementations  
- **Error Lens**: Explain error-prone code patterns
- **Code Spell Checker**: Explain domain-specific terminology

### Batch Processing

Process multiple selections:

```json
{
  "key": "cmd+k cmd+l cmd+a",
  "command": "workbench.action.findInFiles",
  "args": {
    "query": "${selection}",
    "triggerSearch": false
  },
  "when": "editorHasSelection"
}
```

This configuration provides comprehensive VS Code integration patterns for Learn Code MCP, from basic setup to advanced team workflows.