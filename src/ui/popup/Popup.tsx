import sendMessage from '@/common/messages/send-message';
import Preferences from '@/common/services/preferences';
import ChromeLocalStorage from '@/storage/chrome/chrome-local-storage';
import ChromeSyncStorage from '@/storage/chrome/chrome-sync-storage';
import useEffectOnce from '@/utils/hooks/use-effect-once';
import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import * as styles from './Popup.module.css';

const Popup = () => {
    const [isEnabled, setIsEnabled] = useState(false);

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
        sendMessage('notify', { title: 'Test Notification', message: 'This is a test notification' }).catch(
            console.error
        );
    };

    const allowThisSite = () => {
        const domain = window.location.hostname; // TODO: gets extension name instead of open tab domain
        Preferences.domainExclusions.delete(domain);
    };

    const excludeThisSite = () => {
        const domain = window.location.hostname; // TODO: gets extension name instead of open tab domain
        Preferences.domainExclusions.add(domain);
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
                <span className={`${styles.toggleSlider} ${isEnabled ? styles.toggled : ''}`} />
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
