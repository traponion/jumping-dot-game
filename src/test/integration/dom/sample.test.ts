// 🔴 Integration Test - Full JSDOM Environment Sample
describe('Integration Sample', () => {
    test('should run in full JSDOM environment', () => {
        expect(typeof document).toBe('object');
        expect(typeof window).toBe('object');

        // Test DOM manipulation capability
        const element = document.createElement('div');
        expect(element).toBeDefined();
    });
});
