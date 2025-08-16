import { ArticleType, Page } from '@/models/page';

export interface ICompanyCargo {
    PageID: string;
    PageName: string;

    Description: string;
    Industry: string;
    ParentCompany: string;
    Type: string;
    Website: string;
}

export interface ICompanyPage {
    pageId: number;
    pageName: string;
    articleType: ArticleType;
    description: string;
    industries: string[];
    parentCompany: string;
    type: string;
    websites: string[];
}

export class CompanyPage extends Page implements ICompanyPage {
    private _description: string;
    private _industries: string[];
    private _parentCompany: string;
    private _type: string;
    private _websites: string[];

    constructor(data: ICompanyPage) {
        super({ pageId: data.pageId, pageName: data.pageName, articleType: data.articleType });
        this._description = data.description;
        this._industries = data.industries;
        this._parentCompany = data.parentCompany;
        this._type = data.type;
        this._websites = data.websites;
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

    static fromCargoExport(data: ICompanyCargo): CompanyPage {
        return new CompanyPage({
            pageId: Number(data.PageID),
            pageName: data.PageName,
            articleType: ArticleType.Company,
            description: data.Description,
            industries: data.Industry.split(',').map((industry) => industry.trim()),
            parentCompany: data.ParentCompany,
            type: data.Type,
            websites: data.Website.split(',').map((website) => website.trim()),
        });
    }

    static fromJSON(data: ICompanyPage): CompanyPage {
        return new CompanyPage(data);
    }

    toJSON() {
        return {
            ...super.toJSON(),
            description: this._description,
            industries: this._industries,
            parentCompany: this._parentCompany,
            type: this._type,
            websites: this._websites,
        };
    }
}
