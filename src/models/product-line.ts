import { ArticleType, Page } from '@/models/page';

export interface IProductLineCargo {
    PageID: string;
    PageName: string;

    Category: string;
    Company: string;
    Description: string;
    Website: string;
}

export interface IProductLinePage {
    pageId: number;
    pageName: string;
    articleType: ArticleType;
    categories: string[];
    company: string;
    description: string;
    websites: string[];
}

export class ProductLinePage extends Page implements IProductLinePage {
    private _categories: string[];
    private _company: string;
    private _description: string;
    private _websites: string[];

    constructor(data: IProductLinePage) {
        super({ pageId: data.pageId, pageName: data.pageName, articleType: data.articleType });
        this._categories = data.categories;
        this._company = data.company;
        this._description = data.description;
        this._websites = data.websites;
    }

    get categories(): string[] {
        return this._categories;
    }

    get company(): string {
        return this._company;
    }

    get description(): string {
        return this._description;
    }

    get websites(): string[] {
        return this._websites;
    }

    static fromCargoExport(data: IProductLineCargo): ProductLinePage {
        return new ProductLinePage({
            pageId: Number(data.PageID),
            pageName: data.PageName,
            articleType: ArticleType.ProductLine,
            categories: data.Category.split(',').map((category) => category.trim()),
            company: data.Company,
            description: data.Description,
            websites: data.Website.split(',').map((website) => website.trim()),
        });
    }

    static fromJSON(data: IProductLinePage): ProductLinePage {
        return new ProductLinePage(data);
    }

    toJSON() {
        return {
            ...super.toJSON(),
            categories: this._categories,
            company: this._company,
            description: this._description,
            websites: this._websites,
        };
    }
}
