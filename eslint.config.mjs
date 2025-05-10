import eslint from '@eslint/js';
import { includeIgnoreFile } from '@eslint/compat';
import prettier from 'eslint-plugin-prettier/recommended';
import tseslint from 'typescript-eslint';
import checkFile from 'eslint-plugin-check-file';
import importPlugin from 'eslint-plugin-import';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const gitignorePath = path.resolve(__dirname, '.gitignore');

export default tseslint.config(
    {
        languageOptions: {
            parserOptions: {
                projectService: true,
                tsconfigRootDir: import.meta.dirname,
            },
        },
        files: ['**/*.{mjs,js,jsx,mts,ts,tsx}'],
        extends: [
            eslint.configs.recommended,
            tseslint.configs.strictTypeChecked,
            tseslint.configs.stylisticTypeChecked,
            prettier,
        ],
        plugins: {
            import: importPlugin,
            'check-file': checkFile,
        },
        rules: {
            '@typescript-eslint/no-confusing-void-expression': 'off',
            '@typescript-eslint/no-floating-promises': 'off',
            '@typescript-eslint/no-unused-vars': [
                'error',
                {
                    args: 'all',
                    argsIgnorePattern: '^_',
                    caughtErrors: 'all',
                    caughtErrorsIgnorePattern: '^_',
                    destructuredArrayIgnorePattern: '^_',
                    varsIgnorePattern: '^_',
                    ignoreRestSiblings: true,
                },
            ],
            '@typescript-eslint/no-extraneous-class': 'off',
            '@typescript-eslint/no-inferrable-types': 'off',
            '@typescript-eslint/no-unnecessary-condition': 'off',
            '@typescript-eslint/restrict-template-expressions': ['error', { allowNullish: false, allowNumber: true }],
            'check-file/filename-naming-convention': [
                'error',
                {
                    '**/*.{js,ts}': 'KEBAB_CASE',
                    '**/*.{jsx,tsx}': 'PASCAL_CASE',
                },
                {
                    ignoreMiddleExtensions: true,
                },
            ],
        },
    },
    {
        files: ['**/*.test.ts', '**/*.test.tsx', '__mocks__/**/*'],
        rules: {
            '@typescript-eslint/ban-ts-comment': 'off',
            '@typescript-eslint/no-unnecessary-type-parameters': 'off',
            '@typescript-eslint/unbound-method': 'off',
        },
    },
    includeIgnoreFile(gitignorePath),
    {
        ignores: [
            'node_modules',
            'dist',
            'jest/CustomJSDOMEnvironment.js',
            '**/webpack.config.js',
            '**/eslint.config.mjs',
            '**/jest.config.ts',
            '**/webpack-plugins',
            '**/scripts',
            '**/engines/safari',
        ],
    }
);
