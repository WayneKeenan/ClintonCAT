import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import classNames from 'classnames';
import sendMessage from '@/common/messages/send-message';
import Preferences from '@/common/services/preferences';
import ChromeLocalStorage from '@/storage/chrome/chrome-local-storage';
import ChromeSyncStorage from '@/storage/chrome/chrome-sync-storage';
import useEffectOnce from '@/utils/hooks/use-effect-once';
import * as styles from './Popup.module.css';

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

    useEffectOnce(() => {
        Preferences.initDefaults(new ChromeSyncStorage(), new ChromeLocalStorage())
            .then(() => {
                Preferences.isEnabled.addListener('enable-options', (result: boolean) => setIsEnabled(result));
                setIsEnabled(Preferences.isEnabled.value);
            })
            .catch((error: unknown) => console.error('Failed to initialize preferences:', error));

        return () => Preferences.isEnabled.removeListener('enable-options');
    });

    const handleToggleEnabled = () => {
        Preferences.isEnabled.value = !Preferences.isEnabled.value;
    };

    const openCATPage = () => {
        // TODO:
    };

    const testNotification = () => {
        chrome.tabs
            .query({ active: true, currentWindow: true })
            .then((tabs) => {
                return tabs[0];
            })
            .then((tab) => {
                sendMessage(Preferences.notificationPreference.value, {
                    title: 'Test Notification',
                    message: 'This is a test notification',
                    tabId: tab.id,
                }).catch(console.error);
            });
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
    /*
        TODO: add a seamless way of reporting new pages to the CRW Wiki
        Refer to https://github.com/WayneKeenan/ClintonCAT/issues/45 for guidance
        https://wiki.rossmanngroup.com/index.php
        ?veaction=edit
        &preload=Project%3ASample%2FProduct #1
        &editintro=Project%3ASample%2FProduct%2FHelp #1
            * Incident &preload=Project:Sample/Incident&editintro=Project:Sample/Incident/Help
            * Company  &preload=Project:Sample/Company&editintro=Template:Sample/Company/Help
            * Product  &preload=Project:Sample/Product&editintro=Project:Sample/Product/Help
            * Product  &preload=Project:Sample/Product_line&editintro=Project:Sample/Product_line/Help
            * Theme    &preload=Project:Sample/Theme&editintro=Project:Sample/Theme/Help
        &title=Title+name #2
        &create=Create+page
        // NOT IMPLEMENTED (issue is still ongoing and is currently planned)
        &preloadparams[]=Summary goes here #3
        &preloadparams[]=Incident goes here #3
        
    */
    const reportThisSite = () => {
        // TODO: MAKE THIS IN REACT SOMEHOW
        // chrome.tabs
        //     .query({ active: true, currentWindow: true })
        //     .then((tabs) => {
        //         return tabs[0];
        //     })
        //     .then((tab) => {
        //         chrome.scripting.executeScript({
        //             target: { tabId: tab.id ?? 0 },
        //             func: () => {
        //                 document.body.innerHTML +=
        //                     "\
        //                 <div id='reportSite' style='position: fixed; top: 0px; left: 0px; width: 35vw; padding-bottom: 4vh; background: lightgray; z-index: 1000000; line-height: 1.4705882353'>\
        //                     <button id='closeReport' style='position: absolute; top: 0px; right: 0px' onclick=document.getElementById('reportSite').remove()> X </button>\
        //                     <h1 style='font-size: 2em'> Report This Site </h1>\
        //                     <h3 style='margin: 0.4em 0 0 0; font-size: 1.2em'>\
        //                         <label for='reportCategory'> Type of Report </label>\
        //                         <select id='reportCategory' style='font-size: 0.8em'>\
        //                             <option value='None' selected disabled hidden> None </option>\
        //                             <option value='Incident'> Incident </option>\
        //                             <option value='Company'> Company </option>\
        //                             <option value='Product'> Product </option>\
        //                             <option value='Product line'> Product line </option>\
        //                             <option value='Theme'> Theme </option>\
        //                         </select>\
        //                     </h3>\
        //                     <h3 style='margin: 0.4em 0 0 0; font-size: 1.2em'>\
        //                         <label for='reportTitle'> Report Title </label>\
        //                         <input id='reportTitle' placeholder='EX: Samsung forced arbitration on refrigerator boxes' style='width: 19vw; height: 1em'></input>\
        //                     </h3>\
        //                     <h3 style='margin: 0.4em 0 0 0; font-size: 1.2em'> Report Summary </h3>\
        //                     <textarea id='reportSummary' placeholder='Summary of the report' style='width: 33vw; height: 3em; margin: 0.8em 0 0 0'></textarea>\
        //                     <h3 style='margin: 0.4em 0 0 0; font-size: 1.2em'> Report Details </h3>\
        //                     <textarea id='reportContent' placeholder='More in depth analysis of the article' style='width: 33vw; height: 25vh; margin: 0.8em 0 0 0'></textarea>\
        //                     <button id='reportSubmit' onclick=\"const articleType = document.getElementById('reportCategory').value;\
        //                     const title = document.getElementById('reportTitle').value;\
        //                     const summary = document.getElementById('reportSummary').value;\
        //                     const content = document.getElementById('reportContent').value;\
        //                     if(articleType === 'None' || summary === '' || content === '') { alert('missing content'); throw('missing content') }\
        //                     const template = ('Project:Sample/' + articleType.replace(' ', '_');\
        //                     window.open('https://consumerrights.wiki/index.php?veaction=edit&preload=' + encodeURI(template + '&editintro=' + template + '/Help&title=' + title + '&create=Create+page&preloadparams=[' + summary + ',' + content + ']'))\
        //                     \"\
        //                     style='position: absolute; bottom: 0px; right: 1vw'> Start Page </button>\
        //                 </div>";
        //             },
        //         });
        //     });
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
                <button className={styles.popupButton} onClick={reportThisSite}>
                    Report this site
                </button>
                <button className={styles.popupButton} onClick={() => testNotification()}>
                    Test Notification
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
