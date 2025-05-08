import getBrowserLastError from './get-chrome-last-error';

describe(getBrowserLastError.name, () => {
    beforeEach(() => {
        global.browser = {
            runtime: {
                lastError: undefined,
            },
        };
    });

    it('should return the lastError if it is an instance of Error', () => {
        const error = new Error('Test error');
        global.browser.runtime.lastError = error;
        expect(getBrowserLastError()).toBe(error);
    });

    it("should return a new Error with 'Unknown error' if lastError is not an instance of Error", () => {
        global.browser.runtime.lastError = 'Some error string' as chrome.runtime.LastError;
        expect(getBrowserLastError()).toEqual(new Error('Unknown error'));
    });

    it("should return a new Error with 'Unknown error' if lastError is null", () => {
        global.browser.runtime.lastError = undefined;
        expect(getBrowserLastError()).toEqual(new Error('Unknown error'));
    });
});
