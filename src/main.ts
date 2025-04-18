import messageHandler from '@/common/messages/message-handler';
import { getDomainWithoutSuffix, parse } from 'tldts';
import ContentScanner from '@/common/services/content-scanner';
import { IScanParameters } from '@/common/services/content-scanner.types';
import Preferences from '@/common/services/preferences';
import DOMMessenger from '@/common/helpers/dom-messenger';
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
        const totalPages = pages.totalPagesFound;
        console.log(pages);

        if (totalPages > 0) {
            // Update badge text with total pages found
            void chrome.action.setBadgeText({ text: pages.totalPagesFound.toString() });
            // Example: show a notification about the found pages
            // NOTE: Requires "notifications" permission in your manifest.json
            let plurality = totalPages > 1 ? 's' : '';
            chrome.notifications.create({
                type: 'basic',
                iconUrl: chrome.runtime.getURL('alert.png'),
                title: `CAT Page${plurality} Found`,
                message: `Found ${totalPages.toString()} page${plurality}.`,
            });
            // Displays a popup on webpage your visiting instead of OS notification
            // Example: show a warning to users on the site is known for anti-consumer behaviors
            // NOTE: Requires "scripting" & "activeTab" permission in your manifest.json
            chrome.tabs
                .query({ active: true, currentWindow: true })
                .then((output) => {
                    return output[0];
                })
                .then((win: any) => {
                    chrome.storage.local.set({ results: totalPages.toString() });
                    chrome.scripting.executeScript({
                        target: { tabId: win.id },
                        func: () => {
                            chrome.storage.local.get('results').then((pair) => {
                                let plurality = pair.results > 1 ? 's' : '';
                                document.body.innerHTML +=
                                    "<div id='CRW' style='position: fixed; top: 0px; right: 0px; background: black; color: white; font-family: Roboto; z-index: 1000000; text-align: center; max-width: 50vw; padding: 4vmin; border-radius: 3vmin; line-height: 1;'>\
                            <button style='position:absolute; top: 1vmin; right: 1vmin; background: inherit; color: inherit; font-size: 1.3em' onclick=document.getElementById('CRW').remove()> X </button>\
                            <h1 style='position: relative; top: 2vmin; color: inherit; font-size: 2em; font-weight: 600; margin-bottom: 0.8em'> CAT Page" +
                                    plurality +
                                    " Found </h1>\
                            <p style='color: inherit; font-size: 1.5em; margin: 0'> Found " +
                                    pair.results +
                                    ' page' +
                                    plurality +
                                    ' </p>\
                            </div>\n';
                            });
                        },
                    });
                });
        } else {
            // Revert badge text back to "on" or "off" as set by indicateStatus
            this.indicateStatus();
        }
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
        // Diabling this currently doesn't do squat (and will confuse others besides me)
        // messageHandler(message, _sender, _sendResponse);

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
