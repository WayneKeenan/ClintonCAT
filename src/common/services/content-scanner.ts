// The 'require.context' feature depends on WebPack (@types/webpack)
const context: __WebpackModuleApi.RequireContext = require.context(
    '../../content-scanners',
    true,
    /^(?!.*base-domain-scanner\.ts$).*\.ts$/,
    'sync'
);
import DefaultScanner from '@/content-scanners/default-scanner';
import { IContentScannerPlugin, IScanParameters } from './content-scanner.types';

class ContentScanner {
    private scannerPlugins: IContentScannerPlugin[] = [];
    private defaultScannerPlugin: IContentScannerPlugin = new DefaultScanner();

    constructor() {
        this.findScannerPlugins();
    }

    public async checkPageContents(scannerParameters: IScanParameters): Promise<void> {
        for (const plugin of this.scannerPlugins) {
            try {
                // TODO: memoize the result ?
                if (plugin.canScanContent(scannerParameters)) {
                    console.log(`Plugin "${plugin.metaInfo()}" can handle request for: ${scannerParameters.domain}`);
                    // TODO: allow multiple handlers ?
                    const didFindPages = await plugin.scan(scannerParameters);
                    if (didFindPages) {
                        return;
                    }
                    console.log(`Plugin "${plugin.metaInfo()}" scanned but found no pages.`);
                    return;
                }
            } catch (error) {
                console.error(`Error executing plugin "${plugin.metaInfo() || 'Unknown Plugin'}"`, error);
            }
        }

        console.log(`No specific plugin for ${scannerParameters.domain}. Using default scanner.`);
        try {
            await this.defaultScannerPlugin.scan(scannerParameters);
        } catch (error) {
            console.error(`Error executing default scanner`, error);
        }
    }

    private findScannerPlugins(): void {
        context.keys().forEach((filename) => {
            if (filename.endsWith('/default-scanner.ts')) {
                console.log(`Skipping default scanner file in dynamic load: ${filename}`);
                return;
            }
            // The regex in require.context should handle this but just in case
            if (filename.includes('base-domain-scanner.ts')) {
                console.warn(`Skipping base scanner file that should have been excluded by regex: ${filename}`);
                return;
            }

            try {
                const moduleExports = context(filename) as Record<string, unknown>;

                const ScannerPlugin = moduleExports.default as new () => IContentScannerPlugin;

                if (typeof ScannerPlugin !== 'function') {
                    console.warn(`Skipping file: Default export is not a constructor in ${filename}`);
                    return;
                }

                const instance: IContentScannerPlugin = new ScannerPlugin();

                // More validation (just in case:)
                if (
                    typeof instance.metaInfo !== 'function' ||
                    typeof instance.canScanContent !== 'function' ||
                    typeof instance.scan !== 'function'
                ) {
                    console.warn(`Skipping file: ${filename} does not implement IContentScannerPlugin correctly.`);
                    return;
                }

                this.scannerPlugins.push(instance);
                console.log(`Successfully added scanner plugin: ${filename} (${instance.metaInfo()})`);
            } catch (error) {
                console.error(`Failed to load scanner plugin from file: ${filename}`, error);
            }
        });
    }
}

export default ContentScanner;
