import suffixDbDefaultJson from '../data/suffix_db.json';

export class DomainTools {
    private suffixDB: string[] = [];
    static readonly suffixDbDefault: string[] = suffixDbDefaultJson;

    constructor() {
        this.initDefaultSuffixList();
        console.log('Public Suffix list loaded');
    }

    private initDefaultSuffixList(): void {
        if (DomainTools.suffixDbDefault.length === 0) {
            console.error(
                "Error: Suffix database is empty. Please run '../scripts/utils/tld2json.py' to generate the required JSON file."
            );
            return;
        }
        this.suffixDB = DomainTools.suffixDbDefault;
    }

    extractMainDomain(hostname: string): string {
        if (this.suffixDB.length === 0) {
            this.initDefaultSuffixList();
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
