import type { Config } from 'jest';

const collectCoverage = process.env.COVERAGE === 'true';

const config: Config = {
    collectCoverage,
    collectCoverageFrom: ['./src/**/*.{js,jsx,ts,tsx}'],
    coveragePathIgnorePatterns: ['./src/utils/types.ts'],
    coverageProvider: 'v8',
    modulePathIgnorePatterns: ['src/content-scanners/test.ts'],
    setupFiles: ['./jest.setup.ts'],
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
    },
    preset: 'ts-jest',
    testEnvironment: 'node',
};

export default config;
