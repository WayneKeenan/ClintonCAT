import { fetchJson } from "./utils.js";

export const FETCH_INTERVAL_MINUTES = 30; // Fetch every 30 minutes
export const CACHE_KEY = "cachedPagesDB";
export const CACHE_TIMESTAMP_KEY = "cachedPagesDBTimestamp";
export const FETCH_INTERVAL_MS = FETCH_INTERVAL_MINUTES * 60 * 1000;

export async function isCacheStale(epoch = Date.now()) {
    // Get the last update timestamp
    const { [CACHE_TIMESTAMP_KEY]: lastUpdated } = await chrome.storage.local.get(CACHE_TIMESTAMP_KEY);
  
    if (!lastUpdated) {
      return true;
    }
    return epoch - lastUpdated >= FETCH_INTERVAL_MS
  }
  
async function saveCache(data, timestamp = Date.now()) {
    await chrome.storage.local.set({ [CACHE_KEY]: data, [CACHE_TIMESTAMP_KEY]: timestamp });
}

// Function to fetch and cache the pages database
export async function updatePagesDB(force = false) {
    try {
        const now = Date.now();
        const needsUpdate = force || await isCacheStale(now);
        if (!needsUpdate) {
        console.log("Skipping update: Cache TTL not reached.");
        }

        console.log("Fetching updated pages database...");
        const jsonData = await fetchJson(PAGES_DB_JSON_URL);
        await saveCache(jsonData, now);

        console.log("Pages database updated successfully.");
    } catch (error) {
        console.error(`Failed to update pages database: ${error.message}`);
    }
}

// Function to get the cached pages database
export async function getCachedPagesDB() {
    const { [CACHE_KEY]: pagesDb } = await chrome.storage.local.get(CACHE_KEY);
    return pagesDb || [];
}