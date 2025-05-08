jest.mock('webextension-polyfill', () => ({
    runtime: {
        lastError: undefined,
    },
}));
