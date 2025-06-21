// ESLint configuration for 300-line limit enforcement
// Lightweight TypeScript configuration
import tsPlugin from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";

export default [
    {
        files: ["src/**/*.ts"],
        ignores: [
            "src/test/**",
            "src/**/*.test.ts", 
            "src/**/*.spec.ts",
            "**/*.d.ts"
        ],
        languageOptions: {
            parser: tsParser,
            parserOptions: {
                ecmaVersion: 2022,
                sourceType: "module"
            }
        },
        plugins: {
            "@typescript-eslint": tsPlugin
        },
        rules: {
            "max-lines": ["error", { 
                max: 350,
                skipBlankLines: true,
                skipComments: true 
            }]
        }
    }
];