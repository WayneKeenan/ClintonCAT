/**
 * @jest-environment ../../../jest/CustomJSDOMEnvironment
 */
/* eslint-disable
   @typescript-eslint/no-explicit-any,
   @typescript-eslint/no-unsafe-assignment,
   @typescript-eslint/no-unsafe-member-access,
   @typescript-eslint/no-unsafe-call,
   @typescript-eslint/unbound-method
*/
import DOMMessenger from './dom-messenger';
import { DOMMessengerAction } from './dom-messenger.types';

describe('DOMMessenger', () => {
    let messenger: DOMMessenger;

    beforeEach(() => {
        // Reset the DOM.
        document.body.innerHTML = '';

        // TODO: extract this to a more sophisticated chrome mock setup
        // Set up minimal chrome mocks on the global object.
        // We assign to (global as any).chrome to avoid conflicts with the @types/chrome declaration.
        (global as any).chrome = {
            tabs: {
                query: jest.fn((_queryInfo: chrome.tabs.QueryInfo, callback: (result: chrome.tabs.Tab[]) => void) => {
                    callback([{ id: 1 } as chrome.tabs.Tab]); // Always return an active tab with id = 1.
                }) as unknown as typeof chrome.tabs.query,
                sendMessage: jest.fn(),
            },
            runtime: {
                // TODO: add more properties as needed
                // We only define the parts we use; cast as any to bypass missing properties.
                lastError: undefined,
                onMessage: {
                    addListener: jest.fn(),
                },
            } as any,
        };

        messenger = new DOMMessenger();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('instance methods', () => {
        test('querySelectorAll returns expected element data array', async () => {
            const expectedResponse = [{ tag: 'DIV', id: 'test', className: 'class', innerText: 'Test' }];
            (chrome.tabs.sendMessage as jest.Mock).mockImplementationOnce((_tabId, _message, callback) => {
                callback(expectedResponse);
            });

            const result = await messenger.querySelectorAll('.my-selector');
            expect(result).toEqual(expectedResponse);
            expect(chrome.tabs.sendMessage).toHaveBeenCalledWith(
                1,
                {
                    action: DOMMessengerAction.DOM_QUERY_SELECTOR_ALL,
                    selector: '.my-selector',
                },
                expect.any(Function)
            );
        });

        test('querySelector returns expected element data', async () => {
            const expectedResponse = {
                tag: 'SPAN',
                id: 'test2',
                className: 'class2',
                innerText: 'Test2',
            };
            (chrome.tabs.sendMessage as jest.Mock).mockImplementationOnce((_tabId, _message, callback) => {
                callback(expectedResponse);
            });

            const result = await messenger.querySelector('.my-selector');
            expect(result).toEqual(expectedResponse);
            expect(chrome.tabs.sendMessage).toHaveBeenCalledWith(
                1,
                {
                    action: DOMMessengerAction.DOM_QUERY_SELECTOR,
                    selector: '.my-selector',
                },
                expect.any(Function)
            );
        });

        test('querySelectorByParentId returns expected element data', async () => {
            const expectedResponse = {
                tag: 'P',
                id: 'test3',
                className: 'class3',
                innerText: 'Test3',
            };
            (chrome.tabs.sendMessage as jest.Mock).mockImplementationOnce((_tabId, _message, callback) => {
                callback(expectedResponse);
            });

            const result = await messenger.querySelectorByParentId('parent1', '.child-selector');
            expect(result).toEqual(expectedResponse);
            expect(chrome.tabs.sendMessage).toHaveBeenCalledWith(
                1,
                {
                    action: DOMMessengerAction.DOM_QUERY_SELECTOR_BY_PARENT_ID,
                    id: 'parent1',
                    selector: '.child-selector',
                },
                expect.any(Function)
            );
        });

        test('querySelectorAllAsText returns expected text', async () => {
            const expectedResponse = 'Some text content';
            (chrome.tabs.sendMessage as jest.Mock).mockImplementationOnce((_tabId, _message, callback) => {
                callback(expectedResponse);
            });

            const result = await messenger.querySelectorAllAsText('.text-selector');
            expect(result).toEqual(expectedResponse);
            expect(chrome.tabs.sendMessage).toHaveBeenCalledWith(
                1,
                {
                    action: DOMMessengerAction.DOM_QUERY_SELECTOR_ALL_AS_TEXT,
                    selector: '.text-selector',
                },
                expect.any(Function)
            );
        });

        test('createElement sends correct message and resolves', async () => {
            (chrome.tabs.sendMessage as jest.Mock).mockImplementationOnce((_tabId, _message, callback) => {
                callback();
            });

            await expect(messenger.createElement('parent1', 'div', '<p>Hello</p>')).resolves.toBeUndefined();
            expect(chrome.tabs.sendMessage).toHaveBeenCalledWith(
                1,
                {
                    action: DOMMessengerAction.DOM_CREATE_ELEMENT,
                    id: 'parent1',
                    element: 'div',
                    html: '<p>Hello</p>',
                },
                expect.any(Function)
            );
        });

        test('sendMessageToCurrentTab throws error if no active tab found', async () => {
            // Override chrome.tabs.query to return no active tab.
            (chrome.tabs.query as jest.Mock).mockImplementationOnce((_queryInfo, callback) => {
                callback([]);
            });
            await expect(messenger.querySelector('.my-selector')).rejects.toThrow('No active tab found');
        });
    });

    describe('registerMessageListener (static method)', () => {
        let listener: (
            message: any,
            sender: chrome.runtime.MessageSender,
            sendResponse: (response?: any) => void
        ) => void;

        beforeEach(() => {
            (chrome.runtime.onMessage.addListener as jest.Mock).mockClear();
            DOMMessenger.registerMessageListener();
            listener = (chrome.runtime.onMessage.addListener as jest.Mock).mock.calls[0][0];
        });

        test('registers a message listener', () => {
            expect(chrome.runtime.onMessage.addListener).toHaveBeenCalled();
        });

        test('handles DOM_QUERY_SELECTOR_ALL correctly', () => {
            document.body.innerHTML = `
        <div id="elem1" class="cls">Content1</div>
        <div id="elem2" class="cls">Content2</div>
      `;
            const sendResponse = jest.fn();
            listener(
                { action: DOMMessengerAction.DOM_QUERY_SELECTOR_ALL, selector: 'div' },
                {} as chrome.runtime.MessageSender,
                sendResponse
            );
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
            listener(
                { action: DOMMessengerAction.DOM_QUERY_SELECTOR, selector: 'span' },
                {} as chrome.runtime.MessageSender,
                sendResponse
            );
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
                {} as chrome.runtime.MessageSender,
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
            listener(
                { action: DOMMessengerAction.DOM_QUERY_SELECTOR_ALL_AS_TEXT, selector: 'div' },
                {} as chrome.runtime.MessageSender,
                sendResponse
            );
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
                {} as chrome.runtime.MessageSender,
                sendResponse
            );
            const parent = document.getElementById('parent');
            expect(parent?.innerHTML).toContain('<span');
            expect(parent?.innerHTML).toContain('<strong>Bold</strong>');
        });
        test('handles DOM_SHOW_IN_PAGE_NOTIFICATION correctly', () => {
            const sendResponse = jest.fn();
            const testMessage = 'Hello from test!';
            listener(
                { action: DOMMessengerAction.DOM_SHOW_IN_PAGE_NOTIFICATION, message: testMessage },
                {} as chrome.runtime.MessageSender,
                sendResponse
            );

            const container = document.getElementById('clint-cat-notification-container');
            expect(container).not.toBeNull();
            expect(container?.style.position).toBe('fixed');
            expect(container?.children.length).toBeGreaterThan(0);
            const notificationElement = container?.children[0] as HTMLElement;
            expect(notificationElement).not.toBeNull();
            expect(notificationElement.textContent).toContain(testMessage);
            expect(notificationElement.childNodes[0].nodeValue).toBe(testMessage);
            expect(notificationElement.querySelector('button')).not.toBeNull();
            expect(sendResponse).toHaveBeenCalledWith({ success: true });
        });
        test('handles DOM_SHOW_IN_PAGE_NOTIFICATION throws error if message is missing', () => {
            const sendResponse = jest.fn();
            expect(() => {
                listener(
                    { action: DOMMessengerAction.DOM_SHOW_IN_PAGE_NOTIFICATION } as any,
                    {} as chrome.runtime.MessageSender,
                    sendResponse
                );
            }).toThrow('DOM_SHOW_IN_PAGE_NOTIFICATION requires a message');
            expect(sendResponse).not.toHaveBeenCalled();
        });
    });
});
