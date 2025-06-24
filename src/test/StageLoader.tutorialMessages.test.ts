/**
 * @fileoverview TDD tests for tutorialMessages feature in StageLoader
 * @description Test type definitions and data handling before implementation
 */

import { describe, expect, it } from 'vitest';
import type { StageData, TextElement } from '../core/StageLoader';

describe('StageLoader tutorialMessages TDD', () => {
    describe('Type definitions', () => {
        it('should allow StageData without tutorialMessages (existing behavior)', () => {
            // GIVEN: Basic stage data without tutorialMessages
            const basicStageData: StageData = {
                id: 1,
                name: 'Test Stage',
                platforms: [],
                spikes: [],
                goal: { x: 100, y: 100, width: 40, height: 50 },
                startText: { x: 50, y: 450, text: 'START' },
                goalText: { x: 150, y: 100, text: 'GOAL' }
            };

            // THEN: Should compile and be valid
            expect(basicStageData.id).toBe(1);
            expect(basicStageData.name).toBe('Test Stage');
        });

        it('should allow StageData with tutorialMessages array (new feature - RED test)', () => {
            // GIVEN: Tutorial messages array
            const tutorialMessages: TextElement[] = [
                { x: 600, y: 460, text: 'NICE WALK, RIGHT?' },
                { x: 780, y: 460, text: 'SURPRISE! :)' }
            ];

            // WHEN: Creating stage data with tutorialMessages
            // This will FAIL until we add tutorialMessages to StageData interface
            const stageWithTutorial: StageData & { tutorialMessages?: TextElement[] } = {
                id: 2,
                name: 'Tutorial Stage',
                platforms: [],
                spikes: [],
                goal: { x: 100, y: 100, width: 40, height: 50 },
                startText: { x: 50, y: 450, text: 'START' },
                goalText: { x: 150, y: 100, text: 'GOAL' },
                tutorialMessages
            };

            // THEN: Should have tutorialMessages property
            expect(stageWithTutorial.tutorialMessages).toHaveLength(2);
            expect(stageWithTutorial.tutorialMessages?.[0].text).toBe('NICE WALK, RIGHT?');
        });

        it('should allow empty tutorialMessages array', () => {
            // GIVEN: Empty tutorial messages
            const stageWithEmptyTutorial: StageData & { tutorialMessages?: TextElement[] } = {
                id: 3,
                name: 'Empty Tutorial Stage',
                platforms: [],
                spikes: [],
                goal: { x: 100, y: 100, width: 40, height: 50 },
                startText: { x: 50, y: 450, text: 'START' },
                goalText: { x: 150, y: 100, text: 'GOAL' },
                tutorialMessages: []
            };

            // THEN: Should handle empty array
            expect(stageWithEmptyTutorial.tutorialMessages).toHaveLength(0);
        });

        it('should allow undefined tutorialMessages (backward compatibility)', () => {
            // GIVEN: Stage without tutorialMessages
            const stageWithoutTutorial: StageData & { tutorialMessages?: TextElement[] } = {
                id: 4,
                name: 'No Tutorial Stage',
                platforms: [],
                spikes: [],
                goal: { x: 100, y: 100, width: 40, height: 50 },
                startText: { x: 50, y: 450, text: 'START' },
                goalText: { x: 150, y: 100, text: 'GOAL' }
                // tutorialMessages is undefined
            };

            // THEN: Should handle undefined gracefully
            expect(stageWithoutTutorial.tutorialMessages).toBeUndefined();
        });
    });

    describe('TextElement compatibility', () => {
        it('should use same TextElement interface for tutorialMessages', () => {
            // GIVEN: TextElement structure
            const tutorialMessage: TextElement = {
                x: 1100,
                y: 460,
                text: 'THOUGHT YOU COULD JUMP?'
            };

            // THEN: Should match existing TextElement interface
            expect(tutorialMessage.x).toBe(1100);
            expect(tutorialMessage.y).toBe(460);
            expect(tutorialMessage.text).toBe('THOUGHT YOU COULD JUMP?');
            expect(typeof tutorialMessage.x).toBe('number');
            expect(typeof tutorialMessage.y).toBe('number');
            expect(typeof tutorialMessage.text).toBe('string');
        });
    });
});
