/**
 * Secret Redaction System
 *
 * Prevents accidental exposure of sensitive information in code explanations.
 * Uses pattern matching to detect and remove common secret patterns.
 */
export interface RedactionResult {
    redactedCode: string;
    secretsFound: number;
    redactionNotices: string[];
}
export declare class SecretRedactor {
    private secretPatterns;
    constructor();
    /**
     * Redact secrets from code while preserving structure and readability
     */
    redact(code: string): string;
    /**
     * Get detailed redaction results
     */
    getRedactionDetails(code: string): RedactionResult;
    /**
     * Add custom redaction pattern
     */
    addCustomPattern(name: string, pattern: RegExp, replacement: string): void;
    /**
     * Test if code contains potential secrets without redacting
     */
    containsSecrets(code: string): boolean;
    /**
     * Get list of available redaction patterns
     */
    getAvailablePatterns(): string[];
}
