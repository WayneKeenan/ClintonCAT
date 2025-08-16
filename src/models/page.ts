export interface IPageEntry {
    PageName: string;
    PageID: string;
}

export interface IPage {
    pageId: number;
    pageName: string;
    articleType: ArticleType;
}

export enum ArticleType {
    Company = 'COMPANY',
    Incident = 'INCIDENT',
    Product = 'PRODUCT',
    ProductLine = 'PRODUCTLINE',
}

export abstract class Page {
    private static readonly BASE_WIKI_URL: string = 'https://consumerrights.wiki';

    private _pageName: string;
    private _pageId: number;
    private _articleType: ArticleType;

    constructor(data: IPage) {
        this._pageName = data.pageName;
        this._pageId = data.pageId;
        this._articleType = data.articleType;
    }

    abstract get description(): string;

    get articleType(): ArticleType {
        return this._articleType;
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

    toJSON() {
        return {
            pageId: this._pageId,
            pageName: this._pageName,
            articleType: this._articleType,
        };
    }
}
