import { IPageEntry, PagesDB } from '@/database';
import browser from 'webextension-polyfill';

class StorageCache {
    static readonly UPDATE_ALARM_NAME: string = 'updatePagesDB';
    static readonly CACHE_KEY: string = 'cachedPagesDB';
    static readonly CACHE_TIMESTAMP_KEY: string = 'cachedPagesDBTimestamp';
    static readonly FETCH_INTERVAL_MINUTES: number = 30; // Fetch every 30 minutes
    static readonly FETCH_INTERVAL_MS: number = StorageCache.FETCH_INTERVAL_MINUTES * 60 * 1000;

    private pagesDb: PagesDB;
    constructor(pagesDb: PagesDB) {
        this.pagesDb = pagesDb;
        // Alarm to trigger periodic updates
        browser.alarms.create(StorageCache.UPDATE_ALARM_NAME, {
            periodInMinutes: StorageCache.FETCH_INTERVAL_MINUTES,
        });
        browser.alarms.onAlarm.addListener((alarm) => {
            if (alarm.name === StorageCache.UPDATE_ALARM_NAME) {
                void this.updatePagesDB();
            }
        });
        void this.updatePagesDB();
    }

    setDatabaseTarget(pagesDb: PagesDB): void {
        this.pagesDb = pagesDb;
    }

    async isCacheStale(epoch = Date.now()) {
        // Get the last update timestamp
        const { [StorageCache.CACHE_TIMESTAMP_KEY]: lastUpdated } = await browser.storage.local.get(
            StorageCache.CACHE_TIMESTAMP_KEY
        );

        if (!lastUpdated) {
            return true;
        }
        return epoch - (lastUpdated as number) >= StorageCache.FETCH_INTERVAL_MS;
    }

    async saveCache(data: string, timestamp: number = Date.now()) {
        await browser.storage.local.set({
            [StorageCache.CACHE_KEY]: data,
            [StorageCache.CACHE_TIMESTAMP_KEY]: timestamp,
        });
    }

    // Function to fetch and cache the pages database
    async updatePagesDB(force = false) {
        try {
            const now = Date.now();
            const needsUpdate = force || (await this.isCacheStale(now));
            if (!needsUpdate) {
                console.log('Skipping update: Cache TTL not reached.');
            }

            console.log('Fetching updated pages database...');
            const jsonData: string = await this.fetchJson(PagesDB.PAGES_DB_JSON_URL);
            await this.saveCache(jsonData, now);
            console.log(jsonData);
            this.pagesDb.setPages(jsonData as unknown as IPageEntry[]);

            console.log('Pages database updated successfully.');
        } catch (error: unknown) {
            if (error instanceof Error) {
                console.error(`Failed to update pages database: ${error.message}`);
                // PagesDB has an initial baked in default, however...
                // TODO: as simply re-throwing kills the plugin it would be better to update UI
            }
        }
    }

    // Function to get the cached pages database
    async getCachedPagesDB(): Promise<IPageEntry[]> {
        const { [StorageCache.CACHE_KEY]: pagesDb } = await browser.storage.local.get(StorageCache.CACHE_KEY);
        return (pagesDb as IPageEntry[] | undefined) ?? [];
    }

    async fetchJson(url: string): Promise<string> {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status.toString()}`);
            }
            return (await response.json()) as string;
        } catch (error: unknown) {
            if (error instanceof Error) {
                console.error(`Failed to fetch JSON: ${error.message}`);
                throw error;
            }
        }
        return '';
    }
}

export default StorageCache;
