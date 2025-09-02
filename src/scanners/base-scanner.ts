import { CATWikiPageSearchResults } from '@/database';

export interface ScannerMetadata {
    name: string;
}

export abstract class BaseScanner {
    protected abstract _metadata: ScannerMetadata;

    abstract scan(): CATWikiPageSearchResults;

    metadata(): ScannerMetadata {
        return this._metadata;
    }
}
