import { Runtime, Notifications } from 'webextension-polyfill';

jest.mock('webextension-polyfill', () => ({
    runtime: {
        lastError: undefined,
        onMessage: {
            addListener: jest.fn(),
            removeListener: jest.fn(),
        },
        getURL: jest.fn((path: string) => `mocked-url/${path}`),
        sendMessage: jest.fn((message: unknown, options?: Runtime.SendMessageOptionsType) => {
            console.log('Mocked sendMessage called with:', message, options);
            return Promise.resolve();
        }),
    },
    notifications: {
        create: jest.fn((options: Notifications.CreateNotificationOptions) => {
            console.log('Mocked notifications.create called with:', options);
            return Promise.resolve('mocked-notification-id');
        }),
        clear: jest.fn((notificationId: string) => {
            console.log('Mocked notifications.clear called with:', notificationId);
            return Promise.resolve(true);
        }),
    },
}));
