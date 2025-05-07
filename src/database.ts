import escapeRegex from '@/utils/helpers/escape-regex';
import pagesDbDefaultJson from '../data/pages_db.json'; // assert { type: 'json' };

export interface IPageEntry {
    pageId: number;
    pageTitle: string;
    popupText: string;
    category: string;
}

export class PageEntry implements IPageEntry {
    static readonly WIKI_URL: string = 'https://wiki.rossmanngroup.com/wiki/index.php?curid=';

    private _pageId: number;
    private _pageTitle: string;
    private _popupText: string;
    private _category: string;

    constructor(pageEntry: IPageEntry) {
        this._pageId = pageEntry.pageId;
        this._pageTitle = pageEntry.pageTitle;
        this._popupText = pageEntry.popupText;
        this._category = pageEntry.category;
    }

    get pageId(): number {
        return this._pageId;
    }

    set pageId(value: number) {
        this._pageId = value;
    }

    get pageTitle(): string {
        return this._pageTitle;
    }

    set pageTitle(value: string) {
        this._pageTitle = value;
    }

    get popupText(): string {
        return this._popupText;
    }

    set popupText(value: string) {
        this._popupText = value;
    }

    get category(): string {
        return this._category;
    }

    set category(value: string) {
        this._category = value;
    }

    public url(): string {
        return `${PageEntry.WIKI_URL}/${this.pageId.toString()}`;
    }
}

export class CATWikiPageSearchResults {
    private _pageEntries: IPageEntry[] = [];

    constructor(pageEntries: IPageEntry[] = []) {
        this.addPageEntries(pageEntries);
    }

    public addPageEntry(pageEntry: IPageEntry): void {
        this._pageEntries = [...this._pageEntries, new PageEntry(pageEntry)];
    }

    public addPageEntries(pageEntries: readonly IPageEntry[]): void {
        for (const pageEntry of pageEntries) {
            this.addPageEntry(pageEntry);
        }
    }

    get totalPagesFound(): number {
        return this._pageEntries.length;
    }

    get pageEntries(): readonly IPageEntry[] {
        return this._pageEntries;
    }
}

export class PagesDB {
    static readonly PAGES_DB_JSON_URL: string =
        'https://raw.githubusercontent.com/WayneKeenan/ClintonCAT/refs/heads/main/data/pages_db.json';
    private pagesList: IPageEntry[] = []; // keep another local copy.

    static readonly pagesDbDefault: IPageEntry[] = pagesDbDefaultJson;

    // load the baked in pagesdb json as an initial db, just in case...
    public initDefaultPages(): void {
        this.setPages(PagesDB.pagesDbDefault);
    }

    public getDefaultPages(): readonly IPageEntry[] {
        return PagesDB.pagesDbDefault;
    }

    public setPages(pages: IPageEntry[]) {
        // console.log('setPages', pages);
        this.pagesList = pages;
    }
    public getPagesForDomain(domain: string): CATWikiPageSearchResults {
        return this.fuzzySearch(domain);
    }

    public getPagesForCategory(categoryName: string): CATWikiPageSearchResults {
        const lowerCategoryName = categoryName.toLowerCase();
        const results = new CATWikiPageSearchResults();
        const pageEntries = this.pagesList.filter(
            (pageEntry) => pageEntry.category.toLowerCase() === lowerCategoryName
        );
        results.addPageEntries(pageEntries);
        return results;
    }

    public simpleSearch(query: string): CATWikiPageSearchResults {
        const lowerQuery = query.toLowerCase();
        const results = new CATWikiPageSearchResults();
        for (const pageEntry of this.pagesList) {
            if (pageEntry.pageTitle.toLowerCase().includes(lowerQuery)) {
                results.addPageEntry(pageEntry);
            }
        }
        return results;
    }

    public findConsecutiveWords(query: string, maxResults = 1, onlyFromStart = true): CATWikiPageSearchResults {
        if (maxResults != 1) {
            throw new Error('Unimplemented: maxResults != 1');
        }
        if (!onlyFromStart) {
            throw new Error('Unimplemented: onlyFromStart = false');
        }

        const searchWords = query.toLowerCase().split(' ');
        let maxInOrderCount = 0;
        let foundPage = null;

        for (const pageEntry of this.pagesList) {
            const titleWords = pageEntry.pageTitle.toLowerCase().split(' ');
            let thisInOrderCount = 0;
            const maxIndex = Math.min(searchWords.length, titleWords.length);

            for (let index = 0; index < maxIndex; index++) {
                if (searchWords[index] === titleWords[index]) {
                    thisInOrderCount++;
                }
            }
            if (thisInOrderCount > maxInOrderCount) {
                maxInOrderCount = thisInOrderCount;
                foundPage = pageEntry;
            }
        }
        const results = new CATWikiPageSearchResults();

        if (foundPage != null) {
            results.addPageEntry(foundPage);
        }
        return results;
    }

    public fuzzySearch(query: string, matchAllWords: boolean = false): CATWikiPageSearchResults {
        const lowerQueryWords = query.toLowerCase().split(/\s+/);
        const results = new CATWikiPageSearchResults();

        const pageEntries = this.pagesList
            .map((pageEntry) => {
                const lowerTitle = pageEntry.pageTitle.toLowerCase();
                let matchCount = 0;
                for (const word of lowerQueryWords) {
                    // Use word boundaries to reduce false positives
                    // and escape special regex characters to handle queries like "(test)".
                    const regex = new RegExp(`\\b${escapeRegex(word)}\\b`, 'i');
                    if (regex.test(lowerTitle)) {
                        matchCount++;
                    }
                }
                return { pageEntry, matchCount };
            })
            .filter(({ matchCount }) => (matchAllWords ? matchCount === lowerQueryWords.length : matchCount > 0))
            .sort((a, b) => b.matchCount - a.matchCount)
            .map(({ pageEntry }) => pageEntry);

        results.addPageEntries(pageEntries);
        return results;
    }
}
