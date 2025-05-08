import useEffectOnce from '@/utils/hooks/use-effect-once';
import React, { FormEvent, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { getDomain } from 'tldts';
import classNames from 'classnames';
import Preferences from '@/common/services/preferences';
import BrowserLocalStorage from '@/storage/browser/browser-local-storage';
import BrowserSyncStorage from '@/storage/browser/browser-sync-storage';
import * as styles from './Options.module.css';

const Options = () => {
    const [items, setItems] = useState<string[]>([]);
    const [domainInput, setDomainInput] = useState('');
    const [domainError, setDomainError] = useState('');

    useEffectOnce(() => {
        // Preferences.initDefaults(new ChromeSyncStorage(), new ChromeLocalStorage())
        Preferences.initDefaults(new BrowserSyncStorage(), new BrowserLocalStorage())
            .then(() => {
                Preferences.domainExclusions.addListener('exclude-options', (result: string[]) =>
                    setItems([...result])
                );
                setItems([...Preferences.domainExclusions.value]);
            })
            .catch((error: unknown) => console.error('Failed to initialize preferences:', error));

        return () => Preferences.domainExclusions.removeListener('exclude-options');
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
                        <p>TODO</p>
                        <label className={styles.toggleLabel}>
                            <span>Enable Feature XYZ</span>
                            <input type="checkbox" />
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
