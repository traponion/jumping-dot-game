import { JumpingDotGame } from './core/Game.js';

// Stage Select functionality with Canvas rendering
class StageSelect {
    private gameInstance: JumpingDotGame | null = null;
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private selectedStageIndex = 0;
    private stages = [
        { id: 1, name: 'STAGE 1', description: 'Basic tutorial stage' },
        { id: 2, name: 'STAGE 2', description: 'Moving platforms' }
    ];
    private animationId: number | null = null;
    private isActive = false;
    
    constructor() {
        this.canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
        this.ctx = this.canvas.getContext('2d')!;
    }
    
    async init(): Promise<void> {
        this.showStageSelect();
        this.setupEventListeners();
    }
    
    private showStageSelect(): void {
        this.isActive = true;
        this.selectedStageIndex = 0;
        this.startRenderLoop();
        
        // Hide game UI elements
        const gameUI = document.getElementById('gameUI') as HTMLElement;
        const info = document.querySelector('.info') as HTMLElement;
        const controls = document.querySelector('.controls') as HTMLElement;
        
        if (gameUI) gameUI.style.display = 'none';
        if (info) info.style.display = 'none';
        if (controls) controls.style.display = 'none';
    }
    
    private setupEventListeners(): void {
        document.addEventListener('keydown', (e) => {
            if (this.isActive) {
                this.handleKeyboard(e);
            }
        });
    }
    
    private handleKeyboard(e: KeyboardEvent): void {
        switch (e.key) {
            case 'ArrowUp':
            case 'ArrowLeft':
                e.preventDefault();
                this.selectedStageIndex = Math.max(0, this.selectedStageIndex - 1);
                console.log(`🔼 Stage index: ${this.selectedStageIndex} (${this.stages[this.selectedStageIndex]?.name})`);
                break;
                
            case 'ArrowDown':
            case 'ArrowRight':
                e.preventDefault();
                this.selectedStageIndex = Math.min(this.stages.length - 1, this.selectedStageIndex + 1);
                console.log(`🔽 Stage index: ${this.selectedStageIndex} (${this.stages[this.selectedStageIndex]?.name})`);
                break;
                
            case ' ':
            case 'Enter':
                e.preventDefault();
                const selectedStage = this.stages[this.selectedStageIndex];
                if (selectedStage) {
                    this.startStage(selectedStage.id);
                }
                break;
                
            case 'e':
            case 'E':
                e.preventDefault();
                window.open('/editor.html', '_blank');
                break;
        }
    }
    
    private startRenderLoop(): void {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        
        const render = () => {
            if (this.isActive) {
                this.render();
                this.animationId = requestAnimationFrame(render);
            }
        };
        
        this.animationId = requestAnimationFrame(render);
    }
    
    private render(): void {
        // Clear canvas
        this.ctx.fillStyle = 'black';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Set drawing style
        this.ctx.font = '32px monospace';
        this.ctx.textAlign = 'center';
        this.ctx.fillStyle = 'white';
        
        // Title
        this.ctx.fillText('JUMPING DOT GAME', this.canvas.width / 2, 100);
        
        // Subtitle
        this.ctx.font = '16px monospace';
        this.ctx.fillText('SELECT STAGE', this.canvas.width / 2, 140);
        
        // Render stage list
        const startY = 200;
        const itemHeight = 60;
        
        this.stages.forEach((stage, index) => {
            const y = startY + index * itemHeight;
            const isSelected = index === this.selectedStageIndex;
            
            // Selection indicator
            if (isSelected) {
                this.ctx.fillStyle = 'white';
                this.ctx.fillRect(150, y - 20, this.canvas.width - 300, 40);
                this.ctx.fillStyle = 'black';
            } else {
                this.ctx.fillStyle = 'white';
            }
            
            // Stage name
            this.ctx.font = '24px monospace';
            this.ctx.fillText(stage.name, this.canvas.width / 2, y);
            
            // Stage description
            this.ctx.font = '14px monospace';
            this.ctx.fillText(stage.description, this.canvas.width / 2, y + 20);
        });
        
        // Instructions
        this.ctx.fillStyle = '#aaa';
        this.ctx.font = '14px monospace';
        this.ctx.fillText('↑↓ Navigate  SPACE Select  E Editor', this.canvas.width / 2, this.canvas.height - 50);
    }
    
    private async startStage(stageId: number): Promise<void> {
        this.isActive = false;
        
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        
        // Show game UI elements
        const gameUI = document.getElementById('gameUI') as HTMLElement;
        const info = document.querySelector('.info') as HTMLElement;
        const controls = document.querySelector('.controls') as HTMLElement;
        
        if (gameUI) gameUI.style.display = 'block';
        if (info) info.style.display = 'block';
        if (controls) controls.style.display = 'block';
        
        try {
            // Create new game instance
            this.gameInstance = new JumpingDotGame();
            await this.gameInstance.initWithStage(stageId);
        } catch (error) {
            console.error(`❌ Failed to start stage ${stageId}:`, error);
        }
    }
    
    public async returnToStageSelect(): Promise<void> {
        // Cleanup game
        if (this.gameInstance) {
            await this.gameInstance.cleanup();
            this.gameInstance = null;
        }
        
        this.showStageSelect();
    }
    
}

// Global stage select instance
let stageSelect: StageSelect | null = null;

// Initialize stage select when page loads
window.addEventListener('load', async () => {
    stageSelect = new StageSelect();
    await stageSelect.init();
    
    // Export for global access
    (window as any).stageSelect = stageSelect;
});