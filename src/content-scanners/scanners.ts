import { IContentScannerPlugin } from '@/common/services/content-scanner.types';
import AmazonUKScanner from '@/content-scanners/amazon/amazon-uk.scanner';
import AmazonUSScanner from '@/content-scanners/amazon/amazon-us.scanner';

const scanners: Record<string, new () => IContentScannerPlugin> = {
    AmazonUKScanner,
    AmazonUSScanner,
};

export default scanners;
