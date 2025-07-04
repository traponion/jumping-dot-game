import type * as fabric from 'fabric';

export class ResourceManager {
    constructor(private canvas: fabric.Canvas) {}

    renderAll(): void {
        if (!this.canvas) return;
        this.canvas.renderAll();
    }

    clearCanvas(): void {
        if (!this.canvas) {
            return; // Canvas already disposed or not initialized
        }
        this.canvas.backgroundColor = 'black';
        this.canvas.clear();
        this.canvas.renderAll();
    }

    dispose(): void {
        this.canvas.dispose();
    }

    async cleanup(): Promise<void> {
        // Dispose fabric canvas to prevent memory leaks and reinitialization errors
        if (this.canvas) {
            try {
                const canvasElement = this.canvas.getElement();

                // In fabric.js v6, dispose is async and must be awaited
                await this.canvas.dispose();

                // Clear canvas element to prevent reinitialization errors
                if (canvasElement) {
                    const context = canvasElement.getContext('2d');
                    if (context) {
                        context.clearRect(0, 0, canvasElement.width, canvasElement.height);
                    }
                    // Remove fabric-specific properties
                    (
                        canvasElement as HTMLCanvasElement & {
                            __fabric?: unknown;
                            _fabric?: unknown;
                        }
                    ).__fabric = undefined;
                    (
                        canvasElement as HTMLCanvasElement & {
                            __fabric?: unknown;
                            _fabric?: unknown;
                        }
                    )._fabric = undefined;
                }
            } catch (_error) {
                // Silent fail - this error is expected in normal cleanup scenarios
                // Canvas may already be disposed by the time cleanup is called
            }
            this.canvas = null as unknown as fabric.Canvas;
        }
    }
}
