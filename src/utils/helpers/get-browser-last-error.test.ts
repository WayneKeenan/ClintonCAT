import getBrowserLastError from './get-browser-last-error';
import browser from 'webextension-polyfill';

describe(getBrowserLastError.name, () => {
    beforeEach(() => {
        jest.clearAllMocks();
        browser.runtime.lastError = undefined;
    });

    it('should return the lastError if it is an instance of Error', () => {
        const error = new Error('Test error');
        browser.runtime.lastError = error;
        expect(getBrowserLastError()).toBe(error);
    });

    it("should return a new Error with 'Unknown error' if lastError is not an instance of Error", () => {
        // @ts-expect-error
        browser.runtime.lastError = 'Some error string';
        expect(getBrowserLastError()).toEqual(new Error('Unknown error'));
    });

    it("should return a new Error with 'Unknown error' if lastError is null", () => {
        browser.runtime.lastError = undefined;
        expect(getBrowserLastError()).toEqual(new Error('Unknown error'));
    });
});
