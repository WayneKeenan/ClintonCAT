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

                setInPageAutoHideTime(Preferences.pageNotificationsAutoHideTime.value);
                setInPageDismissTime(Preferences.pageNotificationsDismissTime.value);
                setInPageShowMore(Preferences.pageNotificationsShowMore.value);
                setInPageShowMute(Preferences.pageNotificationsShowMute.value);
                setInPageShowHide(Preferences.pageNotificationsShowHide.value);
                setInPageShowCompany(Preferences.pageNotificationsShowCompany.value);
                setInPageShowIncident(Preferences.pageNotificationsShowIncident.value);
                setInPageShowProduct(Preferences.pageNotificationsShowProduct.value);
                setInPageShowProductLine(Preferences.pageNotificationsShowProductLine.value);

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

    const [inPageAutoHideTime, setInPageAutoHideTime] = useState(5);
    const setInPageAutoHideTimeOnChange = (event: ChangeEvent<HTMLInputElement>) => {
        setInPageAutoHideTime(Number(event.currentTarget.value));
    };
    const setInPageAutoHideTimeSave = () => {
        Preferences.pageNotificationsAutoHideTime.value = Number(inPageAutoHideTime);
    };

    const [inPageDismissTime, setInPageDismissTime] = useState(1);
    const setInPageDismissTimeOnChange = (event: ChangeEvent<HTMLInputElement>) => {
        setInPageDismissTime(Number(event.currentTarget.value));
        Preferences.pageNotificationsDismissTime.value = Number(event.currentTarget.value);
    };

    const setInPageDismissTimeSave = () => {
        Preferences.pageNotificationsDismissTime.value = Number(inPageDismissTime);
    };

    const [inPageShowMore, setInPageShowMore] = useState(true);
    const toggleInPageShowMore = () => {
        setInPageShowMore(!inPageShowMore);
        Preferences.pageNotificationsShowMore.value = Boolean(!inPageShowMore);
    };

    const [inPageShowMute, setInPageShowMute] = useState(true);
    const toggleInPageShowMute = () => {
        setInPageShowMute(!inPageShowMute);
        Preferences.pageNotificationsShowMute.value = Boolean(!inPageShowMute);
    };

    const [inPageShowHide, setInPageShowHide] = useState(true);
    const toggleInPageShowHide = () => {
        setInPageShowHide(!inPageShowHide);
        Preferences.pageNotificationsShowHide.value = Boolean(!inPageShowHide);
    };

    const [inPageShowCompany, setInPageShowCompany] = useState(true);
    const toggleInPageShowCompany = () => {
        setInPageShowCompany(!inPageShowCompany);
        Preferences.pageNotificationsShowCompany.value = Boolean(!inPageShowCompany);
    };

    const [inPageShowIncident, setInPageShowIncident] = useState(true);
    const toggleInPageShowIncident = () => {
        setInPageShowIncident(!inPageShowIncident);
        Preferences.pageNotificationsShowIncident.value = Boolean(!inPageShowIncident);
    };

    const [inPageShowProduct, setInPageShowProduct] = useState(true);
    const toggleInPageShowProduct = () => {
        setInPageShowProduct(!inPageShowProduct);
        Preferences.pageNotificationsShowProduct.value = Boolean(!inPageShowProduct);
    };

    const [inPageShowProductLine, setInPageShowProductLine] = useState(true);
    const toggleInPageShowProductLine = () => {
        setInPageShowProductLine(!inPageShowProductLine);
        Preferences.pageNotificationsShowProductLine.value = Boolean(!inPageShowProductLine);
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
                <div className={styles.settingsColumn}>
                    <h2 className={styles.columnTitle}>{t('IN_PAGE_SETTINGS')}</h2>
                    <div className={styles.settingsContainer}>
                        <label className={styles.sliderLabel}>
                            <span>{t('AUTOHIDE_LABEL', [inPageAutoHideTime.toString()])}</span>
                            <div className={styles.slidecontainer}>
                                <input
                                    type="range"
                                    value={inPageAutoHideTime}
                                    min="0"
                                    max="30"
                                    onChange={setInPageAutoHideTimeOnChange}
                                    onMouseUp={setInPageAutoHideTimeSave}
                                    onTouchEnd={setInPageAutoHideTimeSave}
                                    className={styles.slider}
                                    list="autohide-data"
                                />
                                <datalist className={styles.sliderDatalist} id="autohide-data">
                                    <option value="0" label={t('OFF')}></option>
                                    <option value="30" label={t('30')}></option>
                                </datalist>
                            </div>
                        </label>

                        <label className={styles.sliderLabel}>
                            <span>{t('DISMISS_TIME_LABEL', [inPageDismissTime.toString()])}</span>
                            <div className={styles.slidecontainer}>
                                <input
                                    type="range"
                                    value={inPageDismissTime}
                                    min="1"
                                    max="48"
                                    onChange={setInPageDismissTimeOnChange}
                                    onMouseUp={setInPageDismissTimeSave}
                                    onTouchEnd={setInPageDismissTimeSave}
                                    className={styles.slider}
                                    list="dismisstime-data"
                                />
                                <datalist className={styles.sliderDatalist} id="dismisstime-data">
                                    <option value="1" label="1"></option>
                                    <option value="48" label="48"></option>
                                </datalist>
                            </div>
                        </label>

                        <label className={styles.toggleLabel}>
                            <span>{t('SHOW_MORE_OPTION')}</span>
                            <input type="checkbox" checked={inPageShowMore} onClick={toggleInPageShowMore} />
                            <span className={styles.toggleSlider} />
                        </label>
                        <label className={styles.toggleLabel}>
                            <span>{t('SHOW_MUTE_OPTION')}</span>
                            <input type="checkbox" checked={inPageShowMute} onClick={toggleInPageShowMute} />
                            <span className={styles.toggleSlider} />
                        </label>
                        <label className={styles.toggleLabel}>
                            <span>{t('SHOW_HIDE_OPTION')}</span>
                            <input type="checkbox" checked={inPageShowHide} onClick={toggleInPageShowHide} />
                            <span className={styles.toggleSlider} />
                        </label>
                        <label className={styles.toggleLabel}>
                            <span>{t('SHOW_COMPANY')}</span>
                            <input type="checkbox" checked={inPageShowCompany} onClick={toggleInPageShowCompany} />
                            <span className={styles.toggleSlider} />
                        </label>
                        <label className={styles.toggleLabel}>
                            <span>{t('SHOW_INCIDENT')}</span>
                            <input type="checkbox" checked={inPageShowIncident} onClick={toggleInPageShowIncident} />
                            <span className={styles.toggleSlider} />
                        </label>
                        <label className={styles.toggleLabel}>
                            <span>{t('SHOW_PRODUCT')}</span>
                            <input type="checkbox" checked={inPageShowProduct} onClick={toggleInPageShowProduct} />
                            <span className={styles.toggleSlider} />
                        </label>
                        <label className={styles.toggleLabel}>
                            <span>{t('SHOW_PRODUCTLINE')}</span>
                            <input
                                type="checkbox"
                                checked={inPageShowProductLine}
                                onClick={toggleInPageShowProductLine}
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
