import { Page } from './page';

export interface ICompanyEntry {
    PageID: string;
    PageName: string;

    Description: string;
    Industry: string;
    ParentCompany: string;
    Type: string;
    Website: string;
}

export interface ICompany {
    description: string;
    industries: string[];
    parentCompany: string;
    type: string;
    websites: string[];
}

export class Company extends Page implements ICompany {
    private _description: string;
    private _industries: string[];
    private _parentCompany: string;
    private _type: string;
    private _websites: string[];

    constructor(companyEntry: ICompanyEntry) {
        super({ PageID: companyEntry.PageID, PageName: companyEntry.PageName });

        this._description = companyEntry.Description;
        this._industries = companyEntry.Industry.split(',').map((industry) => industry.trim());
        this._parentCompany = companyEntry.ParentCompany;
        this._type = companyEntry.Type;
        this._websites = companyEntry.Website.split(',').map((website) => website.trim());
    }

    get description(): string {
        return this._description;
    }

    get industries(): string[] {
        return this._industries;
    }

    get parentCompany(): string {
        return this._parentCompany;
    }

    get type(): string {
        return this._type;
    }

    get websites(): string[] {
        return this._websites;
    }
}
