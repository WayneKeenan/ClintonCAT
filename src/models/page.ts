export interface IPageEntry {
    PageName: string;
    PageID: string;
}

export interface IPage {
    pageName: string;
    pageId: number;
}

export class Page implements IPage {
    private static readonly BASE_WIKI_URL: string = 'https://consumerrights.wiki';

    private _pageName: string;
    private _pageId: number;

    constructor(pageEntry: IPageEntry) {
        this._pageName = pageEntry.PageName;
        this._pageId = Number(pageEntry.PageID);
    }

    get pageName(): string {
        return this._pageName;
    }

    get pageId(): number {
        return this._pageId;
    }

    public url(): string {
        return `${Page.BASE_WIKI_URL}/index.php?curid=${this.pageId.toString()}`;
    }
}
