export interface ILocalStoragePage {
    timestamp: number;
    pageId: number;
}

/**
 *  Local Storage object for pages'
 *
 *  improved so it don't Read the page variable every time (of save)
 */
class LocalStorage {
    static storageName: string = 'crw';
    private static pages: Record<string, ILocalStoragePage>;

    /**
     *
     * @param data object o save
     * @returns
     */
    public static write(data: object): boolean {
        try {
            window.localStorage.setItem(LocalStorage.storageName, JSON.stringify(data));
            return true; // Save succeeded
        } catch (err) {
            console.error(`Failed to save to localStorage:`, err);
            return false; // Save failed
        }
    }

    /**
     * reads the object if it is not already read
     */
    public static read() {
        if (!this.pages) {
            this.pages = {};
            try {
                const raw = window.localStorage.getItem(LocalStorage.storageName);
                if (raw) {
                    const parsed: unknown = JSON.parse(raw);
                    if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
                        for (const [key, value] of Object.entries(parsed)) {
                            if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                                this.pages[key] = value as ILocalStoragePage;
                            }
                        }
                    }
                }
            } catch (e) {
                // Parsing failed
                console.error('Failed parses stored data:', e);
            }
        }
    }

    /**
     * Reads a single page given a page ID
     * @param pageId number of the page
     * @returns
     */
    public static readPage(pageId: number): ILocalStoragePage {
        const page: ILocalStoragePage = {
            timestamp: 0,
            pageId: pageId,
        };
        LocalStorage.read();

        Object.assign(page, this.pages[pageId]);

        return page;
    }

    /**
     * writs a page back to the pages object
     * @param page data of the page
     */
    public static writePage(page: ILocalStoragePage) {
        LocalStorage.read();

        this.pages[page.pageId] = page;
    }

    /**
     * saves the data to local storage
     */
    public static save() {
        LocalStorage.write(this.pages);
    }
}

export default LocalStorage;
