/**
 * Preferences Management System
 *
 * Handles user configuration for output formatting, redaction settings,
 * and token limits across all explanation length presets.
 */
export interface UIPreferences {
    separator: 'ascii' | 'emoji' | 'none';
    header_emoji: string;
    show_language_line: boolean;
    show_construct_info: boolean;
    show_confidence_scores: boolean;
}
export interface OutputPreferences {
    default_length: 'micro' | 'short' | 'paragraph' | 'deep';
    max_tokens_micro: number;
    max_tokens_short: number;
    max_tokens_paragraph: number;
    max_tokens_deep: number;
    include_examples: boolean;
    include_checklists: boolean;
}
export interface RedactionPreferences {
    enable: boolean;
    custom_patterns: Array<{
        name: string;
        pattern: string;
        replacement: string;
    }>;
    show_redaction_notices: boolean;
    strict_mode: boolean;
}
export interface ClassificationPreferences {
    enable: boolean;
    show_confidence: boolean;
    min_confidence_threshold: number;
    custom_language_hints: Record<string, string>;
}
export interface Preferences {
    ui: UIPreferences;
    output: OutputPreferences;
    redaction: RedactionPreferences;
    classification: ClassificationPreferences;
}
export declare class PreferencesManager {
    private preferences;
    constructor();
    private getDefaultPreferences;
    /**
     * Get current preferences
     */
    getPreferences(): Preferences;
    /**
     * Update preferences with partial updates
     */
    updatePreferences(updates: Partial<Preferences>): void;
    /**
     * Reset preferences to defaults
     */
    resetToDefaults(): void;
    /**
     * Get specific preference section
     */
    getUIPreferences(): UIPreferences;
    getOutputPreferences(): OutputPreferences;
    getRedactionPreferences(): RedactionPreferences;
    getClassificationPreferences(): ClassificationPreferences;
    /**
     * Update specific preference sections
     */
    updateUIPreferences(updates: Partial<UIPreferences>): void;
    updateOutputPreferences(updates: Partial<OutputPreferences>): void;
    updateRedactionPreferences(updates: Partial<RedactionPreferences>): void;
    updateClassificationPreferences(updates: Partial<ClassificationPreferences>): void;
    /**
     * Get token limit for specific length preset
     */
    getTokenLimit(length: 'micro' | 'short' | 'paragraph' | 'deep'): number;
    /**
     * Validate preferences before applying
     */
    validatePreferences(preferences: Partial<Preferences>): {
        valid: boolean;
        errors: string[];
    };
    /**
     * Export preferences as JSON
     */
    exportPreferences(): string;
    /**
     * Import preferences from JSON
     */
    importPreferences(json: string): {
        success: boolean;
        error?: string;
    };
    /**
     * Get preferences summary for display
     */
    getPreferencesSummary(): string;
    /**
     * Deep merge preferences objects
     */
    private mergePreferences;
}
