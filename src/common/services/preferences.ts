import ObservableSet from '@/common/observables/observable-set';
import ObservableValue from '@/common/observables/observable-value';
import { IStorageBackend } from '@/storage/istorage-backend';
import { Nullable } from '@/utils/types';

class Preferences {
    static readonly IS_ENABLED_KEY = 'is_enabled';
    static readonly DOMAIN_EXCLUSIONS_KEY = 'domain_exclusions';
    static readonly BROWSER_NOTIFICATIONS_ENABLED_KEY = 'browser_notifications_enabled';
    static readonly PAGE_NOTIFICATIONS_ENABLED_KEY = 'page_notifications_enabled';
    static readonly DEFAULT_DOMAIN_EXCLUSIONS = ['rossmanngroup.com'];

    static readonly PAGE_NOTIFICATIONS_AUTOHIDETIME_KEY = 'page_notifications_autohide';
    static readonly PAGE_NOTIFICATIONS_DISMISSTIME_KEY = 'page_notifications_dismiss_time';
    static readonly PAGE_NOTIFICATIONS_SHOWMORE_KEY = 'page_notifications_show_more';
    static readonly PAGE_NOTIFICATIONS_SHOWMUTE_KEY = 'page_notifications_show_mute';
    static readonly PAGE_NOTIFICATIONS_SHOWHIDE_KEY = 'page_notifications_show_hide';
    static readonly PAGE_NOTIFICATIONS_SHOW_COMPANY_KEY = 'page_notifications_show_company';
    static readonly PAGE_NOTIFICATIONS_SHOW_INCIDENT_KEY = 'page_notifications_show_incident';
    static readonly PAGE_NOTIFICATIONS_SHOW_PRODUCT_KEY = 'page_notifications_show_product';
    static readonly PAGE_NOTIFICATIONS_SHOW_PRODUCTLINE_KEY = 'page_notifications_show_productline';

    static readonly AUTO_UPDATE_PAGESDB_KEY = 'auto_update_pagesdb';
    static readonly AUTO_UPDATE_PAGESDB_INTERVAL_KEY = 'auto_update_interval_pagesdb';

    static isEnabled = new ObservableValue<boolean>(true);
    static domainExclusions = new ObservableSet<string>();
    static browserNotificationsEnabled = new ObservableValue<boolean>(true);
    //in page options
    static pageNotificationsEnabled = new ObservableValue<boolean>(true);
    static pageNotificationsAutoHideTime = new ObservableValue<number>(5);
    static pageNotificationsDismissTime = new ObservableValue<number>(1);
    static pageNotificationsShowMore = new ObservableValue<boolean>(true);
    static pageNotificationsShowMute = new ObservableValue<boolean>(true);
    static pageNotificationsShowHide = new ObservableValue<boolean>(true);
    static pageNotificationsShowCompany = new ObservableValue<boolean>(true);
    static pageNotificationsShowIncident = new ObservableValue<boolean>(true);
    static pageNotificationsShowProduct = new ObservableValue<boolean>(true);
    static pageNotificationsShowProductLine = new ObservableValue<boolean>(true);

    static autoUpdateDB = new ObservableValue<boolean>(true);
    static autoUpdateIntervalDB = new ObservableValue<number>(1);

    // Injected storage backends  (TODO: do we need both?)
    // Sync is used to share data across browsers if logged in, e.g. plugin settings
    // Local is for 'this' browser only storage and can have more space available, e.g. for the pages db
    private static preferenceStore: Nullable<IStorageBackend> = null;
    private static localStore: Nullable<IStorageBackend> = null;

    /**
     * Inject whichever storage backends you want to use (sync, local, or even mocks for testing).
     */
    static setBackingStores(preferenceStore: IStorageBackend, localStore: IStorageBackend) {
        this.preferenceStore = preferenceStore;
        this.localStore = localStore;
    }

