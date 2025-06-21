import { describe, it, expect, beforeEach } from 'vitest';
import { MovingPlatformSystem } from '../systems/MovingPlatformSystem';
import type { MovingPlatform } from '../core/StageLoader';

describe('MovingPlatformSystem', () => {
    let movingPlatformSystem: MovingPlatformSystem;
    let mockMovingPlatforms: MovingPlatform[];

    beforeEach(() => {
        movingPlatformSystem = new MovingPlatformSystem();
        
        mockMovingPlatforms = [
            {
                x1: 350, y1: 450, x2: 450, y2: 450,
                startX: 350, endX: 450, speed: 1, direction: 1
            },
            {
                x1: 800, y1: 430, x2: 900, y2: 430,
                startX: 750, endX: 850, speed: 1.5, direction: -1
            }
        ];
    });

    describe('update', () => {
        it('should return a new array of updated platforms', () => {
            const deltaTime = 16.67;
            const updatedPlatforms = movingPlatformSystem.update(mockMovingPlatforms, deltaTime);

            // 新しい配列を返すことを確認
            expect(updatedPlatforms).not.toBe(mockMovingPlatforms);
            expect(updatedPlatforms.length).toBe(mockMovingPlatforms.length);
        });

        it('should not mutate the original platforms array', () => {
            const originalPlatforms = JSON.parse(JSON.stringify(mockMovingPlatforms));
            const deltaTime = 16.67;

            movingPlatformSystem.update(mockMovingPlatforms, deltaTime);

            // 元の配列が変更されていないことを確認
            expect(mockMovingPlatforms).toEqual(originalPlatforms);
        });
        
        it('should move platforms according to speed and direction', () => {
            const deltaTime = 16.67;
            const initialX1_platform1 = mockMovingPlatforms[0].x1;
            
            const updatedPlatforms = movingPlatformSystem.update(mockMovingPlatforms, deltaTime);
            
            // Platform 1 moves right (direction: 1)
            const expectedMovement1 = mockMovingPlatforms[0].speed * mockMovingPlatforms[0].direction * (deltaTime / 16.67);
            expect(updatedPlatforms[0].x1).toBeCloseTo(initialX1_platform1 + expectedMovement1, 2);
        });

        it('should reverse direction when platform reaches endX', () => {
            const deltaTime = 16.67;
            // Set platform close to endX
            mockMovingPlatforms[0].x1 = 449.5;
            mockMovingPlatforms[0].x2 = 549.5;
            mockMovingPlatforms[0].direction = 1;
            
            const updatedPlatforms = movingPlatformSystem.update(mockMovingPlatforms, deltaTime);
            
            // Direction should be reversed in the new object
            expect(updatedPlatforms[0].direction).toBe(-1);
            // Original object should not be changed
            expect(mockMovingPlatforms[0].direction).toBe(1);
        });

        it('should reverse direction when platform reaches startX', () => {
            const deltaTime = 16.67;
            // Set platform close to startX
            mockMovingPlatforms[0].x1 = 350.5;
            mockMovingPlatforms[0].x2 = 450.5;
            mockMovingPlatforms[0].direction = -1;
            
            const updatedPlatforms = movingPlatformSystem.update(mockMovingPlatforms, deltaTime);
            
            // Direction should be reversed in the new object
            expect(updatedPlatforms[0].direction).toBe(1);
        });

        it('should maintain platform width during movement', () => {
            const deltaTime = 16.67;
            const originalWidth1 = mockMovingPlatforms[0].x2 - mockMovingPlatforms[0].x1;
            
            const updatedPlatforms = movingPlatformSystem.update(mockMovingPlatforms, deltaTime);
            
            const newWidth1 = updatedPlatforms[0].x2 - updatedPlatforms[0].x1;
            
            expect(newWidth1).toBeCloseTo(originalWidth1, 5);
        });
    });
});