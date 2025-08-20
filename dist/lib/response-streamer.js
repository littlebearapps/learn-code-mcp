/**
 * Response Streaming Utility
 * Provides progressive response streaming for better UX
 */
export class ResponseStreamer {
    chunks = [];
    onChunk;
    constructor(onChunk) {
        this.onChunk = onChunk;
    }
    progress(message) {
        this.addChunk('progress', message);
    }
    content(text) {
        this.addChunk('content', text);
    }
    notice(message) {
        this.addChunk('notice', message);
    }
    complete() {
        this.addChunk('complete', 'Stream complete');
    }
    addChunk(type, data) {
        const chunk = {
            type,
            data,
            timestamp: Date.now()
        };
        this.chunks.push(chunk);
        this.onChunk?.(chunk);
    }
    getAllChunks() {
        return [...this.chunks];
    }
    getFormattedResponse() {
        const contentChunks = this.chunks.filter(c => c.type === 'content');
        const notices = this.chunks.filter(c => c.type === 'notice');
        let response = contentChunks.map(c => c.data).join('');
        if (notices.length > 0) {
            response += '\n\n' + notices.map(n => `⚠️ ${n.data}`).join('\n');
        }
        return response;
    }
    // Simulate streaming response generation
    async simulateStreaming(content, options = {}) {
        const { chunkSize = 50, delayMs = 100, includeProgress = true } = options;
        if (includeProgress) {
            this.progress('Generating explanation...');
            await this.delay(delayMs);
        }
        // Stream content in chunks
        for (let i = 0; i < content.length; i += chunkSize) {
            const chunk = content.slice(i, i + chunkSize);
            this.content(chunk);
            if (i + chunkSize < content.length) {
                await this.delay(delayMs / 2); // Faster streaming for content
            }
        }
        this.complete();
        return this.getFormattedResponse();
    }
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
export function createResponseStreamer(onChunk) {
    return new ResponseStreamer(onChunk);
}
