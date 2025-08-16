/**
 * @jest-environment ../../../jest/CustomJSDOMEnvironment
 */
/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment */
import browser from 'webextension-polyfill';
import DOMMessenger from './dom-messenger';
import { DOMMessengerAction, IShowInPageNotificationPayload } from './dom-messenger.types';
import { IPage } from '@/models/page';
import { CompanyPage } from '@/models/company';

type MessagePayload =
    | { action: DOMMessengerAction.DOM_QUERY_SELECTOR_ALL; selector: string }
    | { action: DOMMessengerAction.DOM_QUERY_SELECTOR; selector: string }
    | { action: DOMMessengerAction.DOM_QUERY_SELECTOR_BY_PARENT_ID; id: string; selector: string }
    | { action: DOMMessengerAction.DOM_QUERY_SELECTOR_ALL_AS_TEXT; selector: string }
    | { action: DOMMessengerAction.DOM_CREATE_ELEMENT; id: string; element: string; html: string }
    | ({
          action: DOMMessengerAction.DOM_SHOW_IN_PAGE_NOTIFICATION;
          pages: IPage[];
      } & IShowInPageNotificationPayload);

type MessageListener = (
    message: MessagePayload,
    sender: Record<string, unknown>,
    sendResponse: (response?: unknown) => void
) => boolean | undefined;

