/**
 * Response Streaming Utility
 * Provides progressive response streaming for better UX
 */
export interface StreamChunk {
    type: 'progress' | 'content' | 'notice' | 'complete';
    data: string;
    timestamp: number;
}
export declare class ResponseStreamer {
    private chunks;
    private onChunk?;
    constructor(onChunk?: (chunk: StreamChunk) => void);
    progress(message: string): void;
    content(text: string): void;
    notice(message: string): void;
    complete(): void;
    private addChunk;
    getAllChunks(): StreamChunk[];
    getFormattedResponse(): string;
    simulateStreaming(content: string, options?: {
        chunkSize?: number;
        delayMs?: number;
        includeProgress?: boolean;
    }): Promise<string>;
    private delay;
}
export declare function createResponseStreamer(onChunk?: (chunk: StreamChunk) => void): ResponseStreamer;
