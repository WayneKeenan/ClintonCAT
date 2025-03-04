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

const handlers = {
    log: logHandler,
    notify: notifyHandler,
} satisfies { [K in keyof MessageMap]: MessageHandler<K> };

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
