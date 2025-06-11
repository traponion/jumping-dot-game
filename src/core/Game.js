export class JumpingDotGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.gameStatus = document.getElementById('gameStatus');
        this.timerDisplay = document.getElementById('timer');
        this.scoreDisplay = document.getElementById('score');
        
        
        // Game state
        this.gameRunning = false;
        this.gameOver = false;
        this.currentStage = 1;
        this.debugMode = false;
        
        // Player (jumping dot)
        this.player = {
            x: 100,
            y: 400,
            vx: 0,
            vy: 0,
            radius: 3,
            grounded: false
        };
        
        // Movement state tracking
        this.hasMovedOnce = false;
        
        // Timer and score system
        this.timeLimit = 10; // 10 seconds - extremely challenging!
        this.timeRemaining = this.timeLimit;
        this.gameStartTime = null;
        this.finalScore = 0;
        
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
        
        // Death marks (persist until page reload)
        this.deathMarks = [];
        
        // Trail effect for smooth animation
        this.trail = [];
        this.maxTrailLength = 8;
        
        // Physics constants
        this.gravity = 0.6;
        this.jumpForce = -12;
        this.autoJumpInterval = 300; // milliseconds - slightly longer for better rhythm
        this.lastJumpTime = null;
        this.moveSpeed = 4;
        this.friction = 0.95; // Inertia system
        
        // Camera
        this.camera = {
            x: 0,
            y: 0
        };
        
        // Stage elements
        this.stage = this.createStage(this.currentStage);
        
        // Input handling
        this.keys = {};
        this.setupInput();
        
        // Game loop
        this.lastTime = null;
        this.animationId = null;
        this.init();
    }
    
    init() {
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
        this.autoJumpInterval = 300;
        this.moveSpeed = 4;
        this.friction = 0.95;
        
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
    
    createStage(stageNumber) {
        switch (stageNumber) {
            case 1:
                return this.createStage1();
            case 2:
                return this.createStage2();
            default:
                return this.createStage1();
        }
    }
    
    createStage1() {
        return {
            platforms: [
                // Ground sections with proper clearable gaps
                { x1: -500, y1: 500, x2: 350, y2: 500 },
                { x1: 450, y1: 500, x2: 750, y2: 500 },
                { x1: 850, y1: 500, x2: 1150, y2: 500 },
                { x1: 1250, y1: 480, x2: 1550, y2: 480 },
                { x1: 1650, y1: 460, x2: 1950, y2: 460 },
                { x1: 2050, y1: 440, x2: 2350, y2: 440 },
                
                // Floating platforms for safe landing
                { x1: 375, y1: 420, x2: 425, y2: 420 },
                { x1: 775, y1: 400, x2: 825, y2: 400 },
                { x1: 1175, y1: 400, x2: 1225, y2: 400 },
                { x1: 1575, y1: 380, x2: 1625, y2: 380 },
                { x1: 1975, y1: 360, x2: 2025, y2: 360 },
            ],
            
            movingPlatforms: [], // No moving platforms in stage 1
            
            holes: [
                // Smaller, jumpable gaps
                { x1: 350, x2: 450 },
                { x1: 750, x2: 850 },
                { x1: 1150, x2: 1250 },
                { x1: 1550, x2: 1650 },
                { x1: 1950, x2: 2050 },
            ],
            
            spikes: [
                // Fewer, more strategic spikes
                { x: 500, y: 480, width: 15, height: 15 },
                { x: 900, y: 480, width: 15, height: 15 },
                { x: 1700, y: 440, width: 15, height: 15 },
            ],
            
            movingSpikes: [], // No moving spikes in stage 1
            
            goal: {
                x: 2400,
                y: 390,
                width: 40,
                height: 50
            },
            
            startText: {
                x: 50,
                y: 450,
                text: "STAGE 1"
            },
            
            goalText: {
                x: 2420,
                y: 370,
                text: "GOAL"
            },
            
            leftEdgeMessage: {
                x: -400,
                y: 450,
                text: "NOTHING HERE"
            },
            
            leftEdgeSubMessage: {
                x: -400,
                y: 470,
                text: "GO RIGHT →"
            }
        };
    }
    
    createStage2() {
        return {
            platforms: [
                // Ground sections with bigger gaps for moving platforms
                { x1: -500, y1: 500, x2: 300, y2: 500 },
                { x1: 500, y1: 500, x2: 700, y2: 500 },
                { x1: 900, y1: 500, x2: 1100, y2: 500 },
                { x1: 1300, y1: 480, x2: 1500, y2: 480 },
                { x1: 1700, y1: 460, x2: 1900, y2: 460 },
                { x1: 2100, y1: 440, x2: 2350, y2: 440 },
                
                // Some fixed floating platforms
                { x1: 1150, y1: 400, x2: 1250, y2: 400 },
                { x1: 1950, y1: 360, x2: 2050, y2: 360 },
            ],
            
            // Moving platforms (new!)
            movingPlatforms: [
                {
                    x1: 350, y1: 420, x2: 450, y2: 420,
                    startX: 350, endX: 450,
                    currentX: 350,
                    speed: 1.5,
                    direction: 1
                },
                {
                    x1: 750, y1: 400, x2: 850, y2: 400,
                    startX: 750, endX: 850,
                    currentX: 750,
                    speed: 2,
                    direction: 1
                },
                {
                    x1: 1550, y1: 380, x2: 1650, y2: 380,
                    startX: 1550, endX: 1650,
                    currentX: 1550,
                    speed: 1,
                    direction: 1
                }
            ],
            
            holes: [
                // Bigger gaps requiring moving platforms
                { x1: 300, x2: 500 },
                { x1: 700, x2: 900 },
                { x1: 1100, x2: 1300 },
                { x1: 1500, x2: 1700 },
                { x1: 1900, x2: 2100 },
            ],
            
            spikes: [
                // More spikes for increased difficulty
                { x: 550, y: 480, width: 15, height: 15 },
                { x: 800, y: 480, width: 15, height: 15 },
                { x: 1200, y: 380, width: 15, height: 15 },
                { x: 1750, y: 440, width: 15, height: 15 },
            ],
            
            movingSpikes: [], // No moving spikes yet in stage 2
            
            goal: {
                x: 2400,
                y: 390,
                width: 40,
                height: 50
            },
            
            startText: {
                x: 50,
                y: 450,
                text: "STAGE 2"
            },
            
            goalText: {
                x: 2420,
                y: 370,
                text: "GOAL"
            },
            
            leftEdgeMessage: {
                x: -400,
                y: 450,
                text: "NOTHING HERE"
            },
            
            leftEdgeSubMessage: {
                x: -400,
                y: 470,
                text: "GO RIGHT →"
            }
        };
    }
    
    
    setupInput() {
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
    
    
    
    
    
    
    startGame() {
        this.gameRunning = true;
        this.gameStatus.textContent = 'Playing';
        // Initialize lastJumpTime relative to current game time for consistency
        this.lastJumpTime = performance.now();
        this.gameStartTime = performance.now();
    }
    
    update(deltaTime) {
        if (!this.gameRunning || this.gameOver) return;
        
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
        
        // Handle input (left/right movement with no friction - unforgiving game)
        let leftInput = this.keys['ArrowLeft'];
        let rightInput = this.keys['ArrowRight'];
        
        
        if (leftInput) {
            this.player.vx -= 0.5;
            this.hasMovedOnce = true;
        } else if (rightInput) {
            this.player.vx += 0.5;
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
        // Initialize lastJumpTime if it's null (first time or after reset)
        if (this.lastJumpTime === null) {
            this.lastJumpTime = currentTime - this.autoJumpInterval; // Allow immediate jump
        }
        
        if (this.player.grounded && (currentTime - this.lastJumpTime) > this.autoJumpInterval) {
            this.player.vy = this.jumpForce;
            this.player.grounded = false;
            this.lastJumpTime = currentTime;
        }
        
        // Apply gravity
        if (!this.player.grounded) {
            this.player.vy += this.gravity;
        }
        
        // Update position
        this.player.x += this.player.vx;
        this.player.y += this.player.vy;
        
        // Update trail
        this.trail.push({ x: this.player.x, y: this.player.y });
        if (this.trail.length > this.maxTrailLength) {
            this.trail.shift();
        }
        
        // Platform collision detection
        this.handlePlatformCollisions();
        
        // Check for spikes collision
        this.checkSpikeCollisions();
        
        // Check for holes (falling)
        this.checkHoleCollisions();
        
        // Check for goal
        this.checkGoalCollision();
        
        // Camera follows player
        this.camera.x = this.player.x - this.canvas.width / 2;
        
        // Allow player to move freely to the left (no invisible wall)
        
        // Game over if player falls too far
        if (this.player.y > this.canvas.height + 100) {
            this.handlePlayerDeath('Game Over - Press R to restart', 'fall');
        }
    }
    
    handlePlatformCollisions() {
        this.player.grounded = false;
        
        // Check regular platforms
        for (const platform of this.stage.platforms) {
            if (this.checkPlatformCollision(platform)) break;
        }
    }
    
    checkPlatformCollision(platform) {
        // Check if player is above the platform and falling down
        if (this.player.x + this.player.radius > platform.x1 && 
            this.player.x - this.player.radius < platform.x2 &&
            this.player.y + this.player.radius >= platform.y1 - 5 &&
            this.player.y + this.player.radius <= platform.y1 + 10 &&
            this.player.vy >= 0) {
            
            this.player.y = platform.y1 - this.player.radius;
            this.player.vy = 0;
            this.player.grounded = true;
            
            // Reset jump timer for immediate maximum jump
            this.lastJumpTime = performance.now() - this.autoJumpInterval;
            return true;
        }
        return false;
    }
    
    checkSpikeCollisions() {
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
    
    checkHoleCollisions() {
        // Check if player fell into a hole
        if (this.player.y > 600) {
            this.handlePlayerDeath('Fell into hole! Press R to restart', 'fall');
        }
    }
    
    checkGoalCollision() {
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
    
    startClearAnimation() {
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
    
    updateClearAnimation() {
        if (!this.clearAnimation.active) return;
        
        const currentTime = performance.now();
        const elapsed = currentTime - this.clearAnimation.startTime;
        
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
    
    renderClearAnimation() {
        if (!this.clearAnimation.active) return;
        
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
    
    handlePlayerDeath(message, deathType = 'normal') {
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
    
    startDeathAnimation() {
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
    
    updateDeathAnimation() {
        if (!this.deathAnimation.active) return;
        
        const currentTime = performance.now();
        const elapsed = currentTime - this.deathAnimation.startTime;
        
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
    
    renderDeathAnimation() {
        if (!this.deathAnimation.active) return;
        
        // Draw explosion particles
        for (const particle of this.deathAnimation.particles) {
            this.ctx.fillStyle = `rgba(255, 0, 0, ${particle.life})`;
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }
    
    renderDeathMarks() {
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
    
    render() {
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
    
    gameLoop(currentTime) {
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
        const clampedDelta = Math.min(deltaTime, 16.67); // Max 60fps equivalent
        
        this.update(clampedDelta);
        this.updateClearAnimation();
        this.updateDeathAnimation();
        this.render();
        
        this.animationId = requestAnimationFrame((time) => this.gameLoop(time));
    }
    
    drawStage() {
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
    
    drawSpike(spike) {
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
    
    drawGoalAndTexts() {
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
        const leftMsg = this.stage.leftEdgeMessage;
        this.ctx.fillStyle = 'white';
        this.ctx.font = '14px monospace';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(leftMsg.text, leftMsg.x, leftMsg.y);
        
        // Draw left edge sub message
        const leftSubMsg = this.stage.leftEdgeSubMessage;
        this.ctx.fillStyle = 'white';
        this.ctx.font = '12px monospace';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(leftSubMsg.text, leftSubMsg.x, leftSubMsg.y);
    }
    
    
    drawTrail() {
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

