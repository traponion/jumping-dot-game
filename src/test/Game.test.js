import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { JumpingDotGame } from '../core/Game.js';

// Mock DOM elements
const mockCanvas = {
  getContext: () => ({
    fillRect: vi.fn(),
    clearRect: vi.fn(),
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 1,
    font: '',
    textAlign: '',
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    translate: vi.fn(),
    fillText: vi.fn(),
    strokeRect: vi.fn(),
    ellipse: vi.fn(),
    closePath: vi.fn()
  }),
  width: 800,
  height: 600
};

const mockElement = { textContent: '' };

describe('JumpingDotGame', () => {
  let game;

  beforeEach(async () => {
    // Mock DOM elements
    global.document = {
      getElementById: vi.fn((id) => {
        if (id === 'gameCanvas') return mockCanvas;
        return mockElement;
      }),
      addEventListener: vi.fn()
    };

    global.window = {
      addEventListener: vi.fn()
    };

    // Mock fetch for stage loading
    global.fetch = vi.fn().mockRejectedValue(new Error('No JSON file'));

    game = new JumpingDotGame();
    // Wait for async initialization to complete
    await new Promise(resolve => setTimeout(resolve, 10));
  });

  afterEach(() => {
    // Clean up game instance to prevent requestAnimationFrame leaks
    if (game && game.cleanup) {
      game.cleanup();
    }
  });

  describe('initialization', () => {
    it('should create a game instance', () => {
      expect(game).toBeDefined();
    });

    it('should initialize player at correct position', () => {
      expect(game.player.x).toBe(100);
      expect(game.player.y).toBe(400);
      expect(game.player.radius).toBe(3);
    });

    it('should initialize physics constants', () => {
      expect(game.gravity).toBe(0.6);
      expect(game.jumpForce).toBe(-12);
      expect(game.moveSpeed).toBe(4);
      expect(game.autoJumpInterval).toBe(300);
    });

    it('should initialize timer system', () => {
      expect(game.timeLimit).toBe(10);
      expect(game.timeRemaining).toBe(10);
      expect(game.finalScore).toBe(0);
    });

    it('should start with game not running', () => {
      expect(game.gameRunning).toBe(false);
      expect(game.gameOver).toBe(false);
    });
  });

  describe('stage loading', () => {
    it('should load stage with platforms', () => {
      expect(game.stage).toBeDefined();
      expect(game.stage.platforms).toBeDefined();
      expect(game.stage.platforms.length).toBeGreaterThan(0);
    });

    it('should load stage with spikes', () => {
      expect(game.stage.spikes).toBeDefined();
      expect(game.stage.spikes.length).toBeGreaterThan(0);
    });

    it('should load stage with goal', () => {
      expect(game.stage.goal).toBeDefined();
      expect(game.stage.goal.x).toBe(2400);
      expect(game.stage.goal.y).toBe(390);
    });

    it('should load stage with text elements', () => {
      expect(game.stage.startText).toBeDefined();
      expect(game.stage.goalText).toBeDefined();
      expect(game.stage.leftEdgeMessage).toBeDefined();
    });

    it('should use StageLoader for loading stages', () => {
      expect(game.stageLoader).toBeDefined();
      expect(game.stage.id).toBe(1); // Should load stage 1 by default
    });
  });

  describe('game state management', () => {
    it('should start game correctly', () => {
      game.startGame();
      expect(game.gameRunning).toBe(true);
      expect(game.gameStartTime).toBeDefined();
    });

    it('should reset game state on init', async () => {
      game.player.x = 500;
      game.gameRunning = true;
      game.hasMovedOnce = true;
      
      await game.init();
      
      expect(game.player.x).toBe(100);
      expect(game.gameRunning).toBe(false);
      expect(game.hasMovedOnce).toBe(false);
    });
  });

  describe('physics and movement', () => {
    beforeEach(() => {
      game.startGame();
    });

    it('should handle left input', () => {
      game.keys = { ArrowLeft: true };
      const initialVx = game.player.vx;
      
      game.update(16.67);
      
      expect(game.player.vx).toBeLessThan(initialVx);
      expect(game.hasMovedOnce).toBe(true);
    });

    it('should handle right input', () => {
      game.keys = { ArrowRight: true };
      const initialVx = game.player.vx;
      
      game.update(16.67);
      
      expect(game.player.vx).toBeGreaterThan(initialVx);
      expect(game.hasMovedOnce).toBe(true);
    });

    it('should enforce minimum movement after first input', () => {
      game.hasMovedOnce = true;
      game.player.vx = 0.1;
      
      game.update(16.67);
      
      expect(Math.abs(game.player.vx)).toBeGreaterThanOrEqual(0.2);
    });

    it('should apply gravity when not grounded', () => {
      game.player.grounded = false;
      const initialVy = game.player.vy;
      
      game.update(16.67);
      
      expect(game.player.vy).toBeGreaterThan(initialVy);
    });

    it('should clamp horizontal speed', () => {
      game.player.vx = 10;
      
      game.update(16.67);
      
      expect(game.player.vx).toBeLessThanOrEqual(game.moveSpeed);
    });
  });

  describe('timer system', () => {
    beforeEach(() => {
      // Set up consistent time mocking
      const baseTime = 10000;
      vi.spyOn(performance, 'now')
        .mockReturnValueOnce(baseTime) // startGame call
        .mockReturnValueOnce(baseTime + 1000); // update call
      
      game.startGame();
    });

    it('should decrease time remaining during gameplay', () => {
      const initialTime = game.timeRemaining;
      
      game.update(16.67);
      
      expect(game.timeRemaining).toBeLessThan(initialTime);
    });

    it('should end game when time runs out', () => {
      // Set time to exceed limit
      vi.spyOn(performance, 'now').mockReturnValue(70000); // 70 seconds
      
      game.update(16.67);
      
      expect(game.gameOver).toBe(true);
      expect(game.finalScore).toBe(0);
    });
  });

  describe('collision detection', () => {
    it('should detect goal collision', () => {
      game.player.x = 2420;
      game.player.y = 415;
      game.timeRemaining = 30;
      
      game.checkGoalCollision();
      
      expect(game.gameOver).toBe(true);
      expect(game.finalScore).toBe(30);
    });

    it('should detect spike collision', () => {
      // Position player on first spike
      const firstSpike = game.stage.spikes[0];
      game.player.x = firstSpike.x + firstSpike.width / 2;
      game.player.y = firstSpike.y + firstSpike.height / 2;
      
      game.checkSpikeCollisions();
      
      expect(game.gameOver).toBe(true);
    });
  });

  describe('clear animation', () => {
    it('should start clear animation on goal reach', () => {
      game.player.x = 2420;
      game.player.y = 415;
      
      game.checkGoalCollision();
      
      expect(game.clearAnimation.active).toBe(true);
      expect(game.clearAnimation.particles.length).toBe(20);
    });

    it('should update animation particles', () => {
      game.startClearAnimation();
      const initialParticleCount = game.clearAnimation.particles.length;
      
      // Simulate time passing to decay particles
      game.clearAnimation.particles.forEach(p => p.life = 0);
      game.updateClearAnimation();
      
      expect(game.clearAnimation.particles.length).toBeLessThan(initialParticleCount);
    });
  });

  describe('mobile features removal', () => {
    it('should not have tilt control functionality', () => {
      expect(game.tiltControlEnabled).toBeUndefined();
      expect(game.toggleTiltControl).toBeUndefined();
      expect(game.handleDeviceOrientation).toBeUndefined();
    });

    it('should not have mobile setup methods', () => {
      expect(game.setupMobileControls).toBeUndefined();
      expect(game.setupDeviceOrientation).toBeUndefined();
    });

    it('should not try to access mobile UI elements', () => {
      // Test that game doesn't crash when mobile elements don't exist
      expect(() => game.init()).not.toThrow();
    });

    it('should only handle keyboard input', () => {
      // After mobile removal, only keyboard events should be supported
      game.keys = { ArrowLeft: true };
      expect(() => game.update(16.67)).not.toThrow();
      
      game.keys = { ArrowRight: true };
      expect(() => game.update(16.67)).not.toThrow();
    });
  });
});