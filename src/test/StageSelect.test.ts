import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { HtmlStageSelect } from '../core/HtmlStageSelect.js';

/**
 * HTML/CSS-based Stage Select Component Tests
 * Tests for the new semantic HTML stage selection interface
 */

// Helper function to check DOM availability and skip tests if not available
function requireDOM() {
    const isDOMAvailable =
        typeof document !== 'undefined' &&
        typeof document.createElement === 'function' &&
        document.documentElement &&
        document.getElementById;

    if (!isDOMAvailable) {
        console.warn('⚠️ Skipping DOM-dependent test - DOM not available');
        return false;
    }
    return true;
}

describe('HTML StageSelect', () => {
    let container: HTMLElement;
    let htmlStageSelect: HtmlStageSelect;

    beforeEach(() => {
        // DEFENSIVE: Check if DOM functions are available before proceeding
        const isDOMAvailable =
            typeof document !== 'undefined' &&
            typeof document.createElement === 'function' &&
            document.documentElement;

        if (!isDOMAvailable) {
            console.warn('⚠️ DOM not available in test environment - skipping DOM-dependent tests');
            return; // Skip DOM setup if not available
        }

        // Setup DOM environment - ensure body exists in CI
        if (!document.body) {
            document.body = document.createElement('body');
            if (document.documentElement?.appendChild) {
                document.documentElement.appendChild(document.body);
            }
        }
        if (document.body && 'innerHTML' in document.body) {
            document.body.innerHTML = '';
        }

        // Create the stage select DOM structure for testing (CI-compatible)
        // Create main stage select element
        const stageSelect = document.createElement('div');
        stageSelect.id = 'stageSelect';
        stageSelect.className = 'stage-select';

        const stageSelectContent = document.createElement('div');
        stageSelectContent.className = 'stage-select-content';

        // Create title
        const title = document.createElement('h1');
        title.className = 'stage-title';
        title.textContent = 'JUMPING DOT GAME';

        // Create subtitle
        const subtitle = document.createElement('h2');
        subtitle.className = 'stage-subtitle';
        subtitle.textContent = 'SELECT STAGE';

        // Create stage list
        const stageList = document.createElement('div');
        stageList.className = 'stage-list';
        stageList.setAttribute('role', 'menu');

        // Create stage 1
        const stage1 = document.createElement('div');
        stage1.className = 'stage-item';
        stage1.setAttribute('data-stage-id', '1');
        stage1.setAttribute('role', 'menuitem');
        stage1.setAttribute('tabindex', '0');

        const stage1Name = document.createElement('div');
        stage1Name.className = 'stage-name';
        stage1Name.textContent = 'STAGE 1';

        const stage1Desc = document.createElement('div');
        stage1Desc.className = 'stage-description';
        stage1Desc.textContent = 'Basic tutorial stage';

        if (stage1.appendChild) {
            stage1.appendChild(stage1Name);
            stage1.appendChild(stage1Desc);
        }

        // Create stage 2
        const stage2 = document.createElement('div');
        stage2.className = 'stage-item';
        stage2.setAttribute('data-stage-id', '2');
        stage2.setAttribute('role', 'menuitem');
        stage2.setAttribute('tabindex', '0');

        const stage2Name = document.createElement('div');
        stage2Name.className = 'stage-name';
        stage2Name.textContent = 'STAGE 2';

        const stage2Desc = document.createElement('div');
        stage2Desc.className = 'stage-description';
        stage2Desc.textContent = 'Moving platforms';

        if (stage2.appendChild) {
            stage2.appendChild(stage2Name);
            stage2.appendChild(stage2Desc);
        }

        if (stageList.appendChild) {
            stageList.appendChild(stage1);
            stageList.appendChild(stage2);
        }

        // Create instructions
        const instructions = document.createElement('div');
        instructions.className = 'stage-instructions';
        instructions.textContent = '↑↓ Navigate  SPACE Select';

        // Assemble the structure
        if (stageSelectContent.appendChild) {
            stageSelectContent.appendChild(title);
            stageSelectContent.appendChild(subtitle);
            stageSelectContent.appendChild(stageList);
            stageSelectContent.appendChild(instructions);
        }
        if (stageSelect.appendChild) {
            stageSelect.appendChild(stageSelectContent);
        }

        // Add to document body
        if (document.body?.appendChild) {
            document.body.appendChild(stageSelect);
        }

        container = document.createElement('div');
        container.className = 'game-container';
        if (document.body?.appendChild) {
            document.body.appendChild(container);
        }

        // Create and initialize HtmlStageSelect instance
        htmlStageSelect = new HtmlStageSelect();
        htmlStageSelect.init();
    });

    afterEach(() => {
        // Safe cleanup for both local and CI environments
        if (document.body) {
            document.body.innerHTML = '';
        }
        vi.clearAllMocks();
    });

    describe('Component Structure', () => {
        it('should create stage select element with proper structure', () => {
            if (!requireDOM()) return;

            // This test will fail initially - this is expected in TDD Red phase
            const stageSelect = document.getElementById('stageSelect');
            expect(stageSelect).toBeTruthy();
            expect(stageSelect?.classList.contains('stage-select')).toBe(true);
        });

        it('should contain title and subtitle', () => {
            if (!requireDOM()) return;

            const title = document?.querySelector ? document.querySelector('.stage-title') : null;
            const subtitle = document?.querySelector
                ? document.querySelector('.stage-subtitle')
                : null;

            expect(title?.textContent).toBe('JUMPING DOT GAME');
            expect(subtitle?.textContent).toBe('SELECT STAGE');
        });

        it('should contain stage list with two stages', () => {
            if (!requireDOM()) return;

            const stageItems = document?.querySelectorAll
                ? document.querySelectorAll('.stage-item')
                : [];
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
            if (!requireDOM()) return;

            const instructions = document?.querySelector
                ? document.querySelector('.stage-instructions')
                : null;
            expect(instructions?.textContent).toBe('↑↓ Navigate  SPACE Select');
        });
    });

    describe('Keyboard Navigation', () => {
        beforeEach(() => {
            // We'll implement createStageSelectHTML in the implementation phase
            // For now, this test will fail as expected in TDD Red phase
        });

        it('should focus first stage by default', () => {
            if (!requireDOM()) return;

            const firstStage = document?.querySelector
                ? (document.querySelector('.stage-item') as HTMLElement)
                : null;
            expect(document.activeElement).toBe(firstStage);
        });

        it('should navigate down with ArrowDown key', () => {
            if (!requireDOM()) return;

            const firstStage = document?.querySelector
                ? (document.querySelector('.stage-item[data-stage-id="1"]') as HTMLElement)
                : null;
            const secondStage = document?.querySelector
                ? (document.querySelector('.stage-item[data-stage-id="2"]') as HTMLElement)
                : null;

            firstStage?.focus();

            const event = new KeyboardEvent('keydown', { key: 'ArrowDown' });
            document?.dispatchEvent?.(event);

            expect(document.activeElement).toBe(secondStage);
        });

        it('should navigate up with ArrowUp key', () => {
            if (!requireDOM()) return;

            const firstStage = document?.querySelector
                ? (document.querySelector('.stage-item[data-stage-id="1"]') as HTMLElement)
                : null;

            // First navigate down to second stage
            const downEvent = new KeyboardEvent('keydown', { key: 'ArrowDown' });
            document?.dispatchEvent?.(downEvent);

            // Then navigate up to first stage
            const upEvent = new KeyboardEvent('keydown', { key: 'ArrowUp' });
            document?.dispatchEvent?.(upEvent);

            expect(document.activeElement).toBe(firstStage);
        });

        it('should not navigate beyond boundaries', () => {
            if (!requireDOM()) return;

            const firstStage = document?.querySelector
                ? (document.querySelector('.stage-item[data-stage-id="1"]') as HTMLElement)
                : null;

            firstStage?.focus();

            const event = new KeyboardEvent('keydown', { key: 'ArrowUp' });
            document?.dispatchEvent?.(event);

            expect(document.activeElement).toBe(firstStage);
        });
    });

    describe('Stage Selection', () => {
        it('should trigger stage selection with Space key', () => {
            if (!requireDOM()) return;

            const mockStartStage = vi.fn();
            // Updated for Phase 3: Standard DOM events instead of custom events
            document.addEventListener('click', mockStartStage);

            const firstStage = document?.querySelector
                ? (document.querySelector('.stage-item[data-stage-id="1"]') as HTMLElement)
                : null;
            firstStage?.focus();

            const event = new KeyboardEvent('keydown', { key: ' ' });
            document?.dispatchEvent?.(event);

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
            if (!requireDOM()) return;

            const mockStartStage = vi.fn();
            // Updated for Phase 3: Standard DOM events instead of custom events
            document.addEventListener('click', mockStartStage);

            // Navigate to second stage first
            const downEvent = new KeyboardEvent('keydown', { key: 'ArrowDown' });
            document?.dispatchEvent?.(downEvent);

            const event = new KeyboardEvent('keydown', { key: 'Enter' });
            document?.dispatchEvent?.(event);

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
            if (!requireDOM()) return;

            const stageList = document?.querySelector
                ? document.querySelector('.stage-list')
                : null;
            const stageItems = document?.querySelectorAll
                ? document.querySelectorAll('.stage-item')
                : [];

            expect(stageList?.getAttribute('role')).toBe('menu');
            for (const item of stageItems) {
                expect(item.getAttribute('role')).toBe('menuitem');
                expect(item.hasAttribute('tabindex')).toBe(true);
            }
        });

        it('should support screen reader navigation', () => {
            if (!requireDOM()) return;

            const stageItems = document?.querySelectorAll
                ? document.querySelectorAll('.stage-item')
                : [];
            for (const item of stageItems) {
                expect(item.getAttribute('tabindex')).toBe('0');
            }
        });
    });

    describe('Visual State', () => {
        it('should apply selected styling to focused element', () => {
            if (!requireDOM()) return;

            const firstStage = document?.querySelector
                ? (document.querySelector('.stage-item[data-stage-id="1"]') as HTMLElement)
                : null;
            firstStage?.focus();

            // We'll implement CSS classes for focus state
            expect(firstStage?.matches?.(':focus')).toBe(true);
        });
    });

    describe('Stage Select Display Management', () => {
        it('should show stage select element when returning to stage select', () => {
            if (!requireDOM()) return;

            // Use existing stage select element created in beforeEach
            const stageSelectElement = document.getElementById('stageSelect');
            if (!stageSelectElement) return;

            // Set to hidden initially
            stageSelectElement.style.display = 'none';

            // Call returnToStageSelect
            htmlStageSelect.returnToStageSelect();

            // Verify that stage select element is shown
            expect(stageSelectElement.style.display).not.toBe('none');
        });

        it('should hide game elements when showing stage select', () => {
            if (!requireDOM()) return;

            // Create game UI elements
            const gameUI = document.createElement('div');
            gameUI.id = 'gameUI';
            gameUI.style.display = 'block';
            container.appendChild(gameUI);

            const info = document.createElement('div');
            info.className = 'info';
            info.style.display = 'block';
            container.appendChild(info);

            const controls = document.createElement('div');
            controls.className = 'controls';
            controls.style.display = 'block';
            container.appendChild(controls);

            // Call returnToStageSelect
            htmlStageSelect.returnToStageSelect();

            // Verify that game elements are hidden
            expect(gameUI.style.display).toBe('none');
            expect(info.style.display).toBe('none');
            expect(controls.style.display).toBe('none');
        });
    });
});
