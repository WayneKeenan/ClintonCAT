import { parse } from 'tldts';

import { CATWikiPageSearchResults, PagesDB } from '@/database';

import { BaseScanner, ScannerMetadata } from './base-scanner';

export interface UrlScannerParameters {
    url: URL;
    pagesDb: PagesDB;
}

export class UrlScanner extends BaseScanner {
    _metadata: ScannerMetadata = {
        name: 'URL Scanner',
    };

    url: URL;
    pagesDb: PagesDB;

    constructor(parameters: UrlScannerParameters) {
        super();

        this.url = parameters.url;
        this.pagesDb = parameters.pagesDb;
    }

    scan(): CATWikiPageSearchResults {
        const results = new CATWikiPageSearchResults();

        results.addPageEntries(
            this.pagesDb.companyPages.filter((companyPage) => {
                return companyPage.websites.some((website) => {
                    try {
                        const websiteUrl = new URL(website);
                        return parse(websiteUrl.toString()).domain === parse(this.url.toString()).domain;
                    } catch (err) {
                        if (typeof err === 'string') {
                            console.error(err);
                        } else if (err instanceof Error) {
                            console.error(err.message);
                        }
                        return false;
                    }
                });
            })
        );

        return results;
    }
}