    /**
     * Get defaults from preferenceStorage, if available,
     * otherwise use some default values. This method needs to
     * be called for each context to initialize storage correctly
     */
    static async initDefaults(preferenceStore: IStorageBackend, localStore: IStorageBackend) {
        console.log('Defaulting settings');
        this.setBackingStores(preferenceStore, localStore);

        // Reset callbacks
        this.isEnabled.removeAllListeners();
        this.domainExclusions.removeAllListeners();
        this.browserNotificationsEnabled.removeAllListeners();
        this.pageNotificationsEnabled.removeAllListeners();
        this.pageNotificationsAutoHideTime.removeAllListeners();
        this.pageNotificationsDismissTime.removeAllListeners();
        this.pageNotificationsShowMore.removeAllListeners();
        this.pageNotificationsShowMute.removeAllListeners();
        this.pageNotificationsShowHide.removeAllListeners();
        this.pageNotificationsShowCompany.removeAllListeners();
        this.pageNotificationsShowIncident.removeAllListeners();
        this.pageNotificationsShowProduct.removeAllListeners();
        this.pageNotificationsShowProductLine.removeAllListeners();
        this.autoUpdateDB.removeAllListeners();
        this.autoUpdateIntervalDB.removeAllListeners();

        // Set up default callbacks
        this.isEnabled.addListener(this.IS_ENABLED_KEY, (result: boolean) => {
            this.setPreference(Preferences.IS_ENABLED_KEY, result);
        });

        this.domainExclusions.addListener(this.DOMAIN_EXCLUSIONS_KEY, (result: string[]) => {
            this.setPreference(Preferences.DOMAIN_EXCLUSIONS_KEY, result);
        });

        this.browserNotificationsEnabled.addListener(this.BROWSER_NOTIFICATIONS_ENABLED_KEY, (result: boolean) => {
            this.setPreference(Preferences.BROWSER_NOTIFICATIONS_ENABLED_KEY, result);
        });

        this.pageNotificationsEnabled.addListener(this.PAGE_NOTIFICATIONS_ENABLED_KEY, (result: boolean) => {
            this.setPreference(Preferences.PAGE_NOTIFICATIONS_ENABLED_KEY, result);
        });

        this.pageNotificationsAutoHideTime.addListener(this.PAGE_NOTIFICATIONS_AUTOHIDETIME_KEY, (result: number) => {
            this.setPreference(Preferences.PAGE_NOTIFICATIONS_AUTOHIDETIME_KEY, result);
        });

        this.pageNotificationsDismissTime.addListener(this.PAGE_NOTIFICATIONS_DISMISSTIME_KEY, (result: number) => {
            this.setPreference(Preferences.PAGE_NOTIFICATIONS_DISMISSTIME_KEY, result);
        });

        this.pageNotificationsShowMore.addListener(this.PAGE_NOTIFICATIONS_SHOWMORE_KEY, (result: boolean) => {
            this.setPreference(Preferences.PAGE_NOTIFICATIONS_SHOWMORE_KEY, result);
        });

        this.pageNotificationsShowMute.addListener(this.PAGE_NOTIFICATIONS_SHOWMUTE_KEY, (result: boolean) => {
            this.setPreference(Preferences.PAGE_NOTIFICATIONS_SHOWMUTE_KEY, result);
        });

        this.pageNotificationsShowHide.addListener(this.PAGE_NOTIFICATIONS_SHOWHIDE_KEY, (result: boolean) => {
            this.setPreference(Preferences.PAGE_NOTIFICATIONS_SHOWHIDE_KEY, result);
        });

        this.pageNotificationsShowCompany.addListener(this.PAGE_NOTIFICATIONS_SHOW_COMPANY_KEY, (result: boolean) => {
            this.setPreference(Preferences.PAGE_NOTIFICATIONS_SHOW_COMPANY_KEY, result);
        });

        this.pageNotificationsShowIncident.addListener(this.PAGE_NOTIFICATIONS_SHOW_INCIDENT_KEY, (result: boolean) => {
            this.setPreference(Preferences.PAGE_NOTIFICATIONS_SHOW_INCIDENT_KEY, result);
        });

        this.pageNotificationsShowProduct.addListener(this.PAGE_NOTIFICATIONS_SHOW_PRODUCT_KEY, (result: boolean) => {
            this.setPreference(Preferences.PAGE_NOTIFICATIONS_SHOW_PRODUCT_KEY, result);
        });

        this.pageNotificationsShowProductLine.addListener(
            this.PAGE_NOTIFICATIONS_SHOW_PRODUCTLINE_KEY,
            (result: boolean) => {
                this.setPreference(Preferences.PAGE_NOTIFICATIONS_SHOW_PRODUCTLINE_KEY, result);
            }
        );

        this.autoUpdateDB.addListener(this.AUTO_UPDATE_PAGESDB_KEY, (result: boolean) => {
            void this.setPreference(Preferences.AUTO_UPDATE_PAGESDB_KEY, result);
        });

        this.autoUpdateIntervalDB.addListener(this.AUTO_UPDATE_PAGESDB_INTERVAL_KEY, (result: number) => {
            void this.setPreference(Preferences.AUTO_UPDATE_PAGESDB_INTERVAL_KEY, result);
        });

        // Attempt preference retrieval
        const rawIsEnabled = await this.getPreference(this.IS_ENABLED_KEY);
        if (typeof rawIsEnabled === 'boolean') {
            this.isEnabled.value = rawIsEnabled;
        } else {
            this.isEnabled.value = true;
        }
        const rawDomainExclusions = await this.getPreference(this.DOMAIN_EXCLUSIONS_KEY);
        if (Array.isArray(rawDomainExclusions)) {
            this.domainExclusions.value = rawDomainExclusions.filter(
                (item): item is string => typeof item === 'string'
            );
        } else {
            this.domainExclusions.value = Preferences.DEFAULT_DOMAIN_EXCLUSIONS;
        }

        const rawBrowserNotificationsEnabled = await this.getPreference(this.BROWSER_NOTIFICATIONS_ENABLED_KEY);
        if (typeof rawBrowserNotificationsEnabled === 'boolean') {
            this.browserNotificationsEnabled.value = rawBrowserNotificationsEnabled;
        } else {
            this.browserNotificationsEnabled.value = true;
        }

        const rawPageNotificationsEnabled = await this.getPreference(this.PAGE_NOTIFICATIONS_ENABLED_KEY);
        if (typeof rawPageNotificationsEnabled === 'boolean') {
            this.pageNotificationsEnabled.value = rawPageNotificationsEnabled;
        } else {
            this.pageNotificationsEnabled.value = true;
        }

        const rawPageNotificationsAutoHide = await this.getPreference(this.PAGE_NOTIFICATIONS_AUTOHIDETIME_KEY);
        if (typeof rawPageNotificationsAutoHide === 'number') {
            this.pageNotificationsAutoHideTime.value = rawPageNotificationsAutoHide;
        } else {
            this.pageNotificationsAutoHideTime.value = 5;
        }

        const rawPageNotificationsDismissTime = await this.getPreference(this.PAGE_NOTIFICATIONS_DISMISSTIME_KEY);
        if (typeof rawPageNotificationsDismissTime === 'number') {
            this.pageNotificationsDismissTime.value = rawPageNotificationsDismissTime;
        } else {
            this.pageNotificationsDismissTime.value = 1;
        }

        const rawrawpageNotificationsShowMore = await this.getPreference(this.PAGE_NOTIFICATIONS_SHOWMORE_KEY);
        if (typeof rawrawpageNotificationsShowMore === 'boolean') {
            this.pageNotificationsShowMore.value = rawrawpageNotificationsShowMore;
        } else {
            this.pageNotificationsShowMore.value = true;
        }

        const rawpageNotificationsShowMute = await this.getPreference(this.PAGE_NOTIFICATIONS_SHOWMUTE_KEY);
        if (typeof rawpageNotificationsShowMute === 'boolean') {
            this.pageNotificationsShowMute.value = rawpageNotificationsShowMute;
        } else {
            this.pageNotificationsShowMute.value = true;
        }

        const rawpageNotificationsShowHide = await this.getPreference(this.PAGE_NOTIFICATIONS_SHOWHIDE_KEY);
        if (typeof rawpageNotificationsShowHide === 'boolean') {
            this.pageNotificationsShowHide.value = rawpageNotificationsShowHide;
        } else {
            this.pageNotificationsShowHide.value = true;
        }

        const rawpageNotificationsShowCompany = await this.getPreference(this.PAGE_NOTIFICATIONS_SHOW_COMPANY_KEY);
        if (typeof rawpageNotificationsShowCompany === 'boolean') {
            this.pageNotificationsShowCompany.value = rawpageNotificationsShowCompany;
        } else {
            this.pageNotificationsShowCompany.value = true;
        }

        const rawpageNotificationsShowIncident = await this.getPreference(this.PAGE_NOTIFICATIONS_SHOW_INCIDENT_KEY);
        if (typeof rawpageNotificationsShowIncident === 'boolean') {
            this.pageNotificationsShowIncident.value = rawpageNotificationsShowIncident;
        } else {
            this.pageNotificationsShowIncident.value = true;
        }

        const rawpageNotificationsShowProduct = await this.getPreference(this.PAGE_NOTIFICATIONS_SHOW_PRODUCT_KEY);
        if (typeof rawpageNotificationsShowProduct === 'boolean') {
            this.pageNotificationsShowProduct.value = rawpageNotificationsShowProduct;
        } else {
            this.pageNotificationsShowProduct.value = true;
        }

        const rawpageNotificationsShowProductLine = await this.getPreference(
            this.PAGE_NOTIFICATIONS_SHOW_PRODUCTLINE_KEY
        );
        if (typeof rawpageNotificationsShowProductLine === 'boolean') {
            this.pageNotificationsShowProductLine.value = rawpageNotificationsShowProductLine;
        } else {
            this.pageNotificationsShowProductLine.value = true;
        }

        const rawAutoUpdatePagesDB = await this.getPreference(this.AUTO_UPDATE_PAGESDB_KEY);
        if (typeof rawAutoUpdatePagesDB === 'boolean') {
            this.autoUpdateDB.value = rawAutoUpdatePagesDB;
        } else {
            this.autoUpdateDB.value = true;
        }

        const rawAutoUpdateIntervalDB = await this.getPreference(this.AUTO_UPDATE_PAGESDB_KEY);
        if (typeof rawAutoUpdateIntervalDB === 'number') {
            this.autoUpdateIntervalDB.value = rawAutoUpdateIntervalDB;
        } else {
            this.autoUpdateIntervalDB.value = 1;
        }
    }

