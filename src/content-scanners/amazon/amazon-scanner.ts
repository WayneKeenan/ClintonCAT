import { IScanParameters } from '@/common/services/content-scanner.types';
import { BaseDomainScanner } from '../base-domain-scanner';

const COMMON_PREFIXES = new Set(['new', 'used', 'refurbished', 'certified', 'amazon', 'basics']);

const GENERIC_KEYWORDS = new Set(['product', 'details', 'store', 'ref', 'sr', 'dp', 'monitor', 'laptop', 'pc', 'tv']);

const SANITIZE_REGEX = /[^\p{L}\p{N}\s-]+/gu;

function sanitizeAndCapitalize(brand: string, isMultiWordHint = false): string {
    const sanitized = brand.replace(SANITIZE_REGEX, '').trim();

    if (isMultiWordHint && sanitized.includes(' ')) {
        return sanitized
            .split(' ')
            .filter(Boolean)
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
    } else {
        return sanitized.charAt(0).toUpperCase() + sanitized.slice(1).toLowerCase();
    }
}

class AmazonScanner extends BaseDomainScanner {
    metaInfo(): string {
        return 'amazon';
    }

    canScanContent(params: IScanParameters): boolean {
        return params.mainDomain === 'amazon';
    }

    protected getDomainKeyForSearch(params: IScanParameters): string {
        return params.mainDomain;
    }

    protected override extractEntity(url: string): string | null {
        const scannerName = this.constructor.name;
        try {
            const urlObject = new URL(url);
            const pathSegments = urlObject.pathname.split('/').filter(Boolean);

            // Store pages
            const storesIndex = pathSegments.indexOf('stores');
            if (storesIndex !== -1 && storesIndex + 1 < pathSegments.length) {
                const potentialBrandFromStore = pathSegments[storesIndex + 1];
                const decodedBrand = decodeURIComponent(potentialBrandFromStore).replace(/[_-]/g, ' ');
                const sanitizedBrand = sanitizeAndCapitalize(decodedBrand, true);
                if (sanitizedBrand && sanitizedBrand.length > 1 && !/^\d+$/.test(sanitizedBrand)) {
                    console.log(
                        `${scannerName}: Potential brand from store url: "${sanitizedBrand}" (Original: "${potentialBrandFromStore}")`
                    );
                    return sanitizedBrand;
                }
            }
            const dpIndex = pathSegments.indexOf('dp');
            if (dpIndex !== -1 && dpIndex > 0) {
                const productSegment = pathSegments[dpIndex - 1];
                const parts = productSegment.split('-');

                for (const potentialBrandFromPath of parts) {
                    const lowerCaseBrand = potentialBrandFromPath.toLowerCase();
                    if (
                        potentialBrandFromPath &&
                        potentialBrandFromPath.length > 1 &&
                        !/^\d+$/.test(potentialBrandFromPath) &&
                        !COMMON_PREFIXES.has(lowerCaseBrand) &&
                        !GENERIC_KEYWORDS.has(lowerCaseBrand)
                    ) {
                        const sanitizedBrand = sanitizeAndCapitalize(potentialBrandFromPath);
                        if (sanitizedBrand) {
                            console.log(
                                `${scannerName}: Potential brand from product url: "${sanitizedBrand}" (Original: "${potentialBrandFromPath}")`
                            );
                            return sanitizedBrand;
                        }
                    }
                }
            }

            const keywords = urlObject.searchParams.get('keywords');
            if (keywords) {
                const keywordParts = keywords.split(/[,+ ]/);
                for (const potentialBrandFromKeyword of keywordParts) {
                    const lowerCaseKeyword = potentialBrandFromKeyword.toLowerCase();
                    if (
                        potentialBrandFromKeyword &&
                        potentialBrandFromKeyword.length > 1 &&
                        !/^\d+$/.test(potentialBrandFromKeyword) &&
                        !GENERIC_KEYWORDS.has(lowerCaseKeyword) &&
                        !COMMON_PREFIXES.has(lowerCaseKeyword)
                    ) {
                        console.log(
                            `${scannerName}: Potential brand from keywords in url: "${potentialBrandFromKeyword}"`
                        );
                        return (
                            potentialBrandFromKeyword.charAt(0).toUpperCase() +
                            potentialBrandFromKeyword.slice(1).toLowerCase()
                        );
                    }
                }
            }
        } catch (error) {
            console.error(`${scannerName}: Error parsing URL:`, error);
        }

        console.log(`${scannerName}: Could not extract from URL: ${url}`);
        return null;
    }
}

export default AmazonScanner;
