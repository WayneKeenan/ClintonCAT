import messageHandler from '@/common/messages/message-handler';
import { getDomainWithoutSuffix, parse } from 'tldts';
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
import { Page } from './models/page';

import NotificationsFilter, { INotificationsFilter } from './utils/helpers/notification-filter';
import { IInPageNotificationOptions } from '@/ui/inpagenotification/Inspagenotification';
import { ScannerFactory } from './common/services/scanner';

export interface IMainMessage {
    badgeText: string;
    domain: string;
    url: string;
}

export class Main {
    storageCache: StorageCache;
    pagesDatabase: PagesDB;
    scannerFactory: ScannerFactory;

    constructor() {
        // TODO: need a BrowserLocalStorage for pages db
        this.pagesDatabase = new PagesDB();
        this.pagesDatabase.initDefaultPages();
        this.storageCache = new StorageCache(this.pagesDatabase);
        this.scannerFactory = new ScannerFactory();
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
        Promise.all([
            Preferences.getPreference(Preferences.IS_ENABLED_KEY),
            Preferences.getPreference(Preferences.BROWSER_NOTIFICATIONS_ENABLED_KEY),
            Preferences.getPreference(Preferences.PAGE_NOTIFICATIONS_ENABLED_KEY),
            Preferences.getPreference(Preferences.PAGE_NOTIFICATIONS_SHOWMORE_KEY),
            Preferences.getPreference(Preferences.PAGE_NOTIFICATIONS_SHOWMUTE_KEY),
            Preferences.getPreference(Preferences.PAGE_NOTIFICATIONS_SHOWHIDE_KEY),
            Preferences.getPreference(Preferences.PAGE_NOTIFICATIONS_AUTOHIDETIME_KEY),
            Preferences.getPreference(Preferences.PAGE_NOTIFICATIONS_DISMISSTIME_KEY),
            NotificationsFilter.get(),
        ])
            .then(
                ([
                    isEnabled,
                    browserNotificationsEnabled,
                    pageNotificationsEnabled,
                    pageNotificationsShowMore,
                    pageNotificationsShowMute,
                    pageNotificationsShowHide,
                    pageNotificationsAutoHideTime,
                    pageNotificationsDismissTime,
                    filters,
                ]) => {
                    if (isEnabled) {
                        const options: IInPageNotificationOptions = {
                            showMore: pageNotificationsShowMore as boolean,
                            showMute: pageNotificationsShowMute as boolean,
                            showHide: pageNotificationsShowHide as boolean,
                            autoHideTime: (pageNotificationsAutoHideTime as number) * 1000,
                        };

                        let pageEntries = pages.pageEntries;
                        pageEntries = NotificationsFilter.filterPages(
                            pageEntries,
                            filters,
                            (pageNotificationsDismissTime as number) * 60 * 60 * 1000
                        );

                        const totalPages = pageEntries.length;
                        console.log('pageEntries', pages.pageEntries, pageEntries);
                        if (totalPages > 0) {
                            this.onBadgeTextUpdate(totalPages.toString(), domMessenger);

                            if (browserNotificationsEnabled) {
                                // Example: show a notification about the found pages
                                // NOTE: Requires "notifications" permission in your manifest.json
                                void browser.notifications.create({
                                    type: 'basic',
                                    iconUrl: browser.runtime.getURL('alert.png'),
                                    title: 'CAT Pages Found',
                                    message: `Found ${totalPages.toString()} page(s).`,
                                });
                            }

                            if (pageNotificationsEnabled) {
                                const message = `Found ${totalPages.toString()} CAT page(s).`;
                                const entries: Page[] = [];
                                pageEntries.forEach((page) => {
                                    entries.push(page);
                                });

                                domMessenger
                                    .showInPageNotification(message, entries, options)
                                    .then(() => console.log('In-page notification shown.'))
                                    .catch((error: unknown) => {
                                        if (
                                            error instanceof Error &&
                                            error.message.includes('Receiving end does not exist')
                                        ) {
                                            console.warn(
                                                `Failed to send in-page notification (tab might be inactive or closed/navigated away before message was sent): ${error.message}`
                                            );
                                        } else {
                                            console.error(
                                                'Failed to show in-page notification due to unexpected error:',
                                                error
                                            );
                                        }
                                    });
                            }
                        } else {
                            // Revert badge text back to "on" or "off" as set by indicateStatus
                            console.log('Resetting badge text');
                            this.indicateStatus();
                        }
                    }
                }
            )
            .catch((error: unknown) => console.error('Failed to get preferences to send in-page notification:', error));
    }

    notify(message: string) {
        Preferences.getPreference(Preferences.BROWSER_NOTIFICATIONS_ENABLED_KEY)
            .then((browserNotificationsEnabled) => {
                if (browserNotificationsEnabled) {
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
            })
            .catch((error: unknown) => console.error('Failed to get preferences to send browser notification:', error));
    }

    /**
     * Called when the extension wants to change the action badge text manually.
     */
    onBadgeTextUpdate(text: string, domMessenger: IDOMMessengerInterface): void {
        // Update badge text with total pages found
        domMessenger
            .setBadgeText(text)
            .then(() => console.log('Badge text set...'))
            .catch((error: unknown) => {
                console.error('Failed to set badge text due to an unexpected error:', error);
            });
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
    onPageLoaded(unparsedDomain: string, url: string): void {
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

        const scanner = this.scannerFactory.getScanner(scannerParameters);
        const results = scanner.scan();
        this.indicateCATPages(results, domMessenger);
    }

    /**
     * Called when a page (tab) has finished loading.
     * Scans the domain and in-page contents, merges results,
     * and indicates how many CAT pages were found.
     */
    onNotifyUpdate(pageId: number, action: string) {
        const page: INotificationsFilter = {
            timestamp: 0,
            pageId: pageId,
            revision: 0,
        };
        if (action == 'mute') {
            page.timestamp = Date.now();
        }

        // TODO: to be changed to a "revision based dismiss" curently just pernanentm type may need to be changed to a string instead of a number
        if (action == 'hide') {
            page.revision = pageId;
        }
        NotificationsFilter.update(page);
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
