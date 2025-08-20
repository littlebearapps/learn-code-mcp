/**
 * Response Streaming Utility
 * Provides progressive response streaming for better UX
 */

export interface StreamChunk {
  type: 'progress' | 'content' | 'notice' | 'complete';
  data: string;
  timestamp: number;
}

export class ResponseStreamer {
  private chunks: StreamChunk[] = [];
  private onChunk?: (chunk: StreamChunk) => void;

  constructor(onChunk?: (chunk: StreamChunk) => void) {
    this.onChunk = onChunk;
  }

  progress(message: string): void {
    this.addChunk('progress', message);
  }

  content(text: string): void {
    this.addChunk('content', text);
  }

  notice(message: string): void {
    this.addChunk('notice', message);
  }

  complete(): void {
    this.addChunk('complete', 'Stream complete');
  }

  private addChunk(type: StreamChunk['type'], data: string): void {
    const chunk: StreamChunk = {
      type,
      data,
      timestamp: Date.now()
    };
    
    this.chunks.push(chunk);
    this.onChunk?.(chunk);
  }

  getAllChunks(): StreamChunk[] {
    return [...this.chunks];
  }

  getFormattedResponse(): string {
    const contentChunks = this.chunks.filter(c => c.type === 'content');
    const notices = this.chunks.filter(c => c.type === 'notice');
    
    let response = contentChunks.map(c => c.data).join('');
    
    if (notices.length > 0) {
      response += '\n\n' + notices.map(n => `⚠️ ${n.data}`).join('\n');
    }
    
    return response;
  }

  // Simulate streaming response generation
  async simulateStreaming(
    content: string,
    options: {
      chunkSize?: number;
      delayMs?: number;
      includeProgress?: boolean;
    } = {}
  ): Promise<string> {
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

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export function createResponseStreamer(onChunk?: (chunk: StreamChunk) => void): ResponseStreamer {
  return new ResponseStreamer(onChunk);
}