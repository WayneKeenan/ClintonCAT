import { Page } from './page';

export interface IProductLineEntry {
    PageID: string;
    PageName: string;

    Category: string;
    Company: string;
    Description: string;
    Website: string;
}

export interface IProductLine {
    categories: string[];
    company: string;
    description: string;
    websites: string[];
}

export class ProductLine extends Page implements IProductLine {
    private _categories: string[];
    private _company: string;
    private _description: string;
    private _websites: string[];

    constructor(entry: IProductLineEntry) {
        super({ PageID: entry.PageID, PageName: entry.PageName });

        this._categories = entry.Category.split(',').map((category) => category.trim());
        this._company = entry.Company;
        this._description = entry.Description;
        this._websites = entry.Website.split(',').map((website) => website.trim());
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
}
