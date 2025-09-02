import { IScanParameters } from '@/common/services/content-scanner.types';
import { BaseScanner, ScannerMetadata } from '../base-scanner';
import { CATWikiPageSearchResults } from '@/database';

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

class AmazonScanner extends BaseScanner {
    protected _metadata: ScannerMetadata = { name: 'Amazon Scanner' };
    private _params: IScanParameters;

    constructor(parameters: IScanParameters) {
        super();

        this._params = parameters;
    }

    canScanContent(params: IScanParameters): boolean {
        return params.mainDomain === 'amazon';
    }

    protected getDomainKeyForSearch(params: IScanParameters): string {
        return params.mainDomain;
    }

    protected extractEntity(url: string): string | null {
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

    private performSearch(
        searchFn: () => CATWikiPageSearchResults,
        description: string,
        combinedResults: CATWikiPageSearchResults,
        scannerId: string
    ): boolean {
        let found = false;
        console.log(`${scannerId}: Attempting search: ${description}`);
        try {
            const results = searchFn();
            if (results.totalPagesFound > 0) {
                console.log(`${scannerId}: Found ${results.totalPagesFound.toString()} pages via ${description}.`);
                combinedResults.addPageEntries(results.pageEntries);
                found = true;
            } else {
                console.log(`${scannerId}: No pages found via ${description}.`);
            }
        } catch (error) {
            if (
                description.includes('Consecutive Words') &&
                error instanceof Error &&
                error.message.startsWith('Unimplemented')
            ) {
                console.warn(`${scannerId}: Skipped unimplemented search feature: ${description} (${error.message})`);
            } else {
                console.error(`${scannerId}: Error during search (${description}):`, error);
            }
        }
        return found;
    }

    scan(): CATWikiPageSearchResults {
        const pagesDb = this._params.pagesDb;
        const combinedResults = new CATWikiPageSearchResults();
        const scannerId = this.metadata().name || this.constructor.name;

        console.log(`${scannerId}: Starting scan for URL: ${this._params.url}`);

        const domainSearchKey = this.getDomainKeyForSearch(this._params);
        this.performSearch(
            () => pagesDb.fuzzySearch(domainSearchKey),
            `Domain Key Fuzzy Search ('${domainSearchKey}')`,
            combinedResults,
            scannerId
        );

        const extractedEntity = this.extractEntity(this._params.url);

        if (extractedEntity) {
            console.log(`${scannerId}: Extracted entity: "${extractedEntity}"`);

            this.performSearch(
                () => pagesDb.getPagesForCategory(extractedEntity),
                `Category Match ('${extractedEntity}')`,
                combinedResults,
                scannerId
            );

            this.performSearch(
                () => pagesDb.findConsecutiveWords(extractedEntity, 1, true),
                `Consecutive Words Match ('${extractedEntity}')`,
                combinedResults,
                scannerId
            );

            this.performSearch(
                () => pagesDb.simpleSearch(extractedEntity),
                `Simple Substring Match ('${extractedEntity}')`,
                combinedResults,
                scannerId
            );

            this.performSearch(
                () => pagesDb.fuzzySearch(extractedEntity),
                `Fuzzy Word Match ('${extractedEntity}')`,
                combinedResults,
                scannerId
            );
        } else {
            console.log(`${scannerId}: No specific entity extracted from URL, skipping entity-based searches.`);
        }

        const uniquePageIds = new Set<number>();
        const uniquePageEntries = combinedResults.pageEntries.filter((entry) => {
            if (uniquePageIds.has(entry.pageId)) {
                return false;
            }
            uniquePageIds.add(entry.pageId);
            return true;
        });

        const finalResults = new CATWikiPageSearchResults(uniquePageEntries);
        const totalUniquePagesFound = finalResults.totalPagesFound;

        if (totalUniquePagesFound > 0) {
            console.log(`${scannerId}: Notifying with ${totalUniquePagesFound.toString()} unique total pages found.`);
            this._params.notify(finalResults);
        } else {
            console.log(`${scannerId}: No relevant pages found after all searches.`);
        }

        return finalResults;
    }
}

export default AmazonScanner;
