import { StageLoader, StageData, Platform, Spike } from './StageLoader.js';

// Type definitions for game components
interface Player {
    x: number;
    y: number;
    vx: number;
    vy: number;
    radius: number;
    grounded: boolean;
}

interface Camera {
    x: number;
    y: number;
}

interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    decay: number;
    size?: number;
}

interface AnimationSystem {
    active: boolean;
    startTime: number | null;
    duration: number;
    particles: Particle[];
}

interface DeathMark {
    x: number;
    y: number;
    timestamp: number;
}

interface TrailPoint {
    x: number;
    y: number;
}

interface KeyState {
    [key: string]: boolean;
}

export class JumpingDotGame {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    public gameStatus: HTMLElement;
    private timerDisplay: HTMLElement;
    private scoreDisplay: HTMLElement;
    
    // Game state
    public gameRunning: boolean = false;
    public gameOver: boolean = false;
    private currentStage: number = 1;
    
    // Factor to control overall game speed (2.0 for 120Hz feel)
    public gameSpeed: number = 2.0;

    // Player (jumping dot)
    public player: Player;
    
    // Movement state tracking
    public hasMovedOnce: boolean = false;
    
    // Timer and score system
    public timeLimit: number = 10; // 10 seconds - extremely challenging!
    public timeRemaining: number;
    public gameStartTime: number | null = null;
    public finalScore: number = 0;
    
    // Clear animation system
    public clearAnimation: AnimationSystem;
    
    // Death animation system
    private deathAnimation: AnimationSystem;
    
    // Death marks (persist until page reload)
    private deathMarks: DeathMark[] = [];
    
    // Trail effect for smooth animation
    private trail: TrailPoint[] = [];
    private maxTrailLength: number = 8;
    
    // Physics constants
    public gravity: number = 0.6;
    public jumpForce: number = -12;
    public autoJumpInterval: number = 150; // milliseconds - Adjusted for faster game speed
    private lastJumpTime: number | null = null;
    public moveSpeed: number = 4;
    
    // Camera
    private camera: Camera;
    
    // Stage loader
    public stageLoader: StageLoader;
    
    // Stage elements
    public stage: StageData | null = null; // Will be loaded asynchronously
    
    // Input handling
    public keys: KeyState = {};
    
    // Game loop
    private lastTime: number | null = null;
    private animationId: number | null = null;

    constructor() {
        this.canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
        this.ctx = this.canvas.getContext('2d')!;
        this.gameStatus = document.getElementById('gameStatus')!;
        this.timerDisplay = document.getElementById('timer')!;
        this.scoreDisplay = document.getElementById('score')!;
        
        // Player (jumping dot)
        this.player = {
            x: 100,
            y: 400,
            vx: 0,
            vy: 0,
            radius: 3,
            grounded: false
        };
        
        // Timer and score system
        this.timeRemaining = this.timeLimit;
        
        // Clear animation system
        this.clearAnimation = {
            active: false,
            startTime: null,
            duration: 3000, // 3 seconds
            particles: []
        };
        
        // Death animation system
        this.deathAnimation = {
            active: false,
            startTime: null,
            duration: 2000, // 2 seconds
            particles: []
        };
        
        // Camera
        this.camera = {
            x: 0,
            y: 0
        };
        
        // Stage loader
        this.stageLoader = new StageLoader();
        
        this.setupInput();
        this.init();
    }
    
