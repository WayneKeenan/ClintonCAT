import messageHandler from '@/common/messages/message-handler';
import { getDomainWithoutSuffix, parse } from 'tldts';
import ContentScanner from '@/common/services/content-scanner';
import { IScanParameters } from '@/common/services/content-scanner.types';
import Preferences from '@/common/services/preferences';
import DOMMessenger from '@/common/helpers/dom-messenger';
import { CATWikiPageSearchResults, PagesDB } from '@/database';
import BrowserLocalStorage from '@/storage/browser/browser-local-storage';
import BrowserSyncStorage from '@/storage/browser/browser-sync-storage';
import StorageCache from '@/storage/storage-cache';
import { IDOMMessengerInterface } from './common/helpers/dom-messenger.types';
import { MessageHandlerContext } from '@/common/messages/messages.types';
import browser from 'webextension-polyfill';

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
        // TODO: need a BrowserLocalStorage for pages db
        this.pagesDatabase = new PagesDB();
        this.pagesDatabase.initDefaultPages();
        this.storageCache = new StorageCache(this.pagesDatabase);
        this.contentScanner = new ContentScanner();
    }

    indicateStatus() {
        void browser.action.setBadgeText({
            text: Preferences.isEnabled.value ? 'on' : 'off',
        });
    }

    /**
     * Display how many pages were found by updating the badge text
     */
    indicateCATPages(pages: CATWikiPageSearchResults, domMessenger: IDOMMessengerInterface): void {
        const totalPages = pages.totalPagesFound;
        console.log(pages);

        if (totalPages > 0) {
            // Update badge text with total pages found
            void browser.action.setBadgeText({ text: pages.totalPagesFound.toString() });

            if (Preferences.browserNotificationsEnabled.value) {
                // Example: show a notification about the found pages
                // NOTE: Requires "notifications" permission in your manifest.json
                void browser.notifications.create({
                    type: 'basic',
                    iconUrl: browser.runtime.getURL('alert.png'),
                    title: 'CAT Pages Found',
                    message: `Found ${pages.totalPagesFound.toString()} page(s).`,
                });
            }
            if (Preferences.pageNotificationsEnabled.value) {
                const message = `Found ${pages.totalPagesFound.toString()} CAT page(s).`;
                domMessenger
                    .showInPageNotification(message)
                    .then(() => console.log('In-page notification shown.'))
                    .catch((error: unknown) => {
                        if (error instanceof Error && error.message.includes('Receiving end does not exist')) {
                            console.warn(
                                `Failed to send in-page notification (tab might be inactive or closed/navigated away before message was sent): ${error.message}`
                            );
                        } else {
                            console.error('Failed to show in-page notification due to unexpected error:', error);
                        }
                    });
            }
        } else {
            // Revert badge text back to "on" or "off" as set by indicateStatus
            this.indicateStatus();
        }
    }

    notify(message: string) {
        if (Preferences.browserNotificationsEnabled.value) {
            const notificationId = 'abc123';
            const options: browser.Notifications.CreateNotificationOptions = {
                type: 'basic',
                iconUrl: browser.runtime.getURL('alert.png'),
                title: 'Hey',
                message,
            };

            void browser.notifications.create(notificationId, options);
        } else {
            console.log('Browser notifications are disabled. Skipping notification.');
        }
    }

    /**
     * Called when the extension wants to change the action badge text manually.
     */
    onBadgeTextUpdate(text: string): void {
        void browser.action.setBadgeText({ text: text });
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

        const domMessenger = new DOMMessenger();
        const scannerParameters: IScanParameters = {
            domain: domain.toLowerCase(),
            mainDomain: getDomainWithoutSuffix(unparsedDomain, { allowPrivateDomains: true }) ?? '',
            url: url,
            pagesDb: this.pagesDatabase,
            dom: new DOMMessenger(),
            notify: (results) => this.indicateCATPages(results, domMessenger),
        };

        await this.contentScanner.checkPageContents(scannerParameters);
    }

    /**
     * Called when the extension is installed.
     * Initializes default settings and indicates current status.
     */
    onBrowserExtensionInstalled(): void {
        console.log('ClintonCAT Extension Installed');
        Preferences.initDefaults(new BrowserSyncStorage(), new BrowserLocalStorage()).then(() => {
            Preferences.dump();
            this.indicateStatus();
        });
    }

    /**
     * Called when we receive a message from elsewhere in the extension
     * (e.g., content script or popup).
     */
    onBrowserExtensionMessage(
        message: unknown,
        sender: browser.Runtime.MessageSender,
        sendResponse: (response: unknown) => void
    ): boolean {
        console.log('onBrowserExtensionMessage', message, sender, sendResponse);
        const context: MessageHandlerContext = { main: this };
        const isAsync = messageHandler(message, sender, sendResponse, context);
        return isAsync;
    }
}
