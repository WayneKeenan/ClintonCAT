import { Maybe } from '@/utils/types';
import { RuntimeMessage, MessageMap, MessageHandler, MessageHandlerContext } from './messages.types';
import MessageSender = chrome.runtime.MessageSender;
import Preferences from '@/common/services/preferences';

const logHandler: MessageHandler<'log'> = (payload, _context) =>
    new Promise((resolve) => {
        console.log('LOG:', payload.message);
        resolve();
    });

const notifyHandler: MessageHandler<'notify'> = (payload, _context) =>
    new Promise((resolve, reject) => {
        if (!Preferences.browserNotificationsEnabled.value) {
            console.log('Browser notifications are disabled. Skipping notification via notifyHandler.');
            resolve();
            return;
        }
        const notificationOptions: chrome.notifications.NotificationOptions<true> = {
            type: 'basic',
            iconUrl: chrome.runtime.getURL('alert.png'),
            title: payload.title,
            message: payload.message,
        };
        chrome.notifications.create(notificationOptions, (notificationId) => {
            if (chrome.runtime.lastError) {
                console.error('Error creating notification:', chrome.runtime.lastError.message);
                reject(new Error(chrome.runtime.lastError.message ?? 'Failed to create notification'));
            } else {
                console.log('Notification created successfully with ID:', notificationId);
                resolve();
            }
        });
    });

const pageInfoHandler: MessageHandler<'pageInfo'> = (payload, context) => {
    return new Promise((resolve, reject) => {
        console.log('Page Info Received, triggering page load handler:', payload);
        context.main.onPageLoaded(payload.domain, payload.url).then(resolve).catch(reject);
    });
};

const handlers = {
    log: logHandler,
    notify: notifyHandler,
    pageInfo: pageInfoHandler,
} satisfies { [K in keyof MessageMap]: MessageHandler<K> };

function messageHandler(
    request: unknown,
    sender: MessageSender,
    sendResponse: (response?: unknown) => void,
    context: MessageHandlerContext
) {
    if (typeof request !== 'object' || request === null || !('type' in request)) {
        console.warn('Received malformed message (missing type):', request, 'from:', sender);
        sendResponse(null);
        return false;
    }

    const { type, payload } = request as RuntimeMessage<keyof MessageMap>;

    const handler = handlers[type] as Maybe<MessageHandler<typeof type>>;

    if (!handler) {
        console.warn(`No handler registered for message type: ${type}`);
        sendResponse(null);
        return false;
    }

    handler(payload, context)
        .then(sendResponse)
        .catch((error: unknown) => {
            console.error(`Error in handler for ${type}:`, error);
            sendResponse({ error: `Handler for ${type} failed.` });
        });

    return true;
}

export default messageHandler;
