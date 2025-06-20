import { describe, it, expect, beforeEach, vi } from 'vitest';
import { HUDRenderer } from '../systems/renderers/HUDRenderer';
import type { HUDData } from '../systems/renderers/HUDRenderer';

// Simplified fabric.js mock
vi.mock('fabric', () => {
    const createMockObject = (type: string, text?: string, options = {}) => {
        return {
            type,
            text: text || '',
            fill: '#ffffff',
            left: 0,
            top: 0,
            fontSize: 18,
            fontFamily: 'Arial, sans-serif',
            selectable: false,
            evented: false,
            originX: 'left',
            originY: 'top',
            data: {},
            // Make set method that updates properties
            set: vi.fn(function(this: any, props: any) {
                Object.assign(this, props);
            }),
            ...options
        };
    };

    const MockText = vi.fn().mockImplementation((text, options = {}) => {
        return createMockObject('text', text, options);
    });

    const MockRect = vi.fn().mockImplementation((options = {}) => {
        return createMockObject('rect', '', options);
    });

    return {
        Text: MockText,
        Rect: MockRect
    };
});

describe('HUDRenderer', () => {
    let hudRenderer: HUDRenderer;
    let mockCanvas: any;

    beforeEach(() => {
        // Clear all mocks before each test
        vi.clearAllMocks();
        
        mockCanvas = {
            add: vi.fn(),
            remove: vi.fn(),
        };
        
        hudRenderer = new HUDRenderer(mockCanvas);
    });

    describe('constructor', () => {
        it('should initialize with canvas', () => {
            expect(hudRenderer).toBeDefined();
            expect(hudRenderer['canvas']).toBe(mockCanvas);
            expect(hudRenderer['hudElements']).toEqual(new Map());
        });
    });

    describe('renderHUD', () => {
        it('should render complete HUD with all data', () => {
            const hudData: HUDData = {
                score: 1000,
                time: 120,
                lives: 3,
                level: 2
            };

            hudRenderer.renderHUD(hudData);

            // Should add 4 elements to canvas (score, time, lives, level)
            expect(mockCanvas.add).toHaveBeenCalledTimes(4);
            
            // Verify internal elements map is populated
            expect(hudRenderer['hudElements'].size).toBe(4);
            expect(hudRenderer['hudElements'].has('score')).toBe(true);
            expect(hudRenderer['hudElements'].has('time')).toBe(true);
            expect(hudRenderer['hudElements'].has('lives')).toBe(true);
            expect(hudRenderer['hudElements'].has('level')).toBe(true);
        });

        it('should render HUD with optional data missing', () => {
            const hudData: HUDData = {
                score: 500,
                time: 60
            };

            hudRenderer.renderHUD(hudData);

            // Should add 2 elements to canvas (score, time only)
            expect(mockCanvas.add).toHaveBeenCalledTimes(2);
            expect(hudRenderer['hudElements'].size).toBe(2);
        });

        it('should update existing elements on subsequent calls', () => {
            const hudData1: HUDData = { score: 100, time: 180 };
            const hudData2: HUDData = { score: 200, time: 160 };

            hudRenderer.renderHUD(hudData1);
            hudRenderer.renderHUD(hudData2);

            // First call adds elements, second call updates them
            expect(mockCanvas.add).toHaveBeenCalledTimes(2);
            
            const scoreElement = hudRenderer['hudElements'].get('score');
            const timeElement = hudRenderer['hudElements'].get('time');
            
            // Check that set method was called to update text
            expect(scoreElement.set).toHaveBeenCalledWith({ text: 'Score: 200' });
            expect(timeElement.set).toHaveBeenCalledWith({ text: 'Time: 2:40' });
        });
    });

    describe('updateScoreDisplay', () => {
        it('should create new score element with correct properties', () => {
            hudRenderer['updateScoreDisplay'](1500);

            expect(mockCanvas.add).toHaveBeenCalledTimes(1);
            
            const scoreElement = hudRenderer['hudElements'].get('score');
            expect(scoreElement).toBeDefined();
            expect(scoreElement.text).toBe('Score: 1500');
        });

        it('should update existing score element', () => {
            // First call creates element
            hudRenderer['updateScoreDisplay'](1000);
            const scoreElement = hudRenderer['hudElements'].get('score');
            
            // Second call updates it
            hudRenderer['updateScoreDisplay'](2000);

            expect(mockCanvas.add).toHaveBeenCalledTimes(1);
            expect(scoreElement.set).toHaveBeenCalledWith({ text: 'Score: 2000' });
        });
    });

    describe('updateTimeDisplay', () => {
        it('should create time display with minutes and seconds', () => {
            hudRenderer['updateTimeDisplay'](125);

            const timeElement = hudRenderer['hudElements'].get('time');
            expect(timeElement.text).toBe('Time: 2:05');
            expect(timeElement.fill).toBe('#ffffff');
        });

        it('should display warning color when time is low', () => {
            hudRenderer['updateTimeDisplay'](25);

            const timeElement = hudRenderer['hudElements'].get('time');
            expect(timeElement.text).toBe('Time: 0:25');
            expect(timeElement.fill).toBe('#ff4444');
        });

        it('should update existing time element with warning color', () => {
            // Create with normal time
            hudRenderer['updateTimeDisplay'](60);
            const timeElement = hudRenderer['hudElements'].get('time');
            
            // Update with low time
            hudRenderer['updateTimeDisplay'](20);

            expect(timeElement.set).toHaveBeenCalledWith({ text: 'Time: 0:20' });
            expect(timeElement.set).toHaveBeenCalledWith({ fill: '#ff4444' });
        });

        it('should reset color when time is no longer low', () => {
            // Create with low time
            hudRenderer['updateTimeDisplay'](20);
            const timeElement = hudRenderer['hudElements'].get('time');
            
            // Update with normal time
            hudRenderer['updateTimeDisplay'](45);

            expect(timeElement.set).toHaveBeenCalledWith({ fill: '#ffffff' });
        });

        it('should format time correctly for edge cases', () => {
            hudRenderer['updateTimeDisplay'](0);
            let timeElement = hudRenderer['hudElements'].get('time');
            expect(timeElement.text).toBe('Time: 0:00');

            hudRenderer['updateTimeDisplay'](59);
            expect(timeElement.set).toHaveBeenCalledWith({ text: 'Time: 0:59' });

            hudRenderer['updateTimeDisplay'](3661);
            expect(timeElement.set).toHaveBeenCalledWith({ text: 'Time: 61:01' });
        });
    });

    describe('updateLivesDisplay', () => {
        it('should create lives display with normal color', () => {
            hudRenderer['updateLivesDisplay'](3);

            const livesElement = hudRenderer['hudElements'].get('lives');
            expect(livesElement.text).toBe('Lives: 3');
            expect(livesElement.fill).toBe('#ffffff');
        });

        it('should display warning color when lives are low', () => {
            hudRenderer['updateLivesDisplay'](1);

            const livesElement = hudRenderer['hudElements'].get('lives');
            expect(livesElement.text).toBe('Lives: 1');
            expect(livesElement.fill).toBe('#ff4444');
        });

        it('should update existing lives element', () => {
            // Create with normal lives
            hudRenderer['updateLivesDisplay'](3);
            const livesElement = hudRenderer['hudElements'].get('lives');
            
            // Update with low lives
            hudRenderer['updateLivesDisplay'](1);

            expect(livesElement.set).toHaveBeenCalledWith({ text: 'Lives: 1' });
            expect(livesElement.set).toHaveBeenCalledWith({ fill: '#ff4444' });
        });
    });

    describe('updateLevelDisplay', () => {
        it('should create level display', () => {
            hudRenderer['updateLevelDisplay'](5);

            const levelElement = hudRenderer['hudElements'].get('level');
            expect(levelElement.text).toBe('Level: 5');
            expect(levelElement.fill).toBe('#ffffff');
        });

        it('should update existing level element', () => {
            // First call creates element
            hudRenderer['updateLevelDisplay'](1);
            const levelElement = hudRenderer['hudElements'].get('level');
            
            // Second call updates it
            hudRenderer['updateLevelDisplay'](2);

            expect(mockCanvas.add).toHaveBeenCalledTimes(1);
            expect(levelElement.set).toHaveBeenCalledWith({ text: 'Level: 2' });
        });
    });

    describe('clearHUD', () => {
        it('should remove all HUD elements from canvas', () => {
            // Create some elements
            const hudData: HUDData = {
                score: 1000,
                time: 120,
                lives: 3,
                level: 2
            };
            hudRenderer.renderHUD(hudData);

            // Clear HUD
            hudRenderer.clearHUD();

            expect(mockCanvas.remove).toHaveBeenCalledTimes(4);
        });

        it('should clear internal elements map', () => {
            // Create some elements
            hudRenderer.renderHUD({ score: 100, time: 60 });
            
            // Verify elements are stored
            expect(hudRenderer['hudElements'].size).toBe(2);
            
            // Clear HUD
            hudRenderer.clearHUD();
            
            // Verify elements map is cleared
            expect(hudRenderer['hudElements'].size).toBe(0);
        });
    });

    describe('dispose', () => {
        it('should clear all HUD elements', () => {
            const clearHUDSpy = vi.spyOn(hudRenderer, 'clearHUD');
            
            hudRenderer.dispose();
            
            expect(clearHUDSpy).toHaveBeenCalled();
        });
    });

    describe('edge cases', () => {
        it('should handle zero values correctly', () => {
            const hudData: HUDData = {
                score: 0,
                time: 0,
                lives: 0,
                level: 0
            };

            hudRenderer.renderHUD(hudData);

            const scoreElement = hudRenderer['hudElements'].get('score');
            const timeElement = hudRenderer['hudElements'].get('time');
            const livesElement = hudRenderer['hudElements'].get('lives');
            const levelElement = hudRenderer['hudElements'].get('level');

            expect(scoreElement.text).toBe('Score: 0');
            expect(timeElement.text).toBe('Time: 0:00');
            expect(livesElement.text).toBe('Lives: 0');
            expect(levelElement.text).toBe('Level: 0');
        });

        it('should handle negative values correctly', () => {
            hudRenderer['updateScoreDisplay'](-100);
            hudRenderer['updateLivesDisplay'](-1);
            hudRenderer['updateLevelDisplay'](-1);

            const scoreElement = hudRenderer['hudElements'].get('score');
            const livesElement = hudRenderer['hudElements'].get('lives');
            const levelElement = hudRenderer['hudElements'].get('level');

            expect(scoreElement.text).toBe('Score: -100');
            expect(livesElement.text).toBe('Lives: -1');
            expect(levelElement.text).toBe('Level: -1');
        });

        it('should handle large values correctly', () => {
            hudRenderer['updateScoreDisplay'](999999);
            hudRenderer['updateTimeDisplay'](7200); // 2 hours
            hudRenderer['updateLivesDisplay'](99);
            hudRenderer['updateLevelDisplay'](999);

            const scoreElement = hudRenderer['hudElements'].get('score');
            const timeElement = hudRenderer['hudElements'].get('time');
            const livesElement = hudRenderer['hudElements'].get('lives');
            const levelElement = hudRenderer['hudElements'].get('level');

            expect(scoreElement.text).toBe('Score: 999999');
            expect(timeElement.text).toBe('Time: 120:00');
            expect(livesElement.text).toBe('Lives: 99');
            expect(levelElement.text).toBe('Level: 999');
        });
    });
});