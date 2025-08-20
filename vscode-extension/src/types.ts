/**
 * Learn Code MCP Extension Types
 * Shared interfaces between VS Code extension and MCP server
 */

export type ExplainStyle = "micro" | "short" | "paragraph" | "deep";

export interface RepoContext {
  rootName: string;
  gitBranch?: string;
  isMonorepo?: boolean;
}

export interface ProjectContext {
  type?: "node" | "python" | "go" | "java" | "rust" | "unknown";
  manifestPath?: string;
  frameworkHints?: string[];
  testFramework?: string;
}

export interface WorkspaceContext {
  repo?: RepoContext;
  project?: ProjectContext;
  deps?: string[];
}

// MCP Request Types
export interface ExplainPromptRequest {
  type: "explain";
  style: ExplainStyle;
  code: string;
  filePath?: string;
  languageId?: string;
  context?: WorkspaceContext;
}

export interface ClassifyToolRequest {
  type: "classify";
  code: string;
  filePath?: string;
  languageId?: string;
}

export interface SetPreferencesToolRequest {
  type: "setPreferences";
  preferences: {
    defaultStyle?: ExplainStyle;
    contextLevel?: "off" | "light" | "full";
  };
}

// MCP Response Types
export interface ExplainResponse {
  ok: true;
  style: ExplainStyle;
  explanation: string;
  redactionNotices?: string[];
  suggestions?: string[];
  references?: { filePath: string; symbol?: string }[];
  tokensUsed?: { prompt: number; completion: number };
}

export interface ClassifyResponse {
  ok: true;
  kind: "function" | "class" | "hook" | "test" | "config" | "unknown";
  languageId?: string;
  confidence: number;
}

export interface ErrorResponse {
  ok: false;
  code: "INVALID_INPUT" | "INTERNAL_ERROR" | "TOO_LARGE" | "UNSUPPORTED_LANGUAGE";
  message: string;
}

// Context Collection Options
export interface CollectContextOptions {
  level: "off" | "light" | "full";
  maxDeps: number;
  denylistGlobs: string[];
  anonymizePaths: boolean;
  cwd: string;
  cacheTtlMs?: number;
}

// Extension Configuration
export interface LearnCodeConfig {
  contextEnable: "off" | "light" | "full";
  contextMaxDeps: number;
  privacyAnonymizePaths: boolean;
  defaultsStyle: ExplainStyle;
}