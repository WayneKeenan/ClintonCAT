import { ICargoExport, PagesDB } from '@/database';
import { Page } from '@/models/page';
import browser from 'webextension-polyfill';

import Preferences from '@/common/services/preferences';
import BrowserLocalStorage from '@/storage/browser/browser-local-storage';
import BrowserSyncStorage from '@/storage/browser/browser-sync-storage';
import { z } from 'zod';

class StorageCache {
    static readonly UPDATE_ALARM_NAME: string = 'updatePagesDB';
    static readonly CACHE_KEY: string = 'cachedPagesDB';
    static readonly CACHE_TIMESTAMP_KEY: string = 'cachedPagesDBTimestamp';
    static readonly FETCH_INTERVAL_MINUTES: number = 30; // Fetch every 30 minutes
    static readonly FETCH_INTERVAL_MS: number = StorageCache.FETCH_INTERVAL_MINUTES * 60 * 1000;

    private pagesDb: PagesDB;
    constructor(pagesDb: PagesDB) {
        this.pagesDb = pagesDb;
        Preferences.initDefaults(new BrowserSyncStorage(), new BrowserLocalStorage());
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
        const autoUpdate = (await Preferences.getPreference(Preferences.AUTO_UPDATE_PAGESDB_KEY)) as boolean;
        let autoUpdateInterval = (await Preferences.getPreference(
            Preferences.AUTO_UPDATE_PAGESDB_INTERVAL_KEY
        )) as number;

        if (!autoUpdate) return false;

        // Get the last update timestamp
        const { [StorageCache.CACHE_TIMESTAMP_KEY]: lastUpdated } = await browser.storage.local.get(
            StorageCache.CACHE_TIMESTAMP_KEY
        );

        if (!lastUpdated) {
            return true;
        }
        autoUpdateInterval = autoUpdateInterval * 24 * 60 * 60 * 1000;

        return epoch - (lastUpdated as number) >= autoUpdateInterval;
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

            let cacheLoaded = false;

            if (!needsUpdate) {
                console.log('Skipping update: Cache TTL not reached.');
                const JsonDataCache = (await this.getCachedPagesDB()) as unknown as ICargoExport;

                if (this.validatePagesDB(JsonDataCache)) {
                    console.log('Loading from cache...', JsonDataCache);
                    this.pagesDb.setPages(JsonDataCache);
                    cacheLoaded = true;
                }
            }

            if (!cacheLoaded) {
                console.log('Fetching updated pages database...', PagesDB.PAGES_DB_JSON_URL);
                const jsonData: string = await this.fetchJson(PagesDB.PAGES_DB_JSON_URL);
                if (this.validatePagesDB(jsonData as unknown as ICargoExport)) {
                    await this.saveCache(jsonData, now);
                    this.pagesDb.setPages(jsonData as unknown as ICargoExport);
                    console.log('Pages database updated successfully.', jsonData);
                } else {
                    console.log('Pages database NOT updated successfully.');
                }
            }
        } catch (error: unknown) {
            if (error instanceof Error) {
                console.error(`Failed to update pages database: ${error.message}`);
                // PagesDB has an initial baked in default, however...
                // TODO: as simply re-throwing kills the plugin it would be better to update UI
            }
        }
    }

    // Function to get the cached pages database
    async getCachedPagesDB(): Promise<Page[]> {
        const { [StorageCache.CACHE_KEY]: pagesDb } = await browser.storage.local.get(StorageCache.CACHE_KEY);
        console.log('StorageCache', pagesDb);
        return (pagesDb as Page[] | undefined) ?? [];
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

    validatePagesDB(db: ICargoExport): boolean {
        //ICompanyCargo
        const schemaCompanyCargo = z.object({
            PageID: z.string(),
            PageName: z.string(),
            Industry: z.string(),
            ParentCompany: z.string(),
            Type: z.string(),
            Website: z.string(),
        });

        //IIncidentCargo
        const schemaIncidentCargo = z.object({
            PageID: z.string(),
            PageName: z.string(),
            Company: z.string(),
            Description: z.string(),
            EndDate: z.string(),
            Product: z.string(),
            ProductLine: z.string(),
            StartDate: z.string(),
            Status: z.string(),
            Type: z.string(),
        });

        //IProductCargo
        const schemaProductCargo = z.object({
            PageID: z.string(),
            PageName: z.string(),
            Category: z.string(),
            Company: z.string(),
            Description: z.string(),
            ProductLine: z.string(),
            Website: z.string(),
        });

        //IProductLineCargo
        const schemaProductLine = z.object({
            PageID: z.string(),
            PageName: z.string(),
            Category: z.string(),
            Company: z.string(),
            Description: z.string(),
            Website: z.string(),
        });

        //ICargoExport
        const schemaCargoExport = z.object({
            Company: z.array(schemaCompanyCargo),
            Incident: z.array(schemaIncidentCargo),
            Product: z.array(schemaProductCargo),
            ProductLine: z.array(schemaProductLine),
        });

        const result = schemaCargoExport.safeParse(db);
        return result.success;
    }
}

export default StorageCache;
