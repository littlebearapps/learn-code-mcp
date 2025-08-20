/**
 * Construct Classification System
 * 
 * Best-effort regex-based classification of code constructs.
 * Provides context hints for more targeted explanations.
 */

export interface ClassificationResult {
  construct: string;
  confidence: number;
  language?: string;
  details?: string;
}

interface LanguagePattern {
  name: string;
  patterns: Array<{
    construct: string;
    regex: RegExp;
    confidence: number;
    details?: string;
  }>;
}

export class ConstructClassifier {
  private languagePatterns!: LanguagePattern[];
  private genericPatterns!: Array<{
    construct: string;
    regex: RegExp;
    confidence: number;
    details?: string;
  }>;

  constructor() {
    this.initializePatterns();
  }

  private initializePatterns(): void {
    // Language-specific patterns
    this.languagePatterns = [
      // Python
      {
        name: 'python',
        patterns: [
          {
            construct: 'async function',
            regex: /async\s+def\s+\w+/,
            confidence: 0.9,
            details: 'Asynchronous function definition'
          },
          {
            construct: 'function',
            regex: /def\s+\w+\s*\(/,
            confidence: 0.9,
            details: 'Function definition'
          },
          {
            construct: 'class',
            regex: /class\s+\w+(?:\([^)]*\))?:/,
            confidence: 0.9,
            details: 'Class definition'
          },
          {
            construct: 'decorator',
            regex: /@\w+/,
            confidence: 0.8,
            details: 'Python decorator'
          },
          {
            construct: 'context manager',
            regex: /with\s+.+\s+as\s+\w+:/,
            confidence: 0.8,
            details: 'Context manager usage'
          },
          {
            construct: 'list comprehension',
            regex: /\[.+\s+for\s+.+\s+in\s+.+\]/,
            confidence: 0.8,
            details: 'List comprehension'
          },
          {
            construct: 'generator',
            regex: /yield\s+/,
            confidence: 0.8,
            details: 'Generator function'
          },
          {
            construct: 'lambda',
            regex: /lambda\s+.*:/,
            confidence: 0.7,
            details: 'Lambda function'
          }
        ]
      },

      // JavaScript/TypeScript
      {
        name: 'javascript',
        patterns: [
          {
            construct: 'async function',
            regex: /async\s+(function|\w+|\(.*\)\s*=>)/,
            confidence: 0.9,
            details: 'Asynchronous function'
          },
          {
            construct: 'arrow function',
            regex: /\(.*\)\s*=>/,
            confidence: 0.8,
            details: 'Arrow function expression'
          },
          {
            construct: 'function',
            regex: /function\s+\w+\s*\(/,
            confidence: 0.9,
            details: 'Function declaration'
          },
          {
            construct: 'class',
            regex: /class\s+\w+(?:\s+extends\s+\w+)?/,
            confidence: 0.9,
            details: 'ES6 class'
          },
          {
            construct: 'React hook',
            regex: /use[A-Z]\w*/,
            confidence: 0.8,
            details: 'React hook usage'
          },
          {
            construct: 'React component',
            regex: /(?:function|const)\s+[A-Z]\w*.*(?:return\s*\(|=>.*<)/,
            confidence: 0.8,
            details: 'React functional component'
          },
          {
            construct: 'object destructuring',
            regex: /const\s*\{[^}]+\}\s*=/,
            confidence: 0.7,
            details: 'Object destructuring assignment'
          },
          {
            construct: 'array destructuring',
            regex: /const\s*\[[^\]]+\]\s*=/,
            confidence: 0.7,
            details: 'Array destructuring assignment'
          },
          {
            construct: 'promise',
            regex: /\.then\(|\.catch\(|new Promise/,
            confidence: 0.7,
            details: 'Promise usage'
          },
          {
            construct: 'import statement',
            regex: /import\s+.*\s+from\s+/,
            confidence: 0.9,
            details: 'ES6 import'
          },
          {
            construct: 'export statement',
            regex: /export\s+(default\s+|const\s+|function\s+|class\s+)/,
            confidence: 0.9,
            details: 'ES6 export'
          }
        ]
      },

      // TypeScript specific
      {
        name: 'typescript',
        patterns: [
          {
            construct: 'interface',
            regex: /interface\s+\w+/,
            confidence: 0.9,
            details: 'TypeScript interface'
          },
          {
            construct: 'type alias',
            regex: /type\s+\w+\s*=/,
            confidence: 0.9,
            details: 'TypeScript type alias'
          },
          {
            construct: 'generic function',
            regex: /function\s+\w+<[^>]+>/,
            confidence: 0.8,
            details: 'Generic function'
          },
          {
            construct: 'enum',
            regex: /enum\s+\w+/,
            confidence: 0.9,
            details: 'TypeScript enum'
          }
        ]
      },

      // Go
      {
        name: 'go',
        patterns: [
          {
            construct: 'function',
            regex: /func\s+\w*\s*\(/,
            confidence: 0.9,
            details: 'Go function'
          },
          {
            construct: 'method',
            regex: /func\s*\([^)]+\)\s+\w+\s*\(/,
            confidence: 0.9,
            details: 'Go method with receiver'
          },
          {
            construct: 'struct',
            regex: /type\s+\w+\s+struct/,
            confidence: 0.9,
            details: 'Go struct definition'
          },
          {
            construct: 'interface',
            regex: /type\s+\w+\s+interface/,
            confidence: 0.9,
            details: 'Go interface'
          },
          {
            construct: 'goroutine',
            regex: /go\s+\w+\(/,
            confidence: 0.8,
            details: 'Goroutine launch'
          },
          {
            construct: 'channel operation',
            regex: /<-|->|make\(chan/,
            confidence: 0.7,
            details: 'Channel usage'
          }
        ]
      },

      // Rust
      {
        name: 'rust',
        patterns: [
          {
            construct: 'function',
            regex: /fn\s+\w+\s*\(/,
            confidence: 0.9,
            details: 'Rust function'
          },
          {
            construct: 'struct',
            regex: /struct\s+\w+/,
            confidence: 0.9,
            details: 'Rust struct'
          },
          {
            construct: 'enum',
            regex: /enum\s+\w+/,
            confidence: 0.9,
            details: 'Rust enum'
          },
          {
            construct: 'impl block',
            regex: /impl(?:\s*<[^>]*>)?\s+(?:\w+\s+for\s+)?\w+/,
            confidence: 0.8,
            details: 'Implementation block'
          },
          {
            construct: 'trait',
            regex: /trait\s+\w+/,
            confidence: 0.9,
            details: 'Rust trait'
          },
          {
            construct: 'macro',
            regex: /\w+!/,
            confidence: 0.6,
            details: 'Macro invocation'
          }
        ]
      }
    ];

    // Generic patterns that work across languages
    this.genericPatterns = [
      {
        construct: 'comment block',
        regex: /\/\*[\s\S]*?\*\/|\/\/.*|#.*|<!--[\s\S]*?-->/,
        confidence: 0.9,
        details: 'Comment or documentation'
      },
      {
        construct: 'conditional',
        regex: /if\s*\(|if\s+\w+/,
        confidence: 0.7,
        details: 'Conditional statement'
      },
      {
        construct: 'loop',
        regex: /for\s*\(|while\s*\(|for\s+\w+/,
        confidence: 0.7,
        details: 'Loop construct'
      },
      {
        construct: 'try-catch',
        regex: /try\s*\{|catch\s*\(|except\s*:/,
        confidence: 0.8,
        details: 'Error handling'
      },
      {
        construct: 'variable assignment',
        regex: /(?:let|const|var|auto)\s+\w+\s*=|^\s*\w+\s*=/m,
        confidence: 0.6,
        details: 'Variable declaration/assignment'
      },
      {
        construct: 'return statement',
        regex: /return\s+/,
        confidence: 0.7,
        details: 'Return statement'
      }
    ];
  }

  /**
   * Classify code construct with confidence score
   */
  classify(code: string, languageHint?: string): ClassificationResult {
    if (!code || typeof code !== 'string') {
      return {
        construct: 'unknown',
        confidence: 0,
        details: 'No code provided'
      };
    }

    const trimmedCode = code.trim();
    if (trimmedCode.length === 0) {
      return {
        construct: 'empty',
        confidence: 1,
        details: 'Empty code'
      };
    }

    // Try language-specific patterns first
    if (languageHint) {
      const result = this.classifyWithLanguage(trimmedCode, languageHint);
      if (result.confidence > 0.5) {
        return result;
      }
    }

    // Try to detect language and classify
    const detectedLanguage = this.detectLanguage(trimmedCode);
    if (detectedLanguage) {
      const result = this.classifyWithLanguage(trimmedCode, detectedLanguage);
      if (result.confidence > 0.5) {
        return { ...result, language: detectedLanguage };
      }
    }

    // Fall back to generic patterns
    const genericResult = this.classifyWithGenericPatterns(trimmedCode);
    return {
      ...genericResult,
      language: detectedLanguage || languageHint
    };
  }

  private classifyWithLanguage(code: string, language: string): ClassificationResult {
    const languagePattern = this.languagePatterns.find(
      pattern => pattern.name === language.toLowerCase()
    );

    if (!languagePattern) {
      return this.classifyWithGenericPatterns(code);
    }

    // Test language-specific patterns
    for (const pattern of languagePattern.patterns) {
      if (pattern.regex.test(code)) {
        return {
          construct: pattern.construct,
          confidence: pattern.confidence,
          details: pattern.details
        };
      }
    }

    // Fall back to generic patterns
    return this.classifyWithGenericPatterns(code);
  }

  private classifyWithGenericPatterns(code: string): ClassificationResult {
    for (const pattern of this.genericPatterns) {
      if (pattern.regex.test(code)) {
        return {
          construct: pattern.construct,
          confidence: pattern.confidence,
          details: pattern.details
        };
      }
    }

    return {
      construct: 'code snippet',
      confidence: 0.3,
      details: 'Generic code - unable to classify specifically'
    };
  }

  private detectLanguage(code: string): string | undefined {
    // Simple language detection based on syntax patterns
    const detectionPatterns = [
      { language: 'python', regex: /def\s+\w+\(|import\s+\w+|from\s+\w+\s+import/ },
      { language: 'javascript', regex: /function\s*\(|=>\s*\{|const\s+\w+\s*=/ },
      { language: 'typescript', regex: /interface\s+\w+|type\s+\w+\s*=|:\s*\w+(?:\[\])?(?:\s*\||\s*&|\s*;|\s*,)/ },
      { language: 'go', regex: /func\s+\w*\s*\(|package\s+\w+|import\s*\(/ },
      { language: 'rust', regex: /fn\s+\w+\s*\(|struct\s+\w+|impl\s+/ },
      { language: 'java', regex: /public\s+class|private\s+\w+|public\s+static/ },
      { language: 'csharp', regex: /public\s+class|namespace\s+\w+|using\s+System/ },
      { language: 'cpp', regex: /#include\s*<|std::|template\s*</ },
      { language: 'php', regex: /<\?php|function\s+\w+\s*\(.*\)\s*\{|\$\w+\s*=/ }
    ];

    for (const { language, regex } of detectionPatterns) {
      if (regex.test(code)) {
        return language;
      }
    }

    return undefined;
  }

  /**
   * Get detailed classification information
   */
  getDetailedClassification(code: string, languageHint?: string): {
    primary: ClassificationResult;
    alternatives: ClassificationResult[];
    languageConfidence: number;
  } {
    const primary = this.classify(code, languageHint);
    const alternatives: ClassificationResult[] = [];
    
    // Try other language patterns to find alternatives
    for (const langPattern of this.languagePatterns) {
      if (langPattern.name !== primary.language) {
        const result = this.classifyWithLanguage(code, langPattern.name);
        if (result.confidence > 0.3) {
          alternatives.push({ ...result, language: langPattern.name });
        }
      }
    }

    // Sort alternatives by confidence
    alternatives.sort((a, b) => b.confidence - a.confidence);

    return {
      primary,
      alternatives: alternatives.slice(0, 3), // Top 3 alternatives
      languageConfidence: primary.language ? 0.8 : 0.3
    };
  }

  /**
   * Add custom classification pattern
   */
  addCustomPattern(
    language: string,
    construct: string,
    regex: RegExp,
    confidence: number,
    details?: string
  ): void {
    let languagePattern = this.languagePatterns.find(p => p.name === language);
    
    if (!languagePattern) {
      languagePattern = { name: language, patterns: [] };
      this.languagePatterns.push(languagePattern);
    }

    languagePattern.patterns.push({
      construct,
      regex,
      confidence,
      details
    });

    // Sort patterns by confidence (highest first)
    languagePattern.patterns.sort((a, b) => b.confidence - a.confidence);
  }
}