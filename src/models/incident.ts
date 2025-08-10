import { Page } from './page';

export interface IIncidentEntry {
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

export interface IIncident {
    company: string;
    description: string;
    endDate: Date;
    product: string;
    productLine: string;
    startDate: Date;
    status: 'Active' | 'Pending Resolution' | 'Resolved' | null;
    type: string;
}

export class Incident extends Page implements IIncident {
    private _company: string;
    private _description: string;
    private _endDate: Date;
    private _product: string;
    private _productLine: string;
    private _startDate: Date;
    private _status: 'Active' | 'Pending Resolution' | 'Resolved' | null;
    private _type: string;

    constructor(incidentEntry: IIncidentEntry) {
        super({ PageID: incidentEntry.PageID, PageName: incidentEntry.PageName });

        this._company = incidentEntry.Company;
        this._description = incidentEntry.Description;
        this._endDate = new Date(incidentEntry.EndDate);
        this._product = incidentEntry.Product;
        this._productLine = incidentEntry.ProductLine;
        this._startDate = new Date(incidentEntry.StartDate);
        this._status = ['Active', 'Pending Resolution', 'Resolved'].includes(incidentEntry.Status)
            ? (incidentEntry.Status as 'Active' | 'Pending Resolution' | 'Resolved')
            : null;
        this._type = incidentEntry.Type;
    }

    get company(): string {
        return this._company;
    }

    get description(): string {
        return this._description;
    }

    get endDate(): Date {
        return this._endDate;
    }

    get product(): string {
        return this._product;
    }

    get productLine(): string {
        return this._productLine;
    }

    get startDate(): Date {
        return this._startDate;
    }

    get status(): 'Active' | 'Pending Resolution' | 'Resolved' | null {
        return this._status;
    }

    get type(): string {
        return this._type;
    }
}
