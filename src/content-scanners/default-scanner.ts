import { IScanParameters } from '@/common/services/content-scanner.types';
import { BaseDomainScanner } from './base-domain-scanner';

class DefaultScanner extends BaseDomainScanner {
    metaInfo(): string {
        return 'default scanner';
    }

    canScanContent(_params: IScanParameters): boolean {
        return false;
    }

    protected getDomainKeyForSearch(params: IScanParameters): string {
        return params.mainDomain;
    }

    async scan(params: IScanParameters): Promise<boolean> {
        const foundPagesViaBaseScan = await super.scan(params);

        console.log(`Default Scanner: Base scan found pages: ${String(foundPagesViaBaseScan)}`);

        // TODO: More default scanning logic
        return true;
    }
}

export default DefaultScanner;