    async init(): Promise<void> {
        this.gameStatus.textContent = 'Loading stage...';
        
        // Load initial stage
        await this.loadStage(this.currentStage);
        
        this.gameStatus.textContent = 'Press SPACE to start';
        this.gameRunning = false;
        this.gameOver = false;
        
        // Reset player position
        this.player.x = 100;
        this.player.y = 400;
        this.player.vx = 0;
        this.player.vy = 0;
        this.player.grounded = false;
        
        // Reset movement tracking
        this.hasMovedOnce = false;
        
        // Reset timer
        this.timeRemaining = this.timeLimit;
        this.gameStartTime = null;
        this.finalScore = 0;
        
        // Reset clear animation
        this.clearAnimation.active = false;
        this.clearAnimation.startTime = null;
        this.clearAnimation.particles = [];
        
        // Reset death animation
        this.deathAnimation.active = false;
        this.deathAnimation.startTime = null;
        this.deathAnimation.particles = [];
        
        // Note: deathMarks are NOT reset - they persist until page reload
        
        // Update UI
        this.timerDisplay.textContent = `Time: ${this.timeLimit}`;
        this.scoreDisplay.textContent = 'Score: 0';
        
        // Reset camera
        this.camera.x = 0;
        this.camera.y = 0;
        
        // Reset trail
        this.trail = [];
        
        // Reset physics constants to ensure consistency
        this.gravity = 0.6;
        this.jumpForce = -12;
        this.autoJumpInterval = 150;
        this.moveSpeed = 4;
        
        // Reset timing variables to null for proper initialization
        this.lastJumpTime = null;
        this.lastTime = null;
        
        // Clear all key states to prevent momentum carryover
        this.keys = {};
        
        // Stop any existing game loop before starting new one
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        
        this.animationId = requestAnimationFrame((time) => this.gameLoop(time));
    }

    // Cleanup method for testing
    cleanup(): void {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        this.gameRunning = false;
        this.gameOver = true;
    }
    
    private async loadStage(stageNumber: number): Promise<void> {
        try {
            this.stage = await this.stageLoader.loadStageWithFallback(stageNumber);
        } catch (error) {
            console.error('Failed to load stage:', error);
            // Fallback to hardcoded stage 1
            this.stage = this.stageLoader.getHardcodedStage(1);
        }
    }
    
