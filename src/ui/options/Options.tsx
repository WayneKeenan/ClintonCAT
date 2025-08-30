import useEffectOnce from '@/utils/hooks/use-effect-once';
import React, { FormEvent, useState, ChangeEvent } from 'react';
import { createRoot } from 'react-dom/client';
import { getDomain } from 'tldts';
import classNames from 'classnames';
import Preferences from '@/common/services/preferences';
import BrowserLocalStorage from '@/storage/browser/browser-local-storage';
import BrowserSyncStorage from '@/storage/browser/browser-sync-storage';
import * as styles from './Options.module.css';

import { useI18n } from '@/utils/helpers/localized';

const Options = () => {
    const { t } = useI18n();
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

                setAutoUpdateDB(Preferences.autoUpdateDB.value);
                setAutoUpdateIntervalDB(Preferences.autoUpdateIntervalDB.value);
            })
            .catch((error: unknown) => console.error('Failed to initialize preferences:', error));

        return () => Preferences.domainExclusions.removeListener('exclude-options');
    });

    const addItem = () => {
        const parsedDomain = getDomain(domainInput);
        if (parsedDomain === null) {
            return setDomainError(t('DOMAIN_NOT_VALID', [domainInput]));
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

    const updatePagesDB = () => {
        const payload = {
            action: 'pageDB.update',
        };

        void browser.runtime.sendMessage({
            type: 'optionsAction',
            payload: payload,
        });
    };

    const [autoUpdateDB, setAutoUpdateDB] = useState(true);
    const toggleAutoUpdateDB = () => {
        setAutoUpdateDB(!autoUpdateDB);
        Preferences.autoUpdateDB.value = Boolean(!autoUpdateDB);
    };

    const [autoUpdateIntervalDB, setAutoUpdateIntervalDB] = useState(1);
    const setAutoUpdateIntervalDBOnChange = (event: ChangeEvent<HTMLInputElement>) => {
        setAutoUpdateIntervalDB(Number(event.currentTarget.value));
    };
    const setAutoUpdateIntervalDBSave = () => {
        Preferences.autoUpdateIntervalDB.value = autoUpdateIntervalDB;
    };

    return (
        <div className={styles.optionsPage}>
            <h1 className={styles.pageTitle}>{t('EXTENSION_OPTIONS')}</h1>
            <div className={styles.optionsContainer}>
                <div className={styles.settingsColumn}>
                    <h2 className={styles.columnTitle}>{t('EXCLUDED_DOMAINS')}</h2>
                    <div className={styles.settingsContainer}>
                        <form onSubmit={handleSubmit} className={styles.form}>
                            <input
                                type="text"
                                value={domainInput}
                                onFocus={() => setDomainError('')}
                                onChange={(e) => setDomainInput(e.target.value.trim())}
                                placeholder={t('ENTER_DOMAIN')}
                                className={styles.inputField}
                            />
                            <button type="submit" className={classNames(styles.btn, styles.addBtn)}>
                                {t('ADD')}
                            </button>
                            <button
                                type="button"
                                onClick={clearList}
                                className={classNames(styles.btn, styles.clearBtn)}>
                                {t('CLEAR')}
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
                    <h2 className={styles.columnTitle}>{t('OTHER_SETTINGS')}</h2>
                    <div className={styles.settingsContainer}>
                        <p>TODO</p>
                        <label className={styles.toggleLabel}>
                            <span>Enable Feature XYZ</span>
                            <input type="checkbox" />
                            <span className={styles.toggleSlider} />
                        </label>
                    </div>
                </div>

                <div className={styles.settingsColumn}>
                    <h2 className={styles.columnTitle}>{t('DATABASE_SETTINGS')}</h2>
                    <div className={styles.settingsContainer}>
                        <p>{t('PAGES_DATABASE_UPDATE')}</p>
                        <label className={styles.toggleLabel}>
                            <button
                                type="button"
                                onClick={updatePagesDB}
                                className={classNames(styles.btn, styles.clearBtn)}>
                                {t('UPDATE_NOW')}
                            </button>
                        </label>
                        <div className={styles.settingsContainer}>
                            <label className={styles.toggleLabel}>
                                <span>{t('AUTO_UPDATE_PAGESDB')}</span>
                                <input type="checkbox" onClick={toggleAutoUpdateDB} checked={autoUpdateDB} />
                                <span className={styles.toggleSlider} />
                            </label>
                        </div>
                        <span>{t('PAGES_DATABASE_UPDATE_INTERVAL', [autoUpdateIntervalDB.toString()])}</span>
                        <div className={styles.slidecontainer}>
                            <input
                                type="range"
                                value={autoUpdateIntervalDB}
                                min="1"
                                max="7"
                                onChange={setAutoUpdateIntervalDBOnChange}
                                onMouseUp={setAutoUpdateIntervalDBSave}
                                onTouchEnd={setAutoUpdateIntervalDBSave}
                                className={styles.slider}
                                list="dbupdateinterval-data"
                            />
                            <datalist className={styles.sliderDatalist} id="dbupdateinterval-data">
                                <option value="1" label="1"></option>
                                <option value="7" label="7"></option>
                            </datalist>
                        </div>
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
