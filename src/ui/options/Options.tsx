import useEffectOnce from '@/utils/hooks/use-effect-once';
import React, { FormEvent, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { getDomain } from 'tldts';
import classNames from 'classnames';
import Preferences from '@/common/services/preferences';
import ChromeLocalStorage from '@/storage/chrome/chrome-local-storage';
import ChromeSyncStorage from '@/storage/chrome/chrome-sync-storage';
import * as styles from './Options.module.css';

const Options = () => {
    const [items, setItems] = useState<string[]>([]);
    const [domainInput, setDomainInput] = useState('');
    const [domainError, setDomainError] = useState('');
    const [showSysNotifications, setShowSysNotifications] = useState(Preferences.showSysNotifications.value);

    useEffectOnce(() => {
        Preferences.initDefaults(new ChromeSyncStorage(), new ChromeLocalStorage())
            .then(() => {
                Preferences.domainExclusions.addListener('exclude-options', (result: string[]) =>
                    setItems([...result])
                );

                Preferences.showSysNotifications.addListener('show-sys-notifications-options', (result: boolean) =>
                    setShowSysNotifications(result)
                );

                setItems([...Preferences.domainExclusions.value]);
                setShowSysNotifications(Preferences.showSysNotifications.value);
            })
            .catch((error: unknown) => console.error('Failed to initialize preferences:', error));

        return () => {
            Preferences.domainExclusions.removeListener('exclude-options');
            Preferences.showSysNotifications.removeListener('show-sys-notifications-options');
        };
    });

    const addItem = () => {
        const parsedDomain = getDomain(domainInput);
        if (parsedDomain === null) {
            return setDomainError(`"${domainInput}" is not a valid domain`);
        }
        Preferences.domainExclusions.add(parsedDomain);
        setDomainInput('');
        setDomainError('');
    };

    const removeItem = (index: number) => {
        Preferences.domainExclusions.deleteAt(index);
        setDomainError('');
    };

    const clearList = () => {
        Preferences.domainExclusions.value = [];
        setDomainError('');
    };

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        addItem();
    };

    const handleSysNotificationsToggle = () => {
        const newValue = !showSysNotifications;
        setShowSysNotifications(newValue);
        Preferences.showSysNotifications.value = newValue;
    };

    return (
        <div className={styles.optionsPage}>
            <h1 className={styles.pageTitle}>Extension Options</h1>
            <div className={styles.optionsContainer}>
                <div className={styles.settingsColumn}>
                    <h2 className={styles.columnTitle}>Excluded Domains</h2>
                    <div className={styles.settingsContainer}>
                        <form onSubmit={handleSubmit} className={styles.form}>
                            <input
                                type="text"
                                value={domainInput}
                                onFocus={() => setDomainError('')}
                                onChange={(e) => setDomainInput(e.target.value.trim())}
                                placeholder="Enter a domain"
                                className={styles.inputField}
                            />
                            <button type="submit" className={classNames(styles.btn, styles.addBtn)}>
                                Add
                            </button>
                            <button
                                type="button"
                                onClick={clearList}
                                className={classNames(styles.btn, styles.clearBtn)}>
                                Clear
                            </button>
                        </form>
                        {domainError && <div className={styles.errorMessage}>{domainError}</div>}
                    </div>
                    <ul className={styles.excludedList}>
                        {items.map((item, index) => (
                            <li key={index} className={styles.excludedItem}>
                                <span>{item}</span>
                                <button onClick={() => removeItem(index)} className={styles.removeBtn}>
                                    &times;
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className={styles.settingsColumn}>
                    <h2 className={styles.columnTitle}>Other Settings</h2>
                    <div className={styles.settingsContainer}>
                        <label className={styles.toggleLabel}>
                            <span>Enable System Notifications</span>
                            <input
                                type="checkbox"
                                checked={showSysNotifications}
                                onChange={handleSysNotificationsToggle}
                            />
                            <span className={styles.toggleSlider} />
                        </label>
                    </div>
                </div>
            </div>
        </div>
    );
};

const rootElement: HTMLElement | null = document.getElementById('root');
if (rootElement instanceof HTMLElement) {
    const root = createRoot(rootElement);
    root.render(
        <React.StrictMode>
            <Options />
        </React.StrictMode>
    );
} else {
    throw Error('No root element was found');
}
