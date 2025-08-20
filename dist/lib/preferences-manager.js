/**
 * Preferences Management System
 *
 * Handles user configuration for output formatting, redaction settings,
 * and token limits across all explanation length presets.
 */
export class PreferencesManager {
    preferences;
    constructor() {
        this.preferences = this.getDefaultPreferences();
    }
    getDefaultPreferences() {
        return {
            ui: {
                separator: 'ascii',
                header_emoji: '💡',
                show_language_line: true,
                show_construct_info: true,
                show_confidence_scores: false
            },
            output: {
                default_length: 'short',
                max_tokens_micro: 150,
                max_tokens_short: 250,
                max_tokens_paragraph: 450,
                max_tokens_deep: 700,
                include_examples: true,
                include_checklists: true
            },
            redaction: {
                enable: true,
                custom_patterns: [],
                show_redaction_notices: true,
                strict_mode: false
            },
            classification: {
                enable: true,
                show_confidence: true,
                min_confidence_threshold: 0.3,
                custom_language_hints: {}
            }
        };
    }
    /**
     * Get current preferences
     */
    getPreferences() {
        return JSON.parse(JSON.stringify(this.preferences));
    }
    /**
     * Update preferences with partial updates
     */
    updatePreferences(updates) {
        this.preferences = this.mergePreferences(this.preferences, updates);
    }
    /**
     * Reset preferences to defaults
     */
    resetToDefaults() {
        this.preferences = this.getDefaultPreferences();
    }
    /**
     * Get specific preference section
     */
    getUIPreferences() {
        return this.preferences.ui;
    }
    getOutputPreferences() {
        return this.preferences.output;
    }
    getRedactionPreferences() {
        return this.preferences.redaction;
    }
    getClassificationPreferences() {
        return this.preferences.classification;
    }
    /**
     * Update specific preference sections
     */
    updateUIPreferences(updates) {
        this.preferences.ui = { ...this.preferences.ui, ...updates };
    }
    updateOutputPreferences(updates) {
        this.preferences.output = { ...this.preferences.output, ...updates };
    }
    updateRedactionPreferences(updates) {
        this.preferences.redaction = { ...this.preferences.redaction, ...updates };
    }
    updateClassificationPreferences(updates) {
        this.preferences.classification = { ...this.preferences.classification, ...updates };
    }
    /**
     * Get token limit for specific length preset
     */
    getTokenLimit(length) {
        const limits = {
            micro: this.preferences.output.max_tokens_micro,
            short: this.preferences.output.max_tokens_short,
            paragraph: this.preferences.output.max_tokens_paragraph,
            deep: this.preferences.output.max_tokens_deep
        };
        return limits[length];
    }
    /**
     * Validate preferences before applying
     */
    validatePreferences(preferences) {
        const errors = [];
        // Validate UI preferences
        if (preferences.ui) {
            const { separator, header_emoji } = preferences.ui;
            if (separator && !['ascii', 'emoji', 'none'].includes(separator)) {
                errors.push('Invalid separator value');
            }
            if (header_emoji && typeof header_emoji !== 'string') {
                errors.push('Header emoji must be a string');
            }
        }
        // Validate output preferences
        if (preferences.output) {
            const { default_length, max_tokens_micro, max_tokens_short, max_tokens_paragraph, max_tokens_deep } = preferences.output;
            if (default_length && !['micro', 'short', 'paragraph', 'deep'].includes(default_length)) {
                errors.push('Invalid default length value');
            }
            const tokenLimits = [
                { name: 'micro', value: max_tokens_micro, min: 50, max: 300 },
                { name: 'short', value: max_tokens_short, min: 100, max: 500 },
                { name: 'paragraph', value: max_tokens_paragraph, min: 200, max: 800 },
                { name: 'deep', value: max_tokens_deep, min: 400, max: 1200 }
            ];
            tokenLimits.forEach(({ name, value, min, max }) => {
                if (value !== undefined && (typeof value !== 'number' || value < min || value > max)) {
                    errors.push(`Token limit for ${name} must be between ${min} and ${max}`);
                }
            });
        }
        // Validate redaction preferences
        if (preferences.redaction?.custom_patterns) {
            for (const pattern of preferences.redaction.custom_patterns) {
                if (!pattern.name || !pattern.pattern || !pattern.replacement) {
                    errors.push('Custom redaction patterns must have name, pattern, and replacement');
                }
                try {
                    new RegExp(pattern.pattern);
                }
                catch {
                    errors.push(`Invalid regex pattern: ${pattern.pattern}`);
                }
            }
        }
        // Validate classification preferences
        if (preferences.classification) {
            const { min_confidence_threshold } = preferences.classification;
            if (min_confidence_threshold !== undefined &&
                (typeof min_confidence_threshold !== 'number' ||
                    min_confidence_threshold < 0 ||
                    min_confidence_threshold > 1)) {
                errors.push('Confidence threshold must be between 0 and 1');
            }
        }
        return {
            valid: errors.length === 0,
            errors
        };
    }
    /**
     * Export preferences as JSON
     */
    exportPreferences() {
        return JSON.stringify(this.preferences, null, 2);
    }
    /**
     * Import preferences from JSON
     */
    importPreferences(json) {
        try {
            const imported = JSON.parse(json);
            const validation = this.validatePreferences(imported);
            if (!validation.valid) {
                return {
                    success: false,
                    error: `Validation failed: ${validation.errors.join(', ')}`
                };
            }
            this.preferences = this.mergePreferences(this.getDefaultPreferences(), imported);
            return { success: true };
        }
        catch (error) {
            return {
                success: false,
                error: `Invalid JSON: ${error instanceof Error ? error.message : 'Unknown error'}`
            };
        }
    }
    /**
     * Get preferences summary for display
     */
    getPreferencesSummary() {
        const prefs = this.preferences;
        return `
Preferences Summary:
• Default Length: ${prefs.output.default_length}
• Token Limits: micro(${prefs.output.max_tokens_micro}), short(${prefs.output.max_tokens_short}), paragraph(${prefs.output.max_tokens_paragraph}), deep(${prefs.output.max_tokens_deep})
• Secret Redaction: ${prefs.redaction.enable ? 'enabled' : 'disabled'}
• Classification: ${prefs.classification.enable ? 'enabled' : 'disabled'}
• UI Separator: ${prefs.ui.separator}
• Show Language Info: ${prefs.ui.show_language_line ? 'yes' : 'no'}
• Custom Patterns: ${prefs.redaction.custom_patterns.length}
    `.trim();
    }
    /**
     * Deep merge preferences objects
     */
    mergePreferences(defaults, updates) {
        const result = JSON.parse(JSON.stringify(defaults));
        for (const [key, value] of Object.entries(updates)) {
            if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
                result[key] = { ...result[key], ...value };
            }
            else {
                result[key] = value;
            }
        }
        return result;
    }
}
