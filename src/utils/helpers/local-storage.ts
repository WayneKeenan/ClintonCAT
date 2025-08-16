/**
 * Generates a random id string
 * @param length
 */

export interface ILocalStoragePage {
    timestamp: number;
    pageId: number;
    dismissed: string;
}

class LocalStorage {
    static storageName: string = 'crw';
    public static write(data: object): boolean {
        try {
            window.localStorage.setItem(LocalStorage.storageName, JSON.stringify(data));
            return true; // Save succeeded
        } catch (err) {
            console.error(`Failed to save to localStorage:`, err);
            return false; // Save failed
        }
    }

    public static read(): Record<string, ILocalStoragePage> {
        const result: Record<string, ILocalStoragePage> = {};
        try {
            const raw = window.localStorage.getItem(LocalStorage.storageName);
            if (raw) {
                const parsed: unknown = JSON.parse(raw);
                if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
                    for (const [key, value] of Object.entries(parsed)) {
                        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                            result[key] = value as ILocalStoragePage;
                        }
                    }
                }
            }
        } catch (e) {
            // Parsing failed
            console.error('Failed parses stored data:', e);
        }
        return result;
    }

    public static readPage(pageId: number): ILocalStoragePage {
        const page: ILocalStoragePage = {
            timestamp: 0,
            pageId: pageId,
            dismissed: '',
        };

        const pages = LocalStorage.read();

        Object.assign(page, pages[pageId]);

        return page;
    }

    public static writePage(page: ILocalStoragePage) {
        const data = LocalStorage.read();

        data[page.pageId] = page;

        LocalStorage.write(data);
    }
}

export default LocalStorage;
