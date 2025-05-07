import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import classNames from 'classnames';
import sendMessage from '@/common/messages/send-message';
import Preferences from '@/common/services/preferences';
import ChromeLocalStorage from '@/storage/chrome/chrome-local-storage';
import ChromeSyncStorage from '@/storage/chrome/chrome-sync-storage';
import useEffectOnce from '@/utils/hooks/use-effect-once';
import * as styles from './Popup.module.css';
import { DOMMessengerAction } from '@/common/helpers/dom-messenger.types';

const getActiveTabDomain = (): Promise<string | undefined> => {
    return new Promise((resolve, reject) => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            const tab = tabs[0];
            if (!tab.url) {
                return reject(new Error('No active tab found or the active tab has no URL.'));
            }

            try {
                const domain = new URL(tab.url).hostname;
                resolve(domain);
            } catch {
                reject(new Error('Failed to extract domain from the URL.'));
            }
        });
    });
};

const Popup = () => {
    const [isEnabled, setIsEnabled] = useState<boolean>(false);
    const [browserNotificationsEnabled, setBrowserNotificationsEnabled] = useState<boolean>(true);
    const [pageNotificationsEnabled, setPageNotificationsEnabled] = useState<boolean>(true);

    useEffectOnce(() => {
        Preferences.initDefaults(new ChromeSyncStorage(), new ChromeLocalStorage())
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
        if (Preferences.browserNotificationsEnabled.value) {
            sendMessage('notify', { title: 'Test Notification', message: 'This is a test browser notification' }).catch(
                console.error
            );
        } else {
            console.log('Browser notifications are disabled.');
        }
    };

    const testPageNotification = () => {
        if (Preferences.pageNotificationsEnabled.value) {
            console.log('Attempting to send page notification...');
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                if (chrome.runtime.lastError) {
                    console.error(`Error querying active tab: ${chrome.runtime.lastError.message ?? 'Unknown error'}`);
                    return;
                }
                const activeTab = tabs[0];
                if (activeTab.id) {
                    const tabId = activeTab.id;

                    const messageToSend = {
                        action: DOMMessengerAction.DOM_SHOW_IN_PAGE_NOTIFICATION,
                        message: 'This is a test page notification',
                    };
                    chrome.tabs
                        .sendMessage(tabId, messageToSend)
                        .then((response) => {
                            console.log('Page notification sent successfully. Response:', response);
                        })
                        .catch((error: unknown) => {
                            if (error instanceof Error && error.message.includes('Receiving end does not exist')) {
                                console.warn(
                                    `Could not send page notification: The content script might not be running or ready on this page (${
                                        activeTab.url ?? 'URL not available'
                                    }). Error: ${error.message}`
                                );
                            } else {
                                console.error('Failed to send page notification due to an unexpected error:', error);
                            }
                        });
                } else {
                    console.error('Could not find active tab ID to send page notification.');
                }
            });
        } else {
            console.log('Page notifications are disabled.');
        }
    };

    const allowThisSite = () => {
        getActiveTabDomain()
            .then((domain) => {
                if (domain) {
                    Preferences.domainExclusions.delete(domain);
                }
            })
            .catch((error: unknown) => {
                if (error instanceof Error) {
                    console.error('Failed to allow the site:', error.message);
                    throw error;
                }
            });
    };

    const excludeThisSite = () => {
        getActiveTabDomain()
            .then((domain) => {
                if (domain) {
                    Preferences.domainExclusions.add(domain);
                }
            })
            .catch((error: unknown) => {
                if (error instanceof Error) {
                    console.error('Failed to exclude the site:', error.message);
                    throw error;
                }
            });
    };

    const openOptionsPage = () => {
        void chrome.runtime.openOptionsPage();
    };

    return (
        <div className={styles.popupContainer}>
            <p className={styles.popupTitle}>ClintonCAT</p>
            <div className={styles.divider} />
            <label className={styles.toggleLabel}>
                <span>{isEnabled ? 'Disable' : 'Enable'} ClintonCAT</span>
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
                <button className={styles.popupButton} onClick={allowThisSite}>
                    Allow this site
                </button>
                <button className={styles.popupButton} onClick={excludeThisSite}>
                    Exclude this site
                </button>
                <button className={styles.popupButton} onClick={() => testBrowserNotification()}>
                    Test Browser Notification
                </button>
                <button className={styles.popupButton} onClick={() => testPageNotification()}>
                    Test Page Notification
                </button>
                <button className={styles.popupButton} onClick={openOptionsPage}>
                    Go to Options
                </button>
            </div>
            <div className={styles.divider} />
        </div>
    );
};

const rootElement: HTMLElement | null = document.getElementById('root');
if (rootElement instanceof HTMLElement) {
    const root = createRoot(rootElement);
    root.render(
        <React.StrictMode>
            <Popup />
        </React.StrictMode>
    );
} else {
    throw Error('No root element was found');
}
