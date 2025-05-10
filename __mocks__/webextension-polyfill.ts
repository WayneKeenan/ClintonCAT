import { Action, Notifications, Runtime, Tabs } from 'webextension-polyfill';

const CONFIG = {
    ENABLE_LOGGING: true,
};

function log(...args: unknown[]) {
    if (!CONFIG.ENABLE_LOGGING) return;
    console.log(...args);
}

const mockTab: Tabs.Tab = {
    id: 1,
    index: 0,
    pinned: false,
    highlighted: false,
    active: true,
    incognito: false,
    windowId: 1,
    url: 'https://example.com',
    title: 'Example',
};

function createUpdateFunction() {
    interface UpdateFunctionType {
        (tabId: number | undefined, updateProperties: Tabs.UpdateUpdatePropertiesType): Promise<Tabs.Tab>;
        (updateProperties: Tabs.UpdateUpdatePropertiesType): Promise<Tabs.Tab>;
    }

    const updateImpl = (
        tabIdOrUpdateProperties: number | undefined | Tabs.UpdateUpdatePropertiesType,
        maybeUpdateProperties?: Tabs.UpdateUpdatePropertiesType
    ): Promise<Tabs.Tab> => {
        if (
            arguments.length === 2 ||
            typeof tabIdOrUpdateProperties === 'number' ||
            tabIdOrUpdateProperties === undefined
        ) {
            // First overload: update(tabId, updateProperties)
            const updateProperties: Tabs.UpdateUpdatePropertiesType = maybeUpdateProperties ?? {};

            const tabId = tabIdOrUpdateProperties as number | undefined;
            log(`Updating tab with ID: ${tabId ?? 'undefined'}`);

            return Promise.resolve({ ...mockTab, ...updateProperties });
        } else {
            // Second overload: update(updateProperties)
            return Promise.resolve({ ...mockTab, ...tabIdOrUpdateProperties });
        }
    };

    return jest.fn(updateImpl) as jest.Mock & UpdateFunctionType;
}

const browserMock = {
    runtime: {
        lastError: undefined,
        onMessage: {
            addListener: jest.fn(),
            hasListener: jest.fn(),
            removeListener: jest.fn(),
        },
        getURL: jest.fn((path: string) => `mocked-url/${path}`),
        sendMessage: jest.fn((message: unknown, options?: Runtime.SendMessageOptionsType) => {
            log('Mocked sendMessage called with:', message, options);
            return Promise.resolve();
        }),
    } as Partial<Runtime.Static>,

    notifications: {
        create: jest.fn((notificationId: string, options: Notifications.CreateNotificationOptions) => {
            log('Mocked notifications.create called with:', notificationId, options);
            return Promise.resolve(notificationId);
        }),
        clear: jest.fn((notificationId: string) => {
            log('Mocked notifications.clear called with:', notificationId);
            return Promise.resolve(true);
        }),
    },

    action: {
        setBadgeText: jest.fn((details: Action.SetBadgeTextDetailsType) => {
            log('Mocked action.setBadgeText called with:', details);
            return Promise.resolve();
        }),
        setBadgeBackgroundColor: jest.fn((details: Action.SetBadgeBackgroundColorDetailsType) => {
            log('Mocked action.setBadgeBackgroundColor called with:', details);
            return Promise.resolve();
        }),
        setIcon: jest.fn((details: Action.SetIconDetailsType) => {
            log('Mocked action.setIcon called with:', details);
            return Promise.resolve();
        }),
        setPopup: jest.fn((details: Action.SetPopupDetailsType) => {
            log('Mocked action.setPopup called with:', details);
            return Promise.resolve();
        }),
        getPopup: jest.fn((details: Action.Details) => {
            log('Mocked action.getPopup called', details);
            return Promise.resolve('');
        }),
        getBadgeText: jest.fn((details: Action.Details) => {
            log('Mocked action.getBadgeText called', details);
            return Promise.resolve('');
        }),
        enable: jest.fn((tabId: number) => {
            log('Mocked action.enable called with tabId:', tabId);
            return Promise.resolve();
        }),
    } as Partial<Action.Static>,

    tabs: {
        query: jest.fn((queryInfo: Tabs.QueryQueryInfoType) => {
            log('Mocked tabs.query called with:', queryInfo);
            return Promise.resolve([mockTab]);
        }),

        create: jest.fn((createProperties: Tabs.CreateCreatePropertiesType) => {
            log('Mocked tabs.create called with:', createProperties);
            return Promise.resolve(mockTab);
        }),

        update: createUpdateFunction(),

        sendMessage: jest.fn(
            <TMessage = unknown, TResponse = unknown>(
                tabId: number,
                message: TMessage,
                options?: Tabs.SendMessageOptionsType
            ): Promise<TResponse> => {
                log('Mocked tabs.sendMessage called with tabId:', tabId, 'message:', message, 'options:', options);
                return Promise.resolve(undefined as TResponse);
            }
        ),
    } as Partial<Tabs.Static>,
};

export default browserMock;
