import { Browser } from 'webextension-polyfill';

declare namespace globalThis {
    const browser: Browser;
}

declare global {
    namespace globalThis {
        const browser: Browser;
    }
    interface Window {
        browser: Browser;
    }
}
