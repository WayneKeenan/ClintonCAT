import { IContentScannerPlugin, IScanParameters } from '@/common/services/content-scanner.types';
import { CATWikiPageSearchResults } from '@/database';

class AmazonUSScanner implements IContentScannerPlugin {
    metaInfo(): string {
        return 'amazon.com';
    }

    canScanContent(_params: IScanParameters): boolean {
        return false; // just a skeleton placeholder, as an example, for now
        // return params.mainDomain === 'amazon' && params.domain.endsWith('com');
    }

    // eslint-disable-next-line @typescript-eslint/require-await
    async scan(params: IScanParameters): Promise<boolean> {
        console.log(`Amazon US Scanner: ${params.domain} - ${params.mainDomain}`);
        const pageResults = new CATWikiPageSearchResults();

        const domainResults = params.pagesDb.getPagesForDomain(params.domain);
        pageResults.addPageEntries(domainResults.pageEntries);

        params.notify(pageResults);
        return pageResults.totalPagesFound > 0;
    }
}

export default AmazonUSScanner;
