import { IStorageBackend } from '@/storage/istorage-backend';
import getBrowserLastError from '@/utils/helpers/get-browser-last-error';
import browser from 'webextension-polyfill';

class BrowserLocalStorage implements IStorageBackend {
    /**
     * Stores a value under the given key in browser.storage.local.
     * The value is JSON-stringified first.
     */
    async set(key: string, value: unknown): Promise<void> {
        const toStore = JSON.stringify(value);
        try {
            await browser.storage.local.set({ [key]: toStore });
            console.log(`BrowserLocalStorage.set: ${key} = ${toStore}`);
        } catch (_error) {
            throw getBrowserLastError();
        }
    }

    /**
     * Retrieves a value from browser.storage.local for the given key.
     * The stored value is JSON-parsed before returning.
     */
    async get(key: string): Promise<unknown> {
        try {
            const result = await browser.storage.local.get(key);
            const rawValue: unknown = result[key];

            if (rawValue === undefined || rawValue === null) {
                console.log(`BrowserLocalStorage.get: ${key} => null`);
                return null;
            }

            if (typeof rawValue !== 'string') {
                console.warn(`BrowserLocalStorage.get: stored value for '${key}' is not a string. Returning null.`);
                return null;
            }

            try {
                const parsedValue = JSON.parse(rawValue) as unknown;
                console.log(`BrowserLocalStorage.get: ${key} =>`, parsedValue);

                return parsedValue !== null ? parsedValue : null;
            } catch (_error) {
                console.warn(
                    `BrowserLocalStorage.get: could not parse value for key '${key}'. Returning raw value as string.`
                );
                return rawValue;
            }
        } catch (_error) {
            throw getBrowserLastError();
        }
    }

    /**
     * Removes the given key from browser.storage.local.
     */
    async remove(key: string): Promise<void> {
        try {
            await browser.storage.local.remove(key);
            console.log(`BrowserLocalStorage.remove: ${key}`);
        } catch (_error) {
            throw getBrowserLastError();
        }
    }
}

export default BrowserLocalStorage;
