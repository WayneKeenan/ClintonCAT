import { Maybe } from '@/utils/types';
import { RuntimeMessage, MessageMap, MessageHandler } from './messages.types';
import MessageSender = chrome.runtime.MessageSender;

const logHandler: MessageHandler<'log'> = (payload) =>
    new Promise((resolve) => {
        console.log('LOG:', payload.message);
        resolve();
    });

const notifyHandler: MessageHandler<'notify'> = (payload) =>
    new Promise((resolve) => {
        const notificationOptions: chrome.notifications.NotificationOptions<true> = {
            type: 'basic',
            iconUrl: chrome.runtime.getURL('alert.png'),
            title: payload.title,
            message: payload.message,
        };
        chrome.notifications.create(notificationOptions);
        resolve();
    });

const notifyPage: MessageHandler<'page'> = (payload) =>
    new Promise((resolve) => {
        // TODO: MAKE THIS IN REACT SOMEHOW
        // chrome.storage.local.set({ title: payload.title, message: payload.message });
        chrome.scripting.executeScript({
            target: { tabId: payload.tabId },
            func: (payload) => {
                // chrome.storage.local.get(['title', 'message']).then((pair) => {
                console.log(payload);
                //             document.body.innerHTML +=
                //                 "<div id='CRW' style='position: fixed; top: 0px; right: 0px; background: black; color: white; font-family: Roboto; z-index: 1000000; text-align: center; max-width: 50vw; padding: 4vmin; border-radius: 3vmin; line-height: 1;'>\
                //                         <button style='position:absolute; top: 1vmin; right: 1vmin; background: inherit; color: inherit; font-size: 1.3em' onclick=document.getElementById('CRW').remove()> X </button>\
                //                         <h1 style='position: relative; top: 2vmin; color: inherit; font-size: 2em; font-weight: 600; margin-bottom: 0.8em'>" +
                //                 String(pair.title) +
                //                 "</h1>\
                //                         <p style='color: inherit; font-size: 1.5em; margin: 0'>" +
                //                 String(pair.message) +
                //                 ' </p>\
                //                         </div>\n';
                // });
            },
            args: [payload],
        });
        resolve();
    });

const handlers = {
    log: logHandler,
    notify: notifyHandler,
    page: notifyPage,
} satisfies { [K in keyof MessageMap]: MessageHandler<K> };

/**
 * Display how many pages were found by updating the badge text
 */
function messageHandler(request: unknown, _sender: MessageSender, sendResponse: (response?: unknown) => void) {
    const { type, payload } = request as RuntimeMessage<keyof MessageMap>;
    const handler = handlers[type] as Maybe<MessageHandler<typeof type>>;

    if (!handler) return console.warn(`No handler registered for message type: ${type}`);

    handler(payload)
        .then(sendResponse)
        .catch((error: unknown) => {
            console.error(`Error in handler for ${type}:`, error);
            sendResponse(null);
        });

    // Return true to keep the message channel open for async usage
    return true;
}

export default messageHandler;
