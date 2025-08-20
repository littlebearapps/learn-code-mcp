#!/usr/bin/env node
declare class LearnCodeMCPServer {
    private server;
    private secretRedactor;
    private constructClassifier;
    private preferencesManager;
    constructor();
    private setupHandlers;
    private generateExplanationPrompt;
    private handleExplainSelection;
    private handleClassifyConstruct;
    private handleSetPreferences;
    run(): Promise<void>;
}
export { LearnCodeMCPServer };
