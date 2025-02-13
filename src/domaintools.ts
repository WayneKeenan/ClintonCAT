export class DomainTools {
    private suffixDB: string[] = [];
    private static SUFFIX_LIST_URL = 'https://publicsuffix.org/list/public_suffix_list.dat';

    constructor() {
        this.loadSuffixList().then(() => console.log('Public Suffix list loaded'));
    }

    private async fetchSuffixList(url: string): Promise<string> {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${String(response.status)}`);
            }
            return await response.text();
        } catch (error) {
            if (error instanceof Error) {
                console.error(`Failed to fetch public suffix list: ${error.message}`);
            } else {
                console.error(`Failed to fetch public suffix list:`, error);
            }
            throw error;
        }
    }

    private processSuffixList(text: string): void {
        this.suffixDB = text.split('\n').filter((line) => line.trim() && !line.startsWith('//'));
    }

    private async loadSuffixList(): Promise<void> {
        try {
            const text = await this.fetchSuffixList(DomainTools.SUFFIX_LIST_URL);
            this.processSuffixList(text);
        } catch (error) {
            console.error('Error loading public suffix list:', error);
        }
    }

    async extractMainDomain(hostname: string): Promise<string> {
        if (this.suffixDB.length === 0) {
            await this.loadSuffixList();
        }

        const cleanHostname = hostname.replace(/^www\./, '');
        const parts = cleanHostname.split('.');

        for (let i = 1; i < parts.length; i++) {
            const potentialTLD = parts.slice(i).join('.');
            if (this.suffixDB.includes(potentialTLD)) {
                return parts.slice(0, i).join('.');
            }
        }

        return parts.length > 1 ? parts[parts.length - 2] : parts[0];
    }

    isDomainExcluded(exclusions: string[], domain: string): boolean {
        return exclusions.some((excludedDomain: string) => domain.includes(excludedDomain));
    }
}
