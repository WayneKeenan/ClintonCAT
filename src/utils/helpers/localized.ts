import { useCallback } from 'react';

export function useI18n() {
    const t = useCallback((key: string, substitutions?: string | string[]) => {
        console.log('useCallback: ', key);

        const i18n = chrome.i18n || browser.i18n;
        const message = i18n.getMessage(key, substitutions);

        if (message) {
            return message;
        }

        return key;
    }, []);

    return { t };
}
