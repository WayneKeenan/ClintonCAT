import { Maybe } from '@/utils/types';
import { RuntimeMessage, MessageMap, MessageHandler, MessageHandlerContext } from './messages.types';
import Preferences from '@/common/services/preferences';
import browser, { Runtime } from 'webextension-polyfill';

const logHandler: MessageHandler<'log'> = (payload, _context) =>
    new Promise((resolve) => {
        console.log('LOG:', payload.message);
        resolve();
    });

const notifyHandler: MessageHandler<'notify'> = async (payload, _context) => {
    if (!Preferences.browserNotificationsEnabled.value) {
        console.log('Browser notifications are disabled. Skipping notification via notifyHandler.');
        return;
    }

    const notificationOptions = {
        type: 'basic',
        iconUrl: browser.runtime.getURL('alert.png'),
        title: payload.title,
        message: payload.message,
    } as browser.Notifications.CreateNotificationOptions;

    try {
        const notificationId = await browser.notifications.create(notificationOptions);
        console.log('Notification created successfully with ID:', notificationId);
    } catch (error) {
        console.error('Error creating notification:', error instanceof Error ? error.message : 'Unknown error');
        throw new Error('Failed to create notification');
    }
};

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
    sender: Runtime.MessageSender,
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
