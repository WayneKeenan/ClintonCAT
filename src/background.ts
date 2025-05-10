import 'webextension-polyfill'; // do not remove
import { IMainMessage, Main } from './main';
import browser, { Runtime } from 'webextension-polyfill';

const main = new Main();

browser.runtime.onMessage.addListener(() => {
    main.onBrowserExtensionInstalled();
});

browser.runtime.onMessage.addListener((message, sender: Runtime.MessageSender, sendResponse) => {
    main.onBrowserExtensionMessage(message as IMainMessage, sender, sendResponse);
    return true;
});
