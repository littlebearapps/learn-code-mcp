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
export declare class ConstructClassifier {
    private languagePatterns;
    private genericPatterns;
    constructor();
    private initializePatterns;
    /**
     * Classify code construct with confidence score
     */
    classify(code: string, languageHint?: string): ClassificationResult;
    private classifyWithLanguage;
    private classifyWithGenericPatterns;
    private detectLanguage;
    /**
     * Get detailed classification information
     */
    getDetailedClassification(code: string, languageHint?: string): {
        primary: ClassificationResult;
        alternatives: ClassificationResult[];
        languageConfidence: number;
    };
    /**
     * Add custom classification pattern
     */
    addCustomPattern(language: string, construct: string, regex: RegExp, confidence: number, details?: string): void;
}
