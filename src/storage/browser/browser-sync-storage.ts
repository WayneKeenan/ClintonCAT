import { IStorageBackend } from '@/storage/istorage-backend';
import getBrowserLastError from '@/utils/helpers/get-browser-last-error';
import browser from 'webextension-polyfill';

class BrowserSyncStorage implements IStorageBackend {
    /**
     * Stores a value under the given key in browser.storage.sync.
     * The value is JSON-stringified first.
     */
    async set(key: string, value: unknown): Promise<void> {
        const toStore = JSON.stringify(value);
        try {
            await browser.storage.sync.set({ [key]: toStore });
            console.log(`BrowserSyncStorage.set: ${key} = ${toStore}`);
        } catch (_error) {
            throw getBrowserLastError();
        }
    }

    /**
     * Retrieves a value from browser.storage.sync for the given key.
     * The stored value is JSON-parsed before returning.
     */
    async get(key: string): Promise<unknown> {
        try {
            const result = await browser.storage.sync.get(key);
            const rawValue: unknown = result[key];
            console.log('Raw value', rawValue, typeof rawValue);

            if (rawValue === undefined || rawValue === null) {
                console.log(`BrowserSyncStorage.get: ${key} => null`);
                return null;
            }

            if (typeof rawValue !== 'string') {
                console.warn(`BrowserSyncStorage.get: stored value for '${key}' is not a string. Returning null.`);
                return null;
            }

            try {
                const parsedValue = JSON.parse(rawValue) as unknown;
                console.log(`BrowserSyncStorage.get: ${key} =>`, parsedValue);

                return parsedValue !== null ? parsedValue : null;
            } catch (_error) {
                console.warn(
                    `BrowserSyncStorage.get: could not parse value for key '${key}'. Returning raw value as string.`
                );
                return rawValue;
            }
        } catch (_error) {
            throw getBrowserLastError();
        }
    }

    /**
     * Removes the given key from browser.storage.sync.
     */
    async remove(key: string): Promise<void> {
        try {
            await browser.storage.sync.remove(key);
            console.log(`BrowserSyncStorage.remove: ${key}`);
        } catch (_error) {
            throw getBrowserLastError();
        }
    }
}

export default BrowserSyncStorage;
