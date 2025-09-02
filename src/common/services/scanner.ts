import { IScanParameters } from '@/common/services/content-scanner.types';
import { UrlScanner } from '@/scanners/url-scanner';
import AmazonScanner from '@/scanners/amazon/amazon-scanner';

const amazonProductPageRegex = /^https?:\/\/(www\.)?amazon\.[a-z.]+\/.+\/dp\/[A-Z0-9]{10}(?:[/?].*)?$/i;

export class ScannerFactory {
    getScanner(parameters: IScanParameters) {
        if (amazonProductPageRegex.test(parameters.url)) {
            return new AmazonScanner(parameters);
        }

        return new UrlScanner({
            url: new URL(parameters.url),
            pagesDb: parameters.pagesDb,
        });
    }
}
