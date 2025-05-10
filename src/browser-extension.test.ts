import puppeteer, { TargetType } from 'puppeteer';
import path from 'path';

// see: https://pptr.dev/guides/chrome-extensions

const pathToExtension = path.resolve(__dirname, '../dist');

test(
    'should load Chrome Extension popup',
    async () => {
        const puppeteerBrowser = await puppeteer.launch({
            args: [
                `--disable-extensions-except=${pathToExtension}`,
                `--load-extension=${pathToExtension}`,
                '--no-sandbox',
                '--disable-setuid-sandbox',
            ],
        });

        const workerTarget = await puppeteerBrowser.waitForTarget(
            // Assumes that there is only one service worker created by the extension and its URL ends with background.js.
            (target) => target.type() === TargetType.SERVICE_WORKER && target.url().endsWith('background.js')
        );

        const worker = await workerTarget.worker();

        if (!worker) {
            throw new Error(`Unable to obtain extension worker`);
        }

        // Open a popup (available for Canary channels).
        await worker.evaluate('chrome.action.openPopup();');

        const popupTarget = await puppeteerBrowser.waitForTarget(
            // Assumes that there is only one page with the URL ending with popup.html and that is the popup created by the extension.
            (target) => target.type() === TargetType.PAGE && target.url().endsWith('popup.html')
        );

        const popupPage = await popupTarget.asPage();

        // Test the popup page .
        const title = await popupPage.title();
        expect(title).toBe('ClintonCAT');

        // TODO: other tests

        await puppeteerBrowser.close();
    },
    30 * 1000
);