    public static dump(): void {
        const msg: string =
            `IsEnabled = ${Preferences.isEnabled.toString()}, ` +
            `DomainExclusions = ${Preferences.domainExclusions.toString()}, ` +
            `BrowserNotificationsEnabled = ${Preferences.browserNotificationsEnabled.toString()}, ` +
            `PageNotificationsEnabled = ${Preferences.pageNotificationsEnabled.toString()}, ` +
            `PageNotificationsAutoHideTime = ${Preferences.pageNotificationsAutoHideTime.toString()}, ` +
            `PageNotificationsDismissTime = ${Preferences.pageNotificationsDismissTime.toString()}, ` +
            `pageNotificationsShowMore = ${Preferences.pageNotificationsShowMore.toString()}, ` +
            `pageNotificationsShowMute = ${Preferences.pageNotificationsShowMute.toString()}, ` +
            `pageNotificationsShowHide = ${Preferences.pageNotificationsShowHide.toString()}, ` +
            `pageNotificationsShowCompany = ${Preferences.pageNotificationsShowCompany.toString()}, ` +
            `pageNotificationsShowIncident = ${Preferences.pageNotificationsShowIncident.toString()}, ` +
            `pageNotificationsShowProduct = ${Preferences.pageNotificationsShowProduct.toString()}, ` +
            `pageNotificationsShowProductLine = ${Preferences.pageNotificationsShowProductLine.toString()}, ` +
            `autoUpdateDB = ${Preferences.autoUpdateDB.toString()}, ` +
            `autoUpdateIntervalDB = ${Preferences.autoUpdateIntervalDB.toString()}`;
        console.log(msg);
    }

