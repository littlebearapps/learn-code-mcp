/**
 * Secret Redaction System
 *
 * Prevents accidental exposure of sensitive information in code explanations.
 * Uses pattern matching to detect and remove common secret patterns.
 */
export class SecretRedactor {
    secretPatterns;
    constructor() {
        this.secretPatterns = [
            // API Keys
            {
                name: 'API Key',
                pattern: /api[_-]?key\s*[:=]\s*['"]?[a-zA-Z0-9_-]{20,}['"]?/gi,
                replacement: 'API_KEY_REDACTED'
            },
            // AWS Access Keys
            {
                name: 'AWS Access Key',
                pattern: /AKIA[0-9A-Z]{16}/g,
                replacement: 'AWS_ACCESS_KEY_REDACTED'
            },
            // AWS Secret Keys
            {
                name: 'AWS Secret Key',
                pattern: /aws[_-]?secret[_-]?access[_-]?key\s*[:=]\s*['"]?[A-Za-z0-9+/]{40}['"]?/gi,
                replacement: 'AWS_SECRET_KEY_REDACTED'
            },
            // Private Keys (PEM format)
            {
                name: 'Private Key',
                pattern: /-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----/g,
                replacement: '-----BEGIN PRIVATE KEY-----\n[PRIVATE_KEY_REDACTED]\n-----END PRIVATE KEY-----'
            },
            // JWT Tokens
            {
                name: 'JWT Token',
                pattern: /eyJ[A-Za-z0-9_-]*\.[A-Za-z0-9_-]*\.[A-Za-z0-9_-]*/g,
                replacement: 'JWT_TOKEN_REDACTED'
            },
            // Database URLs
            {
                name: 'Database URL',
                pattern: /(postgres|mysql|mongodb|redis):\/\/[^@\s]*:[^@\s]*@[^\s]*/gi,
                replacement: 'DATABASE_URL_REDACTED'
            },
            // Generic passwords
            {
                name: 'Password',
                pattern: /password\s*[:=]\s*['"][^'"]{8,}['"]/gi,
                replacement: 'password="PASSWORD_REDACTED"'
            },
            // Generic tokens
            {
                name: 'Token',
                pattern: /token\s*[:=]\s*['"][a-zA-Z0-9_-]{20,}['"]/gi,
                replacement: 'token="TOKEN_REDACTED"'
            },
            // Generic secrets
            {
                name: 'Secret',
                pattern: /secret\s*[:=]\s*['"][^'"]{16,}['"]/gi,
                replacement: 'secret="SECRET_REDACTED"'
            },
            // GitHub tokens
            {
                name: 'GitHub Token',
                pattern: /gh[ps]_[A-Za-z0-9_]{36,255}/g,
                replacement: 'GITHUB_TOKEN_REDACTED'
            },
            // Credit card numbers (basic pattern)
            {
                name: 'Credit Card',
                pattern: /\b(?:\d{4}[-\s]?){3}\d{4}\b/g,
                replacement: 'XXXX-XXXX-XXXX-XXXX'
            },
            // Email addresses in sensitive contexts
            {
                name: 'Email in Auth',
                pattern: /(email|username|user)\s*[:=]\s*['"][^'"]*@[^'"]*['"]/gi,
                replacement: '$1="user@example.com"'
            }
        ];
    }
    /**
     * Redact secrets from code while preserving structure and readability
     */
    redact(code) {
        if (!code || typeof code !== 'string') {
            return code;
        }
        let redactedCode = code;
        const redactionNotices = [];
        let totalSecretsFound = 0;
        for (const { name, pattern, replacement } of this.secretPatterns) {
            const matches = redactedCode.match(pattern);
            if (matches) {
                const count = matches.length;
                totalSecretsFound += count;
                redactionNotices.push(`${count} ${name}${count > 1 ? 's' : ''} redacted`);
                redactedCode = redactedCode.replace(pattern, replacement);
            }
        }
        // Add redaction notice if secrets were found
        if (totalSecretsFound > 0) {
            const notice = `\n// ⚠️ SECURITY NOTICE: ${totalSecretsFound} potential secret${totalSecretsFound > 1 ? 's' : ''} redacted\n// Redacted items: ${redactionNotices.join(', ')}\n`;
            redactedCode = notice + redactedCode;
        }
        return redactedCode;
    }
    /**
     * Get detailed redaction results
     */
    getRedactionDetails(code) {
        if (!code || typeof code !== 'string') {
            return {
                redactedCode: code,
                secretsFound: 0,
                redactionNotices: []
            };
        }
        let redactedCode = code;
        const redactionNotices = [];
        let secretsFound = 0;
        for (const { name, pattern, replacement } of this.secretPatterns) {
            const matches = redactedCode.match(pattern);
            if (matches) {
                const count = matches.length;
                secretsFound += count;
                redactionNotices.push(`${count} ${name}${count > 1 ? 's' : ''}`);
                redactedCode = redactedCode.replace(pattern, replacement);
            }
        }
        return {
            redactedCode,
            secretsFound,
            redactionNotices
        };
    }
    /**
     * Add custom redaction pattern
     */
    addCustomPattern(name, pattern, replacement) {
        this.secretPatterns.push({ name, pattern, replacement });
    }
    /**
     * Test if code contains potential secrets without redacting
     */
    containsSecrets(code) {
        if (!code || typeof code !== 'string') {
            return false;
        }
        return this.secretPatterns.some(({ pattern }) => pattern.test(code));
    }
    /**
     * Get list of available redaction patterns
     */
    getAvailablePatterns() {
        return this.secretPatterns.map(p => p.name);
    }
}
