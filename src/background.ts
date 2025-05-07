import { IMainMessage, Main } from './main';
import browser, { Runtime } from 'webextension-polyfill';

const main = new Main();

browser.runtime.onMessage.addListener(() => {
    main.onBrowserExtensionInstalled();
});

// chrome.runtime.onMessage.addListener(
//     (message: IMainMessage, sender: chrome.runtime.MessageSender, sendResponse: VoidFunction) => {
//         main.onBrowserExtensionMessage(message, sender, sendResponse);
//     }
// );

browser.runtime.onMessage.addListener((message, sender: Runtime.MessageSender, sendResponse) => {
    main.onBrowserExtensionMessage(message as IMainMessage, sender, sendResponse);
    return true;
});

// browser.browserAction.onClicked.addListener(() => {
//     browser.tabs.executeScript({ file: 'content.js' });
// });
