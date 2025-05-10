import type { Config } from 'jest';

const collectCoverage = process.env.COVERAGE === 'true';

const config: Config = {
    collectCoverage,
    collectCoverageFrom: ['./src/**/*.{js,jsx,ts,tsx}'],
    coveragePathIgnorePatterns: ['./src/utils/types.ts'],
    coverageProvider: 'v8',
    modulePathIgnorePatterns: ['src/content-scanners/test.ts'],
    setupFiles: ['./jest/jest.setup.ts'],
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
    },
    testEnvironment: 'node',
    transform: {
        '^.+\\.(t|j)sx?$': '@swc/jest',
    },
};

export default config;
