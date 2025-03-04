import messageHandler from '@/common/messages/message-handler';
import { getDomainWithoutSuffix, parse } from 'tldts';
import ContentScanner from '@/common/services/content-scanner';
import { IScanParameters } from '@/common/services/content-scanner.types';
import Preferences from '@/common/services/preferences';
import DOMMessenger from '@/content-scanners/helpers/dom-messenger';
import { CATWikiPageSearchResults, PagesDB } from '@/database';
import ChromeLocalStorage from '@/storage/chrome/chrome-local-storage';
import ChromeSyncStorage from '@/storage/chrome/chrome-sync-storage';
import StorageCache from '@/storage/storage-cache';

export interface IMainMessage {
    badgeText: string;
    domain: string;
    url: string;
}

export class Main {
    storageCache: StorageCache;
    pagesDatabase: PagesDB;
    contentScanner: ContentScanner;

    constructor() {
        // TODO: need a ChromeLocalStorage for pages db
        this.pagesDatabase = new PagesDB();
        this.pagesDatabase.initDefaultPages();
        this.storageCache = new StorageCache(this.pagesDatabase);
        this.contentScanner = new ContentScanner();
    }

    indicateStatus() {
        void chrome.action.setBadgeText({
            text: Preferences.isEnabled.value ? 'on' : 'off',
        });
    }

    /**
     * Display how many pages were found by updating the badge text
     */
    indicateCATPages(pages: CATWikiPageSearchResults): void {
        // Update badge text with total pages found
        void chrome.action.setBadgeText({ text: pages.totalPagesFound.toString() });
        console.log(pages);

        // Example: show a notification about the found pages
        // NOTE: Requires "notifications" permission in your manifest.json
        chrome.notifications.create({
            type: 'basic',
            iconUrl: chrome.runtime.getURL('alert.png'),
            title: 'CAT Pages Found',
            message: `Found ${pages.totalPagesFound.toString()} page(s).`,
        });
    }

    notify(message: string) {
        const notificationId = 'abc123';

        const options: chrome.notifications.NotificationOptions<true> = {
            type: 'basic',
            iconUrl: chrome.runtime.getURL('alert.png'),
            title: 'Hey',
            message,
        };

        const callback = (notificationId: string) => console.log('notificationId: ', notificationId);

        chrome.notifications.create(notificationId, options, callback);
    }

    /**
     * Called when the extension wants to change the action badge text manually.
     */
    onBadgeTextUpdate(text: string): void {
        void chrome.action.setBadgeText({ text: text });
    }

    checkDomainIsExcluded(domain: string): boolean {
        for (const excluded of Preferences.domainExclusions.value) {
            if (!parse(excluded, { allowPrivateDomains: true }).domain) {
                console.error(`Invalid domain in exclusions: ${excluded}`);
                continue;
            }
            const excludedParsed = parse(excluded, { allowPrivateDomains: true });
            if (excludedParsed.domain == domain.toLowerCase()) {
                return true;
            }
        }
        return false;
    }

    /**
     * Called when a page (tab) has finished loading.
     * Scans the domain and in-page contents, merges results,
     * and indicates how many CAT pages were found.
     */
    async onPageLoaded(unparsedDomain: string, url: string): Promise<void> {
        if (!parse(unparsedDomain, { allowPrivateDomains: true }).domain) {
            throw new Error('onPageLoaded received an invalid url');
        }
        const parsedDomain = parse(unparsedDomain, { allowPrivateDomains: true });
        const domain = parsedDomain.domain ?? '';
        console.log('Domain:', domain);

        if (this.checkDomainIsExcluded(domain)) {
            console.log('Domain skipped, was excluded');
            this.indicateStatus();
            return;
        }

        const scannerParameters: IScanParameters = {
            domain: domain.toLowerCase(),
            mainDomain: getDomainWithoutSuffix(unparsedDomain, { allowPrivateDomains: true }) ?? '',
            url: url,
            pagesDb: this.pagesDatabase,
            dom: new DOMMessenger(),
            notify: (results) => this.indicateCATPages(results),
        };

        await this.contentScanner.checkPageContents(scannerParameters);
    }

    /**
     * Called when the extension is installed.
     * Initializes default settings and indicates current status.
     */
    onBrowserExtensionInstalled(): void {
        console.log('ClintonCAT Extension Installed');
        Preferences.initDefaults(new ChromeSyncStorage(), new ChromeLocalStorage()).then(() => {
            Preferences.dump();
            this.indicateStatus();
        });
    }

    /**
     * Called when we receive a message from elsewhere in the extension
     * (e.g., content script or popup).
     */
    onBrowserExtensionMessage(
        message: IMainMessage,
        _sender: chrome.runtime.MessageSender,
        _sendResponse: VoidFunction
    ): void {
        messageHandler(message, _sender, _sendResponse);

        // TODO: refactor this to use messageHandler (with types)
        void (async () => {
            await Preferences.initDefaults(new ChromeSyncStorage(), new ChromeLocalStorage());
            Preferences.dump();

            if (message.badgeText) {
                this.onBadgeTextUpdate(message.badgeText);
            } else if (!Preferences.isEnabled.value) {
                this.indicateStatus();
            } else if (message.domain) {
                await this.onPageLoaded(message.domain, message.url);
            }
        })();
    }
}
