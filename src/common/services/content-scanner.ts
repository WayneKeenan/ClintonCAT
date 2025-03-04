import DefaultScanner from '@/content-scanners/default-scanner';
import objectKeys from '@/utils/helpers/object-keys';
import scanners from '@/content-scanners/scanners';
import { IContentScannerPlugin, IScanParameters } from './content-scanner.types';

class ContentScanner {
    private scannerPlugins: IContentScannerPlugin[] = [];
    private defaultScannerPlugin: IContentScannerPlugin = new DefaultScanner();

    constructor() {
        this.findScannerPlugins();
    }

    public async checkPageContents(scannerParameters: IScanParameters): Promise<void> {
        for (const plugin of this.scannerPlugins) {
            // TODO: memoize the result ?
            if (plugin.canScanContent(scannerParameters)) {
                console.log(`Found a plugin that can handle request: ${scannerParameters.domain}`);
                // TODO: allow multiple handlers ?
                const didFindPages = await plugin.scan(scannerParameters);
                if (didFindPages) return;
            }
        }
        console.log('Using default content scanner');
        await this.defaultScannerPlugin.scan(scannerParameters);
    }

    private findScannerPlugins(): void {
        objectKeys(scanners).forEach((key) => {
            const Class = scanners[key];
            const obj: IContentScannerPlugin = new Class();
            this.scannerPlugins.push(obj);
            console.log('Added content scanner plugin: ', key, ' metainfo: ', obj.metaInfo());
        });
    }
}

export default ContentScanner;
