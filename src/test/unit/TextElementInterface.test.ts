import { describe, expect, it } from 'vitest';
import type { TextElement } from '../../core/StageLoader';

describe('TextElement Interface', () => {
    it('should support basic text properties', () => {
        const basicText: TextElement = {
            x: 100,
            y: 200,
            text: 'Hello World'
        };

        expect(basicText.x).toBe(100);
        expect(basicText.y).toBe(200);
        expect(basicText.text).toBe('Hello World');
    });

    it('should support optional style properties', () => {
        const styledText: TextElement = {
            x: 100,
            y: 200,
            text: 'Styled Text',
            style: {
                fontSize: 18,
                color: '#ffffff',
                fontWeight: 'bold'
            }
        };

        expect(styledText.style?.fontSize).toBe(18);
        expect(styledText.style?.color).toBe('#ffffff');
        expect(styledText.style?.fontWeight).toBe('bold');
    });

    it('should work without style properties for backward compatibility', () => {
        const legacyText: TextElement = {
            x: 50,
            y: 100,
            text: 'Legacy Text'
            // no style property
        };

        expect(legacyText.style).toBeUndefined();
        expect(legacyText.x).toBe(50);
        expect(legacyText.y).toBe(100);
        expect(legacyText.text).toBe('Legacy Text');
    });

    it('should support partial style properties', () => {
        const partialStyleText: TextElement = {
            x: 300,
            y: 400,
            text: 'Partial Style',
            style: {
                fontSize: 20
                // only fontSize specified
            }
        };

        expect(partialStyleText.style?.fontSize).toBe(20);
        expect(partialStyleText.style?.color).toBeUndefined();
        expect(partialStyleText.style?.fontWeight).toBeUndefined();
    });
});