    /**
     * Actual reading/writing now delegated to the injected preference store
     */
    static async setPreference(key: string, value: unknown): Promise<void> {
        if (!this.preferenceStore) {
            throw new Error('No preferenceStore defined! Call setBackingStores() first.');
        }
        await this.preferenceStore.set(key, value);
        console.log(`(setPreference) ${key} = ${JSON.stringify(value)}`);
    }

    static async getPreference(key: string): Promise<unknown> {
        if (!this.preferenceStore) {
            throw new Error('No preferenceStore defined! Call setBackingStores() first.');
        }
        const value = await this.preferenceStore.get(key);
        console.log(`(getPreference) ${key} =>`, value);
        return value;
    }

    // TODO: decide whether to use localStore or preferenceStore
    static async setStorage(key: string, value: unknown): Promise<void> {
        if (!this.localStore) {
            throw new Error('No localStore defined! Call setBackingStores() first.');
        }
        await this.localStore.set(key, value);
        console.log(`(setStorage) ${key} = ${JSON.stringify(value)}`);
    }

    static async getStorage(key: string): Promise<unknown> {
        if (!this.localStore) {
            throw new Error('No localStore defined! Call setBackingStores() first.');
        }
        const value = await this.localStore.get(key);
        console.log(`(getStorage) ${key} =>`, value);
        return value;
    }
}

export default Preferences;
