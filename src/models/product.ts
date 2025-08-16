import { ArticleType, Page } from '@/models/page';

export interface IProductCargo {
    PageID: string;
    PageName: string;

    Category: string;
    Company: string;
    Description: string;
    ProductLine: string;
    Website: string;
}

export interface IProductPage {
    pageId: number;
    pageName: string;
    articleType: ArticleType;
    categories: string[];
    company: string;
    description: string;
    productLine: string;
    websites: string[];
}

export class ProductPage extends Page implements IProductPage {
    private _categories: string[];
    private _company: string;
    private _description: string;
    private _productLine: string;
    private _websites: string[];

    constructor(data: IProductPage) {
        super({ pageId: data.pageId, pageName: data.pageName, articleType: data.articleType });
        this._categories = data.categories;
        this._company = data.company;
        this._description = data.description;
        this._productLine = data.productLine;
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

    get productLine(): string {
        return this._productLine;
    }

    get websites(): string[] {
        return this._websites;
    }

    static fromCargoExport(data: IProductCargo): ProductPage {
        return new ProductPage({
            pageId: Number(data.PageID),
            pageName: data.PageName,
            articleType: ArticleType.Product,
            categories: data.Category.split(',').map((category) => category.trim()),
            company: data.Company,
            description: data.Description,
            productLine: data.ProductLine,
            websites: data.Website.split(',').map((website) => website.trim()),
        });
    }

    static fromJSON(data: IProductPage): ProductPage {
        return new ProductPage(data);
    }

    toJSON() {
        return {
            ...super.toJSON(),
            categories: this._categories,
            company: this._company,
            description: this._description,
            productLine: this._productLine,
            websites: this._websites,
        };
    }
}