    private setupInput(): void {
        document.addEventListener('keydown', (e) => {
            // Only process arrow key inputs if game is running and not over
            if (!this.gameOver) {
                this.keys[e.code] = true;
            }
            
            if (e.code === 'Space' && !this.gameRunning && !this.gameOver) {
                this.startGame();
                e.preventDefault();
            }
            
            if (e.code === 'KeyR' && this.gameOver && !this.keys['KeyR']) {
                this.init();
                e.preventDefault();
            }
            
            // Prevent arrow key scrolling
            if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.code)) {
                e.preventDefault();
            }
        });
        
        document.addEventListener('keyup', (e) => {
            // Clear key state on keyup, but only if game is not over
            if (!this.gameOver) {
                this.keys[e.code] = false;
            }
        });
    }

    public startGame(): void {
        this.gameRunning = true;
        this.gameStatus.textContent = 'Playing';
        // Initialize lastJumpTime relative to current game time for consistency
        this.lastJumpTime = performance.now();
        this.gameStartTime = performance.now();
    }
    
    public update(deltaTime: number): void {
        if (!this.gameRunning || this.gameOver) return;

        // Calculate delta time factor for frame-rate independent physics
        const dtFactor = (deltaTime / (1000 / 60)) * this.gameSpeed;
        
        // Update timer
        if (this.gameStartTime) {
            const currentTime = performance.now();
            const elapsedSeconds = (currentTime - this.gameStartTime) / 1000;
            this.timeRemaining = Math.max(0, this.timeLimit - elapsedSeconds);
            
            // Check for time out
            if (this.timeRemaining <= 0) {
                this.handlePlayerDeath('Time Up! Press R to restart');
                return;
            }
            
            // Update timer display
            this.timerDisplay.textContent = `Time: ${Math.ceil(this.timeRemaining)}`;
        }
        
        // Handle input
        const leftInput = this.keys['ArrowLeft'];
        const rightInput = this.keys['ArrowRight'];
        
        const acceleration = 0.5;
        if (leftInput) {
            this.player.vx -= acceleration * dtFactor;
            this.hasMovedOnce = true;
        } else if (rightInput) {
            this.player.vx += acceleration * dtFactor;
            this.hasMovedOnce = true;
        }
        
        // Once movement has been initiated, ensure minimal movement continues
        if (this.hasMovedOnce && Math.abs(this.player.vx) < 0.2) {
            this.player.vx = this.player.vx >= 0 ? 0.2 : -0.2;
        }
        
        // Clamp speed
        const maxSpeed = this.moveSpeed;
        if (this.player.vx > maxSpeed) this.player.vx = maxSpeed;
        if (this.player.vx < -maxSpeed) this.player.vx = -maxSpeed;
        
        // Auto jump when grounded and enough time has passed
        const currentTime = performance.now();
        if (this.lastJumpTime === null) {
            this.lastJumpTime = currentTime - this.autoJumpInterval; // Allow immediate jump
        }
        
        if (this.player.grounded && (currentTime - this.lastJumpTime) > this.autoJumpInterval) {
            this.player.vy = this.jumpForce;
            this.player.grounded = false;
            this.lastJumpTime = currentTime;
        }
        
        // Store previous position to prevent tunneling
        const prevPlayerFootY = this.player.y + this.player.radius;

        // Apply gravity
        if (!this.player.grounded) {
            this.player.vy += this.gravity * dtFactor;
        }
        
        // Update position
        this.player.x += this.player.vx * dtFactor;
        this.player.y += this.player.vy * dtFactor;
        
        // Update trail
        this.trail.push({ x: this.player.x, y: this.player.y });
        if (this.trail.length > this.maxTrailLength) {
            this.trail.shift();
        }
        
        // Platform collision detection
        this.handlePlatformCollisions(prevPlayerFootY);
        
        // Check for spikes collision
        this.checkSpikeCollisions();
        
        // Check for holes (falling)
        this.checkHoleCollisions();
        
        // Check for goal
        this.checkGoalCollision();
        
        // Camera follows player
        this.camera.x = this.player.x - this.canvas.width / 2;
        
        // Game over if player falls too far
        if (this.player.y > this.canvas.height + 100) {
            this.handlePlayerDeath('Game Over - Press R to restart', 'fall');
        }
    }
    
    private handlePlatformCollisions(prevPlayerFootY: number): void {
        if (!this.stage) return;
        
        this.player.grounded = false;
        
        // Check regular platforms
        for (const platform of this.stage.platforms) {
            if (this.checkPlatformCollision(platform, prevPlayerFootY)) break;
        }
    }
    
    private checkPlatformCollision(platform: Platform, prevPlayerFootY: number): boolean {
        const currentPlayerFootY = this.player.y + this.player.radius;

        // Check if player passed through the platform from above
        if (this.player.x + this.player.radius > platform.x1 && 
            this.player.x - this.player.radius < platform.x2 &&
            this.player.vy >= 0 &&
            prevPlayerFootY <= platform.y1 &&
            currentPlayerFootY >= platform.y1) {
            
            // Correct player position to be on top of the platform
            this.player.y = platform.y1 - this.player.radius;
            this.player.vy = 0;
            this.player.grounded = true;
            
            // Reset jump timer for immediate maximum jump
            this.lastJumpTime = performance.now() - this.autoJumpInterval;
            return true;
        }
        return false;
    }
    
    public checkSpikeCollisions(): void {
        if (!this.stage) return;
        
        // Check regular spikes
        for (const spike of this.stage.spikes) {
            if (this.player.x + this.player.radius > spike.x &&
                this.player.x - this.player.radius < spike.x + spike.width &&
                this.player.y + this.player.radius > spike.y &&
                this.player.y - this.player.radius < spike.y + spike.height) {
                
                this.handlePlayerDeath('Hit by spike! Press R to restart');
                return;
            }
        }
    }
    
    private checkHoleCollisions(): void {
        // Check if player fell into a hole
        if (this.player.y > 600) {
            this.handlePlayerDeath('Fell into hole! Press R to restart', 'fall');
        }
    }
    
    public checkGoalCollision(): void {
        if (!this.stage) return;
        
        const goal = this.stage.goal;
        if (this.player.x + this.player.radius > goal.x &&
            this.player.x - this.player.radius < goal.x + goal.width &&
            this.player.y + this.player.radius > goal.y &&
            this.player.y - this.player.radius < goal.y + goal.height) {
            
            this.gameOver = true;
            this.finalScore = Math.ceil(this.timeRemaining);
            this.gameStatus.textContent = `Goal reached! Score: ${this.finalScore} - Press R to restart`;
            this.scoreDisplay.textContent = `Score: ${this.finalScore}`;
            
            // Start clear animation
            this.startClearAnimation();
        }
    }
    
    public startClearAnimation(): void {
        this.clearAnimation.active = true;
        this.clearAnimation.startTime = performance.now();
        this.clearAnimation.particles = [];
        
        // Create celebration particles around player
        for (let i = 0; i < 20; i++) {
            this.clearAnimation.particles.push({
                x: this.player.x + (Math.random() - 0.5) * 100,
                y: this.player.y + (Math.random() - 0.5) * 100,
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 0.5) * 8 - 2,
                life: 1.0,
                decay: 0.02 + Math.random() * 0.02
            });
        }
    }
    
    public updateClearAnimation(): void {
        if (!this.clearAnimation.active) return;
        
        const currentTime = performance.now();
        const elapsed = currentTime - this.clearAnimation.startTime!;
        
        // Update particles
        for (let i = this.clearAnimation.particles.length - 1; i >= 0; i--) {
            const particle = this.clearAnimation.particles[i];
            
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.vy += 0.1; // gravity
            particle.life -= particle.decay;
            
            if (particle.life <= 0) {
                this.clearAnimation.particles.splice(i, 1);
            }
        }
        
        // End animation after duration
        if (elapsed > this.clearAnimation.duration) {
            this.clearAnimation.active = false;
        }
    }
    
    private renderClearAnimation(): void {
        if (!this.clearAnimation.active || !this.clearAnimation.startTime) return;
        
        const currentTime = performance.now();
        const elapsed = currentTime - this.clearAnimation.startTime;
        const progress = elapsed / this.clearAnimation.duration;
        
        // Draw celebration particles
        for (const particle of this.clearAnimation.particles) {
            this.ctx.fillStyle = `rgba(255, 255, 255, ${particle.life})`;
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, 2, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        // Draw pulsing "CLEAR!" text
        if (progress < 0.8) {
            const pulse = Math.sin(elapsed * 0.01) * 0.3 + 1;
            const alpha = Math.max(0, 1 - progress / 0.8);
            
            this.ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
            this.ctx.font = `${Math.floor(32 * pulse)}px monospace`;
            this.ctx.textAlign = 'center';
            this.ctx.fillText('CLEAR!', this.player.x, this.player.y - 50);
        }
    }
    
    private handlePlayerDeath(message: string, deathType: string = 'normal'): void {
        this.gameOver = true;
        this.gameStatus.textContent = message;
        
        // Determine death mark position based on death type
        let deathMarkX = this.player.x;
        let deathMarkY = this.player.y;
        
        // For falling deaths, adjust Y position to be visible on screen
        if (deathType === 'fall') {
            // Place the X mark near the bottom edge of the visible area
            deathMarkY = this.camera.y + this.canvas.height - 20;
        }
        
        // Add death mark at adjusted position
        this.deathMarks.push({
            x: deathMarkX,
            y: deathMarkY,
            timestamp: performance.now()
        });
        
        // Start death animation
        this.startDeathAnimation();
        
        // Clear trail
        this.trail = [];
    }
    
    private startDeathAnimation(): void {
        this.deathAnimation.active = true;
        this.deathAnimation.startTime = performance.now();
        this.deathAnimation.particles = [];
        
        // Create explosion particles
        for (let i = 0; i < 15; i++) {
            const angle = (Math.PI * 2 * i) / 15;
            const speed = 3 + Math.random() * 4;
            
            this.deathAnimation.particles.push({
                x: this.player.x,
                y: this.player.y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 1,
                life: 1.0,
                decay: 0.01 + Math.random() * 0.02,
                size: 2 + Math.random() * 2
            });
        }
    }
    
    private updateDeathAnimation(): void {
        if (!this.deathAnimation.active) return;
        
        const currentTime = performance.now();
        const elapsed = currentTime - this.deathAnimation.startTime!;
        
        // Update particles
        for (let i = this.deathAnimation.particles.length - 1; i >= 0; i--) {
            const particle = this.deathAnimation.particles[i];
            
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.vy += 0.1; // gravity
            particle.life -= particle.decay;
            
            if (particle.life <= 0) {
                this.deathAnimation.particles.splice(i, 1);
            }
        }
        
        // End animation after duration
        if (elapsed > this.deathAnimation.duration) {
            this.deathAnimation.active = false;
        }
    }
    
    private renderDeathAnimation(): void {
        if (!this.deathAnimation.active) return;
        
        // Draw explosion particles
        for (const particle of this.deathAnimation.particles) {
            this.ctx.fillStyle = `rgba(255, 0, 0, ${particle.life})`;
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size || 2, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }
    
    private renderDeathMarks(): void {
        // Draw X marks at death locations
        this.ctx.strokeStyle = 'rgba(255, 0, 0, 0.8)';
        this.ctx.lineWidth = 3;
        
        for (const mark of this.deathMarks) {
            const size = 8;
            
            // Draw X
            this.ctx.beginPath();
            this.ctx.moveTo(mark.x - size, mark.y - size);
            this.ctx.lineTo(mark.x + size, mark.y + size);
            this.ctx.moveTo(mark.x + size, mark.y - size);
            this.ctx.lineTo(mark.x - size, mark.y + size);
            this.ctx.stroke();
        }
        
        // Reset line width
        this.ctx.lineWidth = 2;
    }
    
    private render(): void {
        // Clear canvas
        this.ctx.fillStyle = 'black';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Set drawing style (white lines only)
        this.ctx.strokeStyle = 'white';
        this.ctx.fillStyle = 'white';
        this.ctx.lineWidth = 2;
        
        // Save context for camera transform
        this.ctx.save();
        this.ctx.translate(-this.camera.x, -this.camera.y);
        
        // Draw stage elements
        this.drawStage();
        this.drawGoalAndTexts();
        
        // Draw death marks (always visible)
        this.renderDeathMarks();
        
        // Only draw trail and player if game is running (not over)
        if (this.gameRunning && !this.gameOver) {
            // Draw trail effect
            this.drawTrail();
            
            // Draw player (jumping dot)
            this.ctx.fillStyle = 'white';
            this.ctx.beginPath();
            this.ctx.arc(this.player.x, this.player.y, this.player.radius, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        // Draw death animation (when player dies)
        this.renderDeathAnimation();
        
        // Draw clear animation (affects by camera)
        this.renderClearAnimation();
        
        // Restore context
        this.ctx.restore();
        
        // Draw UI elements (not affected by camera)
        if (!this.gameRunning && !this.gameOver) {
            this.ctx.fillStyle = 'white';
            this.ctx.font = '24px monospace';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('Press SPACE to Start', this.canvas.width / 2, this.canvas.height / 2);
        }
        
        // Draw game over message
        if (this.gameOver) {
            this.ctx.fillStyle = 'white';
            this.ctx.font = '24px monospace';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('Game Over - Press R to restart', this.canvas.width / 2, this.canvas.height / 2);
        }
        
        // Draw credits at bottom center
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        this.ctx.font = '12px monospace';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Made by traponion', this.canvas.width / 2, this.canvas.height - 30);
        this.ctx.fillText('github.com/traponion/jumping-dot-game', this.canvas.width / 2, this.canvas.height - 15);
    }
    
    private gameLoop(currentTime: number): void {
        // Handle first frame or reset cases
        if (this.lastTime === null) {
            this.lastTime = currentTime;
            // Skip the first frame to avoid huge deltaTime
            requestAnimationFrame((time) => this.gameLoop(time));
            return;
        }
        
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        // Prevent huge delta times (e.g. from tab switching or reload)
        const clampedDelta = Math.min(deltaTime, 16.67 * 2); // Allow up to 30fps equivalent to handle lag spikes with high gameSpeed
        
        this.update(clampedDelta);
        this.updateClearAnimation();
        this.updateDeathAnimation();
        this.render();
        
        this.animationId = requestAnimationFrame((time) => this.gameLoop(time));
    }
    
    private drawStage(): void {
        if (!this.stage) return;
        
        // Draw regular platforms
        this.ctx.strokeStyle = 'white';
        this.ctx.lineWidth = 2;
        
        for (const platform of this.stage.platforms) {
            this.ctx.beginPath();
            this.ctx.moveTo(platform.x1, platform.y1);
            this.ctx.lineTo(platform.x2, platform.y2);
            this.ctx.stroke();
        }
        
        // Draw spikes (triangular shapes)
        this.ctx.fillStyle = 'white';
        for (const spike of this.stage.spikes) {
            this.drawSpike(spike);
        }
    }
    
    private drawSpike(spike: Spike): void {
        this.ctx.beginPath();
        this.ctx.moveTo(spike.x, spike.y + spike.height);
        this.ctx.lineTo(spike.x + spike.width / 2, spike.y);
        this.ctx.lineTo(spike.x + spike.width, spike.y + spike.height);
        this.ctx.closePath();
        this.ctx.fill();
        
        // Draw spike outline
        this.ctx.strokeStyle = 'white';
        this.ctx.lineWidth = 1;
        this.ctx.stroke();
    }
    
    private drawGoalAndTexts(): void {
        if (!this.stage) return;
        
        // Draw goal (rectangular flag)
        const goal = this.stage.goal;
        this.ctx.strokeStyle = 'white';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(goal.x, goal.y, goal.width, goal.height);
        
        // Draw flag pattern (diagonal lines)
        this.ctx.beginPath();
        this.ctx.moveTo(goal.x, goal.y);
        this.ctx.lineTo(goal.x + goal.width, goal.y + goal.height);
        this.ctx.moveTo(goal.x + goal.width, goal.y);
        this.ctx.lineTo(goal.x, goal.y + goal.height);
        this.ctx.stroke();
        
        // Draw start text
        const startText = this.stage.startText;
        this.ctx.fillStyle = 'white';
        this.ctx.font = '16px monospace';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(startText.text, startText.x, startText.y);
        
        // Draw goal text
        const goalText = this.stage.goalText;
        this.ctx.fillStyle = 'white';
        this.ctx.font = '16px monospace';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(goalText.text, goalText.x, goalText.y);
        
        // Draw left edge sarcastic message
        if (this.stage.leftEdgeMessage) {
            const leftMsg = this.stage.leftEdgeMessage;
            this.ctx.fillStyle = 'white';
            this.ctx.font = '14px monospace';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(leftMsg.text, leftMsg.x, leftMsg.y);
        }
        
        // Draw left edge sub message
        if (this.stage.leftEdgeSubMessage) {
            const leftSubMsg = this.stage.leftEdgeSubMessage;
            this.ctx.fillStyle = 'white';
            this.ctx.font = '12px monospace';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(leftSubMsg.text, leftSubMsg.x, leftSubMsg.y);
        }
    }
    
    private drawTrail(): void {
        // Draw trail with fading effect
        for (let i = 0; i < this.trail.length; i++) {
            const point = this.trail[i];
            const alpha = (i + 1) / this.trail.length; // Fade from 0 to 1
            const radius = this.player.radius * alpha * 0.8; // Smaller trailing dots
            
            this.ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.6})`;
            this.ctx.beginPath();
            this.ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }
}