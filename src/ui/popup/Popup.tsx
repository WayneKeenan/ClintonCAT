import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import classNames from 'classnames';
import sendMessage from '@/common/messages/send-message';
import Preferences from '@/common/services/preferences';
import BrowserLocalStorage from '@/storage/browser/browser-local-storage';
import BrowserSyncStorage from '@/storage/browser/browser-sync-storage';
import useEffectOnce from '@/utils/hooks/use-effect-once';
import * as styles from './Popup.module.css';
import { DOMMessengerAction } from '@/common/helpers/dom-messenger.types';
import browser from 'webextension-polyfill';
import { Nullable } from '@/utils/types';

const getDomainFromUrl = (url: string): Nullable<string> => {
    try {
        return new URL(url).hostname;
    } catch {
        console.error('Failed to extract domain from URL:', url);
        return null;
    }
};

// Keeping for reference, but not using it currently
const _getActiveTabDomain = async (): Promise<Nullable<string>> => {
    const tabs = await browser.tabs.query({ active: true, currentWindow: true });
    const tab = tabs[0] || null;
    if (!tab?.url) {
        console.error('Active tab has no URL');
        return null;
    }
    return getDomainFromUrl(tab.url);
};

const Popup = () => {
    const [isEnabled, setIsEnabled] = useState<Nullable<boolean>>(null);
    const [browserNotificationsEnabled, setBrowserNotificationsEnabled] = useState<Nullable<boolean>>(null);
    const [pageNotificationsEnabled, setPageNotificationsEnabled] = useState<Nullable<boolean>>(null);
    const [_currentUrl, setCurrentUrl] = useState<string | null>(null);
    const [_currentDomain, setCurrentDomain] = useState<string | null>(null);
    const [_domainsChanged, setDomainsChanged] = useState<boolean>(false);

    useEffectOnce(() => {
        Preferences.initDefaults(new BrowserSyncStorage(), new BrowserLocalStorage())
            .then(() => {
                Preferences.isEnabled.addListener('enable-options', (result: boolean) => setIsEnabled(result));
                setIsEnabled(Preferences.isEnabled.value);

                Preferences.browserNotificationsEnabled.addListener(
                    'browser-notifications-enabled-options',
                    (result: boolean) => setBrowserNotificationsEnabled(result)
                );
                setBrowserNotificationsEnabled(Preferences.browserNotificationsEnabled.value);

                Preferences.pageNotificationsEnabled.addListener(
                    'page-notifications-enabled-options',
                    (result: boolean) => setPageNotificationsEnabled(result)
                );
                setPageNotificationsEnabled(Preferences.pageNotificationsEnabled.value);
            })
            .catch((error: unknown) => console.error('Failed to initialize preferences:', error));

        return () => {
            Preferences.isEnabled.removeListener('enable-options');
            Preferences.browserNotificationsEnabled.removeListener('browser-notifications-enabled-options');
            Preferences.pageNotificationsEnabled.removeListener('page-notifications-enabled-options');
        };
    });

    useEffect(() => {
        // Effect to get the current domain when component mounts
        const fetchCurrentDomain = async () => {
            try {
                const tabs = await browser.tabs.query({ active: true, currentWindow: true });
                if (tabs[0]?.url) {
                    setCurrentUrl(tabs[0].url);
                    setCurrentDomain(getDomainFromUrl(tabs[0].url));
                }
            } catch (err) {
                console.error('Error fetching current domain:', err instanceof Error ? err.message : 'Unknown error');
            }
        };

        fetchCurrentDomain();
    }, []);

    const handleToggleEnabled = () => {
        Preferences.isEnabled.value = !Preferences.isEnabled.value;
    };

    const handleToggleBrowserNotifications = () => {
        Preferences.browserNotificationsEnabled.value = !Preferences.browserNotificationsEnabled.value;
    };

    const handleTogglePageNotifications = () => {
        Preferences.pageNotificationsEnabled.value = !Preferences.pageNotificationsEnabled.value;
    };

    const openCATPage = () => {
        // TODO:
    };

    const testBrowserNotification = () => {
        console.log('testBrowserNotification', Preferences.browserNotificationsEnabled.value);
        if (Preferences.browserNotificationsEnabled.value) {
            sendMessage('notify', { title: 'Test Notification', message: 'This is a test browser notification' }).catch(
                console.error
            );
        } else {
            console.log('Browser notifications are disabled.');
        }
    };

    const testPageNotification = async () => {
        if (Preferences.pageNotificationsEnabled.value) {
            console.log('Attempting to send page notification...');
            try {
                const tabs = await browser.tabs.query({ active: true, currentWindow: true });
                const activeTab = tabs[0];
                if (activeTab.id) {
                    const tabId = activeTab.id;

                    const messageToSend = {
                        action: DOMMessengerAction.DOM_SHOW_IN_PAGE_NOTIFICATION,
                        message: 'This is a test page notification',
                        pages: [],
                    };

                    try {
                        const response = await browser.tabs.sendMessage(tabId, messageToSend);
                        console.log('Page notification sent successfully. Response:', response);
                    } catch (error) {
                        if (error instanceof Error && error.message.includes('Receiving end does not exist')) {
                            console.warn(
                                `Could not send page notification: The content script might not be running or ready on this page (${
                                    activeTab.url ?? 'URL not available'
                                }). Error: ${error.message}`
                            );
                        } else {
                            console.error('Failed to send page notification due to an unexpected error:', error);
                        }
                    }
                } else {
                    console.error('Could not find active tab ID to send page notification.');
                }
            } catch (error) {
                console.error('Error querying tabs:', error);
            }
        } else {
            console.log('Page notifications are disabled.');
        }
    };

    const allowThisSite = async () => {
        try {
            const tabs = await browser.tabs.query({ active: true, currentWindow: true });
            if (tabs[0]?.url) {
                const domain = getDomainFromUrl(tabs[0].url);
                if (domain) {
                    Preferences.domainExclusions.delete(domain);
                }
            }
        } catch (error) {
            console.error('Failed to allow the site:', error instanceof Error ? error.message : 'Unknown error');
        }
    };

    const excludeThisSite = async () => {
        try {
            const tabs = await browser.tabs.query({ active: true, currentWindow: true });
            if (tabs[0]?.url) {
                const domain = getDomainFromUrl(tabs[0].url);
                if (domain) {
                    Preferences.domainExclusions.add(domain);
                }
            }
        } catch (error) {
            console.error('Failed to exclude the site:', error instanceof Error ? error.message : 'Unknown error');
        }
    };

    // Not currently used but keeping for reference
    const _onExcludeDomainClick = async () => {
        const newExclusions = [...Preferences.domainExclusions.value];

        try {
            const tabs = await browser.tabs.query({ active: true, currentWindow: true });
            if (!tabs[0]?.url) {
                console.error('No active tab or URL found');
                return;
            }

            const domain = getDomainFromUrl(tabs[0].url);
            if (!domain) {
                console.error('Could not extract domain from URL');
                return;
            }

            if (!newExclusions.includes(domain)) {
                newExclusions.push(domain);
                Preferences.domainExclusions.value = newExclusions;
                setDomainsChanged(true);
            }

            void browser.tabs.reload();
        } catch (error) {
            console.error(
                `Error handling exclude domain action: ${error instanceof Error ? error.message : 'Unknown error'}`
            );
        }
    };

    const goToOptions = () => {
        void browser.runtime.openOptionsPage();
    };

    if (isEnabled === null || browserNotificationsEnabled === null || pageNotificationsEnabled === null) {
        return <div></div>;
    }

    return (
        <div className={styles.popupContainer}>
            <p className={styles.popupTitle}>ClintonCAT</p>
            <div className={styles.divider} />
            <label className={styles.toggleLabel}>
                <span>ClintonCAT is {isEnabled ? 'enabled' : 'disabled'}</span>
                <input type="checkbox" checked={isEnabled} onChange={handleToggleEnabled} />
                <span className={classNames(styles.toggleSlider, { [styles.toggled]: isEnabled })} />
            </label>
            <div className={styles.divider} />
            <label className={styles.toggleLabel}>
                <span>{browserNotificationsEnabled ? 'Disable' : 'Enable'} Browser Notifications</span>
                <input
                    type="checkbox"
                    checked={browserNotificationsEnabled}
                    onChange={handleToggleBrowserNotifications}
                />
                <span className={classNames(styles.toggleSlider, { [styles.toggled]: browserNotificationsEnabled })} />
            </label>
            <div className={styles.divider} />
            <label className={styles.toggleLabel}>
                <span>{pageNotificationsEnabled ? 'Disable' : 'Enable'} Page Notifications</span>
                <input type="checkbox" checked={pageNotificationsEnabled} onChange={handleTogglePageNotifications} />
                <span className={classNames(styles.toggleSlider, { [styles.toggled]: pageNotificationsEnabled })} />
            </label>
            <div className={styles.divider} />
            <div className={styles.buttonGroup}>
                <button className={styles.popupButton} onClick={openCATPage}>
                    Open CAT page
                </button>
                <button className={styles.popupButton} onClick={() => void allowThisSite()}>
                    Allow this site
                </button>
                <button className={styles.popupButton} onClick={() => void excludeThisSite()}>
                    Exclude this site
                </button>
                <button className={styles.popupButton} onClick={() => testBrowserNotification()}>
                    Test Browser Notification
                </button>
                <button className={styles.popupButton} onClick={() => void testPageNotification()}>
                    Test Page Notification
                </button>
                <button className={styles.popupButton} onClick={goToOptions}>
                    Go to Options
                </button>
            </div>
            <div className={styles.divider} />
        </div>
    );
};

const rootElement: Nullable<HTMLElement> = document.getElementById('root');
if (!(rootElement instanceof HTMLElement)) throw Error('No root element was found');

createRoot(rootElement).render(
    <React.StrictMode>
        <Popup />
    </React.StrictMode>
);
