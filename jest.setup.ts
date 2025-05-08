import { Runtime, Notifications, Action } from 'webextension-polyfill';

jest.mock('webextension-polyfill', () => ({
    runtime: {
        lastError: undefined,
        onMessage: {
            addListener: jest.fn(),
            hasListener: jest.fn(),
            removeListener: jest.fn(),
        },
        getURL: jest.fn((path: string) => `mocked-url/${path}`),
        sendMessage: jest.fn((message: unknown, options?: Runtime.SendMessageOptionsType) => {
            console.log('Mocked sendMessage called with:', message, options);
            return Promise.resolve();
        }),
    } as Partial<Runtime.Static>,

    notifications: {
        create: jest.fn((notificationId: string, options: Notifications.CreateNotificationOptions) => {
            console.log('Mocked notifications.create called with:', notificationId, options);
            return Promise.resolve(notificationId);
        }),
        clear: jest.fn((notificationId: string) => {
            console.log('Mocked notifications.clear called with:', notificationId);
            return Promise.resolve(true);
        }),
    },

    action: {
        setBadgeText: jest.fn((details: { text: string }) => {
            console.log('Mocked action.setBadgeText called with:', details);
            return Promise.resolve();
        }),
        setBadgeBackgroundColor: jest.fn((details: { color: string }) => {
            console.log('Mocked action.setBadgeBackgroundColor called with:', details);
            return Promise.resolve();
        }),
        setIcon: jest.fn((details: { path: string }) => {
            console.log('Mocked action.setIcon called with:', details);
            return Promise.resolve();
        }),
        setPopup: jest.fn((details: { popup: string }) => {
            console.log('Mocked action.setPopup called with:', details);
            return Promise.resolve();
        }),
        getPopup: jest.fn(() => {
            console.log('Mocked action.getPopup called');
            return Promise.resolve('');
        }),
        getBadgeText: jest.fn(() => {
            console.log('Mocked action.getBadgeText called');
            return Promise.resolve('');
        }),
        enable: jest.fn((tabId: number) => {
            console.log('Mocked action.enable called with tabId:', tabId);
            return Promise.resolve();
        }),
    } as Partial<Action.Static>,
}));
