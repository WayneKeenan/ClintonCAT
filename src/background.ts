import 'webextension-polyfill'; // do not remove
import { IMainMessage, Main } from './main';
import browser, { Runtime } from 'webextension-polyfill';

const main = new Main();

browser.runtime.onInstalled.addListener(() => {
    main.onBrowserExtensionInstalled();
});

browser.runtime.onMessage.addListener((message, sender: Runtime.MessageSender, sendResponse) => {
    main.onBrowserExtensionMessage(message as IMainMessage, sender, sendResponse);
    return true;
});

browser.tabs.onActivated.addListener((activeInfo) => {
    browser.tabs.get(activeInfo.tabId).then((tabInfo) => {
        console.log('fffff: onActivated', { activeInfo, tabInfo });
    });
});
browser.tabs.onUpdated.addListener(
    (tabId, changeInfo, tabInfo) => console.log('fffff: onUpdated', { tabId, changeInfo, tabInfo }),
    { properties: ['url'] }
);