describe('DOMMessenger', () => {
    let messenger: DOMMessenger;

    beforeEach(() => {
        document.body.innerHTML = '';
        jest.clearAllMocks();

        (browser.tabs.query as jest.Mock).mockClear();
        (browser.tabs.query as jest.Mock).mockResolvedValue([
            {
                id: 1,
                url: 'https://example.com',
                active: true,
            },
        ]);

        messenger = new DOMMessenger();
    });

    describe('instance methods', () => {
        test('querySelectorAll returns expected element data array', async () => {
            const expectedResponse = [{ tag: 'DIV', id: 'test', className: 'class', innerText: 'Test' }];
            (browser.tabs.sendMessage as jest.Mock).mockResolvedValue(expectedResponse);

            const result = await messenger.querySelectorAll('.my-selector');
            expect(result).toEqual(expectedResponse);
            expect(browser.tabs.sendMessage).toHaveBeenCalledWith(1, {
                action: DOMMessengerAction.DOM_QUERY_SELECTOR_ALL,
                selector: '.my-selector',
            });
        });

        test('querySelector returns expected element data', async () => {
            const expectedResponse = {
                tag: 'SPAN',
                id: 'test2',
                className: 'class2',
                innerText: 'Test2',
            };
            (browser.tabs.sendMessage as jest.Mock).mockResolvedValue(expectedResponse);

            const result = await messenger.querySelector('.my-selector');
            expect(result).toEqual(expectedResponse);
            expect(browser.tabs.sendMessage).toHaveBeenCalledWith(1, {
                action: DOMMessengerAction.DOM_QUERY_SELECTOR,
                selector: '.my-selector',
            });
        });

        test('querySelectorByParentId returns expected element data', async () => {
            const expectedResponse = {
                tag: 'P',
                id: 'test3',
                className: 'class3',
                innerText: 'Test3',
            };
            (browser.tabs.sendMessage as jest.Mock).mockResolvedValue(expectedResponse);

            const result = await messenger.querySelectorByParentId('parent1', '.child-selector');
            expect(result).toEqual(expectedResponse);
            expect(browser.tabs.sendMessage).toHaveBeenCalledWith(1, {
                action: DOMMessengerAction.DOM_QUERY_SELECTOR_BY_PARENT_ID,
                id: 'parent1',
                selector: '.child-selector',
            });
        });

        test('querySelectorAllAsText returns expected text', async () => {
            const expectedResponse = 'Some text content';
            (browser.tabs.sendMessage as jest.Mock).mockResolvedValue(expectedResponse);

            const result = await messenger.querySelectorAllAsText('.text-selector');
            expect(result).toEqual(expectedResponse);
            expect(browser.tabs.sendMessage).toHaveBeenCalledWith(1, {
                action: DOMMessengerAction.DOM_QUERY_SELECTOR_ALL_AS_TEXT,
                selector: '.text-selector',
            });
        });

        test('createElement sends correct message and resolves', async () => {
            (browser.tabs.sendMessage as jest.Mock).mockResolvedValue(undefined);

            await expect(messenger.createElement('parent1', 'div', '<p>Hello</p>')).resolves.toBeUndefined();
            expect(browser.tabs.sendMessage).toHaveBeenCalledWith(1, {
                action: DOMMessengerAction.DOM_CREATE_ELEMENT,
                id: 'parent1',
                element: 'div',
                html: '<p>Hello</p>',
            });
        });

        test('sendMessageToCurrentTab throws error when no active tab found', async () => {
            // Override browser.tabs.query to return no active tab.
            (browser.tabs.query as jest.Mock).mockResolvedValue([]);
            await expect(messenger.querySelector('.my-selector')).rejects.toThrow();
        });
    });

    describe('registerMessageListener (static method)', () => {
        let listener: MessageListener;

        beforeEach(() => {
            (browser.runtime.onMessage.addListener as jest.Mock).mockClear();
            DOMMessenger.registerMessageListener();
            listener = (browser.runtime.onMessage.addListener as jest.Mock).mock.calls[0][0];
        });

        test('registers a message listener', () => {
            expect(browser.runtime.onMessage.addListener).toHaveBeenCalled();
        });

        test('handles DOM_QUERY_SELECTOR_ALL correctly', () => {
            document.body.innerHTML = `
                <div id="elem1" class="cls">Content1</div>
                <div id="elem2" class="cls">Content2</div>
            `;
            const sendResponse = jest.fn();
            listener({ action: DOMMessengerAction.DOM_QUERY_SELECTOR_ALL, selector: 'div' }, {}, sendResponse);
            expect(sendResponse).toHaveBeenCalled();
            const response = sendResponse.mock.calls[0][0];
            expect(Array.isArray(response)).toBe(true);
            expect(response.length).toBe(2);
            expect(response[0]).toMatchObject({
                tag: 'DIV',
                id: 'elem1',
                className: 'cls',
                innerText: 'Content1',
            });
            expect(response[1]).toMatchObject({
                tag: 'DIV',
                id: 'elem2',
                className: 'cls',
                innerText: 'Content2',
            });
        });

        test('handles DOM_QUERY_SELECTOR correctly', () => {
            document.body.innerHTML = `<span id="span1" class="scls">SpanContent</span>`;
            const sendResponse = jest.fn();
            listener({ action: DOMMessengerAction.DOM_QUERY_SELECTOR, selector: 'span' }, {}, sendResponse);
            expect(sendResponse).toHaveBeenCalled();
            const response = sendResponse.mock.calls[0][0];
            expect(response).toMatchObject({
                tag: 'SPAN',
                id: 'span1',
                className: 'scls',
                innerText: 'SpanContent',
            });
        });

        test('handles DOM_QUERY_SELECTOR_BY_PARENT_ID correctly', () => {
            document.body.innerHTML = `<div id="parent"><p id="child" class="childCls">Paragraph</p></div>`;
            const sendResponse = jest.fn();
            listener(
                { action: DOMMessengerAction.DOM_QUERY_SELECTOR_BY_PARENT_ID, id: 'parent', selector: 'p' },
                {},
                sendResponse
            );
            expect(sendResponse).toHaveBeenCalled();
            const response = sendResponse.mock.calls[0][0];
            expect(response).toMatchObject({
                tag: 'P',
                id: 'child',
                className: 'childCls',
                innerText: 'Paragraph',
            });
        });

        test('handles DOM_QUERY_SELECTOR_ALL_AS_TEXT correctly', () => {
            document.body.innerHTML = `<div>First</div><div>Second</div>`;
            const sendResponse = jest.fn();
            listener({ action: DOMMessengerAction.DOM_QUERY_SELECTOR_ALL_AS_TEXT, selector: 'div' }, {}, sendResponse);
            expect(sendResponse).toHaveBeenCalled();
            const response = sendResponse.mock.calls[0][0];
            expect(response).toContain('First');
            expect(response).toContain('Second');
        });

        test('handles DOM_CREATE_ELEMENT correctly', () => {
            document.body.innerHTML = `<div id="parent"></div>`;
            const sendResponse = jest.fn();
            listener(
                {
                    action: DOMMessengerAction.DOM_CREATE_ELEMENT,
                    id: 'parent',
                    element: 'span',
                    html: '<strong>Bold</strong>',
                },
                {},
                sendResponse
            );
            const parent = document.getElementById('parent');
            expect(parent?.innerHTML).toContain('<span');
            expect(parent?.innerHTML).toContain('<strong>Bold</strong>');
        });

        test('handles DOM_SHOW_IN_PAGE_NOTIFICATION correctly', async () => {
            const sendResponse = jest.fn();
            const testMessage = 'Hello from test!';

            const testPage = CompanyPage.fromCargoExport({
                PageID: '1',
                PageName: 'title',
                Description: 'test company',
                Industry: '',
                ParentCompany: '',
                Type: '',
                Website: '',
            });

            const pages = [testPage];

            listener(
                { action: DOMMessengerAction.DOM_SHOW_IN_PAGE_NOTIFICATION, message: testMessage, pages: pages },
                {},
                sendResponse
            );

            const container = document.getElementById(DOMMessenger.containerId());

            expect(container).not.toBeNull();

            const shadow = container?.shadowRoot;

            //Wait 100ms to let it render
            await new Promise((resolve) => setTimeout(resolve, 100));

            const styleElement = shadow?.children[0] as HTMLElement;
            expect(styleElement).not.toBeNull();
            expect(styleElement.nodeName.toLowerCase()).toBe('style');

            const containerElement = shadow?.children[1] as HTMLElement;
            expect(containerElement).not.toBeNull();
            expect(containerElement.nodeName.toLowerCase()).toBe('div');
            expect(containerElement.textContent).toContain(testMessage);
            expect(containerElement.textContent).toContain(testPage.pageName);
            expect(containerElement?.children.length).toBeGreaterThan(0);
            expect(containerElement.textContent).toContain(testMessage);

            expect(sendResponse).toHaveBeenCalledWith({ success: true });
        });

        test('handles DOM_SHOW_IN_PAGE_NOTIFICATION throws error if message is missing', () => {
            const sendResponse = jest.fn();
            const invalidPayload: Pick<MessagePayload, 'action'> = {
                action: DOMMessengerAction.DOM_SHOW_IN_PAGE_NOTIFICATION,
            };
            expect(() => {
                listener(invalidPayload as MessagePayload, {}, sendResponse);
            }).toThrow('DOM_SHOW_IN_PAGE_NOTIFICATION requires a message');
            expect(sendResponse).not.toHaveBeenCalled();
        });
    });
});
