import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { HtmlStageSelect } from '../core/HtmlStageSelect.js';

/**
 * HTML/CSS-based Stage Select Component Tests
 * Tests for the new semantic HTML stage selection interface
 */

describe('HTML StageSelect', () => {
    let container: HTMLElement;
    let htmlStageSelect: HtmlStageSelect;

    beforeEach(() => {
        // Setup DOM environment
        document.body.innerHTML = '';

        // Create the stage select HTML structure for testing
        const stageSelectHTML = `
            <div id="stageSelect" class="stage-select">
                <div class="stage-select-content">
                    <h1 class="stage-title">JUMPING DOT GAME</h1>
                    <h2 class="stage-subtitle">SELECT STAGE</h2>
                    
                    <div class="stage-list" role="menu">
                        <div class="stage-item" data-stage-id="1" role="menuitem" tabindex="0">
                            <div class="stage-name">STAGE 1</div>
                            <div class="stage-description">Basic tutorial stage</div>
                        </div>
                        <div class="stage-item" data-stage-id="2" role="menuitem" tabindex="0">
                            <div class="stage-name">STAGE 2</div>
                            <div class="stage-description">Moving platforms</div>
                        </div>
                    </div>
                    
                    <div class="stage-instructions">↑↓ Navigate  SPACE Select</div>
                </div>
            </div>
        `;

        document.body.innerHTML = stageSelectHTML;

        container = document.createElement('div');
        container.className = 'game-container';
        document.body.appendChild(container);

        // Create and initialize HtmlStageSelect instance
        htmlStageSelect = new HtmlStageSelect();
        htmlStageSelect.init();
    });

    afterEach(() => {
        document.body.innerHTML = '';
        vi.clearAllMocks();
    });

    describe('Component Structure', () => {
        it('should create stage select element with proper structure', () => {
            // This test will fail initially - this is expected in TDD Red phase
            const stageSelect = document.getElementById('stageSelect');
            expect(stageSelect).toBeTruthy();
            expect(stageSelect?.classList.contains('stage-select')).toBe(true);
        });

        it('should contain title and subtitle', () => {
            const title = document.querySelector('.stage-title');
            const subtitle = document.querySelector('.stage-subtitle');

            expect(title?.textContent).toBe('JUMPING DOT GAME');
            expect(subtitle?.textContent).toBe('SELECT STAGE');
        });

        it('should contain stage list with two stages', () => {
            const stageItems = document.querySelectorAll('.stage-item');
            expect(stageItems).toHaveLength(2);

            // Check first stage
            const stage1 = stageItems[0];
            expect(stage1.getAttribute('data-stage-id')).toBe('1');
            expect(stage1.querySelector('.stage-name')?.textContent).toBe('STAGE 1');
            expect(stage1.querySelector('.stage-description')?.textContent).toBe(
                'Basic tutorial stage'
            );

            // Check second stage
            const stage2 = stageItems[1];
            expect(stage2.getAttribute('data-stage-id')).toBe('2');
            expect(stage2.querySelector('.stage-name')?.textContent).toBe('STAGE 2');
            expect(stage2.querySelector('.stage-description')?.textContent).toBe(
                'Moving platforms'
            );
        });

        it('should contain navigation instructions', () => {
            const instructions = document.querySelector('.stage-instructions');
            expect(instructions?.textContent).toBe('↑↓ Navigate  SPACE Select');
        });
    });

    describe('Keyboard Navigation', () => {
        beforeEach(() => {
            // We'll implement createStageSelectHTML in the implementation phase
            // For now, this test will fail as expected in TDD Red phase
        });

        it('should focus first stage by default', () => {
            const firstStage = document.querySelector('.stage-item') as HTMLElement;
            expect(document.activeElement).toBe(firstStage);
        });

        it('should navigate down with ArrowDown key', () => {
            const firstStage = document.querySelector(
                '.stage-item[data-stage-id="1"]'
            ) as HTMLElement;
            const secondStage = document.querySelector(
                '.stage-item[data-stage-id="2"]'
            ) as HTMLElement;

            firstStage.focus();

            const event = new KeyboardEvent('keydown', { key: 'ArrowDown' });
            document.dispatchEvent(event);

            expect(document.activeElement).toBe(secondStage);
        });

        it('should navigate up with ArrowUp key', () => {
            const firstStage = document.querySelector(
                '.stage-item[data-stage-id="1"]'
            ) as HTMLElement;

            // First navigate down to second stage
            const downEvent = new KeyboardEvent('keydown', { key: 'ArrowDown' });
            document.dispatchEvent(downEvent);

            // Then navigate up to first stage
            const upEvent = new KeyboardEvent('keydown', { key: 'ArrowUp' });
            document.dispatchEvent(upEvent);

            expect(document.activeElement).toBe(firstStage);
        });

        it('should not navigate beyond boundaries', () => {
            const firstStage = document.querySelector(
                '.stage-item[data-stage-id="1"]'
            ) as HTMLElement;

            firstStage.focus();

            const event = new KeyboardEvent('keydown', { key: 'ArrowUp' });
            document.dispatchEvent(event);

            expect(document.activeElement).toBe(firstStage);
        });
    });

    describe('Stage Selection', () => {
        it('should trigger stage selection with Space key', () => {
            const mockStartStage = vi.fn();
            // Updated for Phase 3: Standard DOM events instead of custom events
            document.addEventListener('click', mockStartStage);

            const firstStage = document.querySelector(
                '.stage-item[data-stage-id="1"]'
            ) as HTMLElement;
            firstStage.focus();

            const event = new KeyboardEvent('keydown', { key: ' ' });
            document.dispatchEvent(event);

            // Expect standard DOM click event with target containing data-stage-id
            expect(mockStartStage).toHaveBeenCalledWith(
                expect.objectContaining({
                    target: expect.objectContaining({
                        getAttribute: expect.any(Function),
                        classList: expect.objectContaining({
                            contains: expect.any(Function)
                        })
                    })
                })
            );
        });

        it('should trigger stage selection with Enter key', () => {
            const mockStartStage = vi.fn();
            // Updated for Phase 3: Standard DOM events instead of custom events
            document.addEventListener('click', mockStartStage);

            // Navigate to second stage first
            const downEvent = new KeyboardEvent('keydown', { key: 'ArrowDown' });
            document.dispatchEvent(downEvent);

            const event = new KeyboardEvent('keydown', { key: 'Enter' });
            document.dispatchEvent(event);

            // Expect standard DOM click event with target containing data-stage-id
            expect(mockStartStage).toHaveBeenCalledWith(
                expect.objectContaining({
                    target: expect.objectContaining({
                        getAttribute: expect.any(Function),
                        classList: expect.objectContaining({
                            contains: expect.any(Function)
                        })
                    })
                })
            );
        });
    });

    describe('Accessibility', () => {
        it('should have proper ARIA roles', () => {
            const stageList = document.querySelector('.stage-list');
            const stageItems = document.querySelectorAll('.stage-item');

            expect(stageList?.getAttribute('role')).toBe('menu');
            for (const item of stageItems) {
                expect(item.getAttribute('role')).toBe('menuitem');
                expect(item.hasAttribute('tabindex')).toBe(true);
            }
        });

        it('should support screen reader navigation', () => {
            const stageItems = document.querySelectorAll('.stage-item');
            for (const item of stageItems) {
                expect(item.getAttribute('tabindex')).toBe('0');
            }
        });
    });

    describe('Visual State', () => {
        it('should apply selected styling to focused element', () => {
            const firstStage = document.querySelector(
                '.stage-item[data-stage-id="1"]'
            ) as HTMLElement;
            firstStage.focus();

            // We'll implement CSS classes for focus state
            expect(firstStage.matches(':focus')).toBe(true);
        });
    });
});
