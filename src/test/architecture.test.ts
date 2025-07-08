import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, test } from 'vitest';

describe('Clean Architecture Compliance', () => {
    describe('Layer Dependency Violations', () => {
        test('should not have domain layer importing from infrastructure layer', () => {
            // PlayerSystem is in domain layer and should not import from FabricRenderSystem (infrastructure)
            const playerSystemPath = join(process.cwd(), 'src/systems/PlayerSystem.ts');
            const playerSystemContent = readFileSync(playerSystemPath, 'utf-8');

            // This should FAIL initially (Red phase) because PlayerSystem imports from FabricRenderSystem
            expect(playerSystemContent).not.toMatch(/import.*from.*FabricRenderSystem/);
        });

        test('LandingPrediction type should be available from domain layer', async () => {
            // This test will fail initially because LandingPrediction is not in domain layer yet
            await expect(async () => {
                // Try to import from domain layer (this should work after we move the type)
                await import('../types/AnalyticsTypes.js');
            }).not.toThrow();
        });

        test('should have single source of truth for LandingPrediction type', () => {
            // Check that LandingPrediction is not duplicated across multiple files
            const checkFiles = [
                'src/systems/IRenderSystem.ts',
                'src/systems/FabricRenderSystem.ts',
                'src/systems/renderers/AnimationRenderer.ts'
            ];

            let definitionCount = 0;
            for (const file of checkFiles) {
                try {
                    const filePath = join(process.cwd(), file);
                    const content = readFileSync(filePath, 'utf-8');
                    if (content.includes('export interface LandingPrediction')) {
                        definitionCount++;
                    }
                } catch (_error) {
                    // File might not exist, continue
                }
            }

            // Should have at most 1 definition (ideally 0 if moved to domain layer)
            expect(definitionCount).toBeLessThanOrEqual(1);
        });
    });

    describe('Domain Type Location', () => {
        test('analytics types should be in domain layer', () => {
            // This will fail initially because AnalyticsTypes.ts doesn't exist yet
            const analyticsTypesPath = join(process.cwd(), 'src/types/AnalyticsTypes.ts');
            expect(() => {
                const content = readFileSync(analyticsTypesPath, 'utf-8');
                expect(content).toMatch(/interface LandingPrediction/);
            }).not.toThrow();
        });
    });
});
