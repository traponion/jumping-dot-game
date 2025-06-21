import { describe, it, expect, beforeEach } from 'vitest';
import { MovingPlatformSystem } from '../systems/MovingPlatformSystem';
import { MovingPlatform } from '../core/StageLoader';

describe('MovingPlatformSystem', () => {
    let movingPlatformSystem: MovingPlatformSystem;
    let mockMovingPlatforms: MovingPlatform[];

    beforeEach(() => {
        movingPlatformSystem = new MovingPlatformSystem();
        
        // Create test moving platforms based on stage2.json structure
        mockMovingPlatforms = [
            {
                x1: 350, y1: 450, x2: 450, y2: 450,
                startX: 350, endX: 450, speed: 1, direction: 1
            },
            {
                x1: 750, y1: 430, x2: 850, y2: 430,
                startX: 750, endX: 850, speed: 1.5, direction: -1
            }
        ];
    });

    describe('update', () => {
        it('should move platforms according to speed and direction', () => {
            const deltaTime = 16.67; // ~60fps
            const initialX1_platform1 = mockMovingPlatforms[0].x1;
            const initialX2_platform1 = mockMovingPlatforms[0].x2;
            
            movingPlatformSystem.update(mockMovingPlatforms, deltaTime);
            
            // Platform 1 moves right (direction: 1)
            const expectedMovement1 = mockMovingPlatforms[0].speed * mockMovingPlatforms[0].direction * (deltaTime / 16.67);
            expect(mockMovingPlatforms[0].x1).toBeCloseTo(initialX1_platform1 + expectedMovement1, 2);
            expect(mockMovingPlatforms[0].x2).toBeCloseTo(initialX2_platform1 + expectedMovement1, 2);
        });

        it('should reverse direction when platform reaches endX', () => {
            const deltaTime = 16.67;
            // Set platform close to endX
            mockMovingPlatforms[0].x1 = 449;
            mockMovingPlatforms[0].x2 = 549;
            mockMovingPlatforms[0].direction = 1;
            
            movingPlatformSystem.update(mockMovingPlatforms, deltaTime);
            
            // Direction should be reversed
            expect(mockMovingPlatforms[0].direction).toBe(-1);
        });

        it('should reverse direction when platform reaches startX', () => {
            const deltaTime = 16.67;
            // Set platform close to startX
            mockMovingPlatforms[0].x1 = 351;
            mockMovingPlatforms[0].x2 = 451;
            mockMovingPlatforms[0].direction = -1;
            
            movingPlatformSystem.update(mockMovingPlatforms, deltaTime);
            
            // Direction should be reversed
            expect(mockMovingPlatforms[0].direction).toBe(1);
        });

        it('should handle multiple platforms with different speeds and directions', () => {
            const deltaTime = 16.67;
            const initialX1_platform1 = mockMovingPlatforms[0].x1;
            const initialX1_platform2 = mockMovingPlatforms[1].x1;
            
            movingPlatformSystem.update(mockMovingPlatforms, deltaTime);
            
            // Platform 1 moves right (direction: 1, speed: 1)
            const expectedMovement1 = 1 * 1 * (deltaTime / 16.67);
            expect(mockMovingPlatforms[0].x1).toBeCloseTo(initialX1_platform1 + expectedMovement1, 2);
            
            // Platform 2 moves left (direction: -1, speed: 1.5)
            const expectedMovement2 = 1.5 * -1 * (deltaTime / 16.67);
            expect(mockMovingPlatforms[1].x1).toBeCloseTo(initialX1_platform2 + expectedMovement2, 2);
        });

        it('should maintain platform width during movement', () => {
            const deltaTime = 16.67;
            const originalWidth1 = mockMovingPlatforms[0].x2 - mockMovingPlatforms[0].x1;
            const originalWidth2 = mockMovingPlatforms[1].x2 - mockMovingPlatforms[1].x1;
            
            movingPlatformSystem.update(mockMovingPlatforms, deltaTime);
            
            const newWidth1 = mockMovingPlatforms[0].x2 - mockMovingPlatforms[0].x1;
            const newWidth2 = mockMovingPlatforms[1].x2 - mockMovingPlatforms[1].x1;
            
            expect(newWidth1).toBe(originalWidth1);
            expect(newWidth2).toBe(originalWidth2);
        });
    });
});