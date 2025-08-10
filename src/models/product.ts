import { Page } from './page';

export interface IProductEntry {
    PageID: string;
    PageName: string;

    Category: string;
    Company: string;
    Description: string;
    ProductLine: string;
    Website: string;
}

export interface IProduct {
    categories: string[];
    company: string;
    description: string;
    productLine: string;
    websites: string[];
}

export class Product extends Page implements IProduct {
    private _categories: string[];
    private _company: string;
    private _description: string;
    private _productLine: string;
    private _websites: string[];

    constructor(productEntry: IProductEntry) {
        super({ PageID: productEntry.PageID, PageName: productEntry.PageName });

        this._categories = productEntry.Category.split(',').map((category) => category.trim());
        this._company = productEntry.Company;
        this._description = productEntry.Description;
        this._productLine = productEntry.ProductLine;
        this._websites = productEntry.Website.split(',').map((website) => website.trim());
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
}
