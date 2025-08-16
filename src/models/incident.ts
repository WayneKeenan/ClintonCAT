import { ArticleType, Page } from '@/models/page';

export interface IIncidentCargo {
    PageID: string;
    PageName: string;

    Company: string;
    Description: string;
    EndDate: string;
    Product: string;
    ProductLine: string;
    StartDate: string;
    Status: string;
    Type: string;
}

export interface IIncidentPage {
    pageId: number;
    pageName: string;
    articleType: ArticleType;
    company: string;
    description: string;
    endDate: Date | null;
    product: string;
    productLine: string;
    startDate: Date | null;
    status: 'Active' | 'Pending Resolution' | 'Resolved' | null;
    type: string;
}

export class IncidentPage extends Page implements IIncidentPage {
    private _company: string;
    private _description: string;
    private _endDate: Date | null;
    private _product: string;
    private _productLine: string;
    private _startDate: Date | null;
    private _status: 'Active' | 'Pending Resolution' | 'Resolved' | null;
    private _type: string;

    constructor(data: IIncidentPage) {
        super({ pageId: data.pageId, pageName: data.pageName, articleType: data.articleType });
        this._company = data.company;
        this._description = data.description;
        this._endDate = data.endDate;
        this._product = data.product;
        this._productLine = data.productLine;
        this._startDate = data.startDate;
        this._status = data.status;
        this._type = data.type;
    }

    get company(): string {
        return this._company;
    }

    get description(): string {
        return this._description;
    }

    get endDate(): Date | null {
        return this._endDate;
    }

    get product(): string {
        return this._product;
    }

    get productLine(): string {
        return this._productLine;
    }

    get startDate(): Date | null {
        return this._startDate;
    }

    get status(): 'Active' | 'Pending Resolution' | 'Resolved' | null {
        return this._status;
    }

    get type(): string {
        return this._type;
    }

    static fromCargoExport(data: IIncidentCargo): IncidentPage {
        return new IncidentPage({
            pageId: Number(data.PageID),
            pageName: data.PageName,
            articleType: ArticleType.Incident,
            company: data.Company,
            description: data.Description,
            endDate: !isNaN(Date.parse(data.EndDate)) ? new Date(data.EndDate) : null,
            product: data.Product,
            productLine: data.ProductLine,
            startDate: !isNaN(Date.parse(data.StartDate)) ? new Date(data.StartDate) : null,
            status: ['Active', 'Pending Resolution', 'Resolved'].includes(data.Status)
                ? (data.Status as 'Active' | 'Pending Resolution' | 'Resolved')
                : null,
            type: data.Type,
        });
    }

    static fromJSON(data: IIncidentPage): IncidentPage {
        return new IncidentPage(data);
    }

    toJSON() {
        return {
            ...super.toJSON(),
            company: this._company,
            description: this._description,
            endDate: this._endDate,
            product: this._product,
            productLine: this._productLine,
            startDate: this._startDate,
            status: this._status,
            type: this._type,
        };
    }
}
