import browser from 'webextension-polyfill';

/**
 * Get the last error from the browser runtime.
 */
function getBrowserLastError(): Error {
    return browser.runtime.lastError instanceof Error ? browser.runtime.lastError : new Error('Unknown error');
}

export default getBrowserLastError;
