import { IElementData } from '@/common/services/content-scanner.types';
import { DOMMessengerAction, IDOMMessengerInterface, IShowInPageNotificationPayload } from './dom-messenger.types';
import browser from 'webextension-polyfill';
import makeId from '@/utils/helpers/makeid';

import React from 'react';
import { createRoot } from 'react-dom/client';

import Inspagenotification from '@/ui/inpagenotification/Inspagenotification';

import { IPage, Page } from '@/models/page';

type DOMMessagePayload =
    | { action: DOMMessengerAction.DOM_QUERY_SELECTOR_ALL; selector: string }
    | { action: DOMMessengerAction.DOM_QUERY_SELECTOR_ALL_AS_TEXT; selector: string }
    | { action: DOMMessengerAction.DOM_QUERY_SELECTOR; selector: string }
    | { action: DOMMessengerAction.DOM_QUERY_SELECTOR_BY_PARENT_ID; id: string; selector: string }
    | { action: DOMMessengerAction.DOM_CREATE_ELEMENT; id: string; element: string; html: string }
    | ({
          action: DOMMessengerAction.DOM_SHOW_IN_PAGE_NOTIFICATION;
          pages: IPage[];
      } & IShowInPageNotificationPayload);

declare global {
    interface Window {
        __DOMMessengerListenerRegistered?: boolean;
    }
}

class DOMMessenger implements IDOMMessengerInterface {
    public async querySelectorAll(selector: string): Promise<IElementData[]> {
        console.log('querySelectorAll: ', selector);
        return (await this.sendMessageToCurrentTab({
            action: DOMMessengerAction.DOM_QUERY_SELECTOR_ALL,
            selector: selector,
        })) as IElementData[];
    }

    // TODO: fix case when using id, e.g. '#product1 .h2' becomes ''# .h2' in the browser
    public async querySelector(selector: string): Promise<IElementData | null> {
        console.log('querySelector: ', selector);
        return (await this.sendMessageToCurrentTab({
            action: DOMMessengerAction.DOM_QUERY_SELECTOR,
            selector: selector,
        })) as IElementData;
    }

    public async querySelectorByParentId(id: string, selector: string): Promise<IElementData | undefined | null> {
        console.log('querySelectorById: ', id, selector);
        return (await this.sendMessageToCurrentTab({
            action: DOMMessengerAction.DOM_QUERY_SELECTOR_BY_PARENT_ID,
            id: id,
            selector: selector,
        })) as IElementData;
    }

    public async querySelectorAllAsText(selector: string): Promise<string> {
        console.log('querySelectorAll (as text): ', selector);
        return (await this.sendMessageToCurrentTab({
            action: DOMMessengerAction.DOM_QUERY_SELECTOR_ALL_AS_TEXT,
            selector: selector,
        })) as string;
    }

    public async createElement(parentId: string, element: string, html: string): Promise<void> {
        console.log('createElement (id, element, html): ', parentId, element, html);
        await this.sendMessageToCurrentTab({
            action: DOMMessengerAction.DOM_CREATE_ELEMENT,
            id: parentId,
            element: element,
            html: html,
        });
    }

    public async showInPageNotification(message: string, pages: Page[]): Promise<unknown> {
        console.log('showInPageNotification1: ', message);
        console.log('showInPageNotification2: ', pages);
        return await this.sendMessageToCurrentTab({
            action: DOMMessengerAction.DOM_SHOW_IN_PAGE_NOTIFICATION,
            message: message,
            pages: pages.map((page) => page.toJSON()),
        });
    }

    public async setBadgeText(text: string): Promise<unknown> {
        console.log('Setting badge text: ', text);
        const tab = await this.getCurrentTab();
        return await browser.action.setBadgeText({
            text: text,
            tabId: tab.id,
        });
    }

    // TODO: createElementWithChildSelector ?
    // public async createElementWithChildSelector(
    //     parentId: string,
    //     selector: string,
    //     newElement: string,
    //     html: string
    // ): Promise<void> {}

    // TODO: Execute JS?
    // see: https://developer.chrome.com/docs/extensions/reference/api/scripting
    // see:https://stackoverflow.com/questions/69348933/execute-javascript-in-a-new-tab-using-chrome-extension
    // see: https://developer.chrome.com/docs/extensions/reference/api/scripting

    // public async executeJSHelper() {
    //     const getTabId = () => {
    //         return this.getCurrentTab();
    //     };
    //     function getUserColor() {
    //         return 'green';
    //     }
    //     function changeBackgroundColor(backgroundColor: string) {
    //         document.body.style.backgroundColor = backgroundColor;
    //     }
    //
    //     browser.scripting
    //         .executeScript({
    //             target: { xtabId: getTabId() },
    //             func: changeBackgroundColor,
    //             args: [getUserColor()],
    //             world: 'MAIN',
    //         })
    //         .then(() => console.log('injected a function'));
    // }

    // ---

    private async sendMessageToCurrentTab(message: DOMMessagePayload): Promise<unknown> {
        const tab = await this.getCurrentTab();

        if (!tab.id) {
            throw new Error('No active tab found');
        }
        return await browser.tabs.sendMessage(tab.id, message);
    }

    private async getCurrentTab(): Promise<browser.Tabs.Tab> {
        const tabs = await browser.tabs.query({ active: true, currentWindow: true });
        return tabs[0];
    }

    private static elementDataFromNode(element: HTMLElement | null | undefined): IElementData | undefined {
        if (!element) {
            return undefined;
        } else {
            return {
                tag: element.tagName,
                id: element.id,
                className: element.className,
                innerText: element.innerText,
            } as IElementData;
        }
    }

    private static elementDataFromNodes(nodes: NodeListOf<HTMLElement>): (IElementData | undefined | null)[] {
        return Array.from(nodes).map((node) => DOMMessenger.elementDataFromNode(node));
    }

    public static registerMessageListener() {
        browser.runtime.onMessage.addListener((message, _sender, sendResponse) => {
            const typedMessage = message as DOMMessagePayload;

            switch (typedMessage.action) {
                case DOMMessengerAction.DOM_QUERY_SELECTOR_ALL: {
                    if (!typedMessage.selector) {
                        throw new Error(`DOM_QUERY_SELECTOR_ALL requires a selector`);
                    }
                    const nodes: NodeListOf<HTMLElement> = document.querySelectorAll(typedMessage.selector);
                    const elementData = DOMMessenger.elementDataFromNodes(nodes);
                    // It doesn't seem possible to send a NodeList (as-is, cloned or deep copied) via `sendResponse`
                    sendResponse(elementData);
                    break;
                }

                case DOMMessengerAction.DOM_QUERY_SELECTOR: {
                    if (!typedMessage.selector) {
                        throw new Error(`DOM_QUERY_SELECTOR requires a selector`);
                    }
                    const element: HTMLElement | null = document.querySelector(typedMessage.selector);
                    sendResponse(DOMMessenger.elementDataFromNode(element));
                    break;
                }

                case DOMMessengerAction.DOM_QUERY_SELECTOR_BY_PARENT_ID: {
                    if (!typedMessage.selector) {
                        throw new Error(`DOM_QUERY_SELECTOR_BY_PARENT_ID requires a selector`);
                    }
                    if (!typedMessage.id) {
                        throw new Error(`DOM_QUERY_SELECTOR_BY_PARENT_ID requires an id`);
                    }
                    const parent = document.getElementById(typedMessage.id);
                    const element: HTMLElement | null | undefined = parent?.querySelector(typedMessage.selector);
                    sendResponse(DOMMessenger.elementDataFromNode(element));
                    break;
                }

                case DOMMessengerAction.DOM_QUERY_SELECTOR_ALL_AS_TEXT: {
                    if (!typedMessage.selector) {
                        throw new Error(`DOM_QUERY_SELECTOR_ALL_AS_TEXT requires a selector`);
                    }
                    const nodes: NodeListOf<HTMLElement> = document.querySelectorAll(typedMessage.selector);
                    const text = Array.from(nodes)
                        .map((node) => (node.textContent ?? '') + node.innerText)
                        .join('\n');
                    sendResponse(text);
                    break;
                }

                case DOMMessengerAction.DOM_CREATE_ELEMENT: {
                    if (!typedMessage.id) {
                        throw new Error(`DOM_CREATE_ELEMENT requires an id`);
                    }
                    if (!typedMessage.element) {
                        throw new Error(`DOM_CREATE_ELEMENT requires an element`);
                    }
                    if (!typedMessage.html) {
                        throw new Error(`DOM_CREATE_ELEMENT requires html`);
                    }
                    const parent = document.getElementById(typedMessage.id);
                    if (parent) {
                        const newElement = document.createElement(typedMessage.element);
                        console.log('DOM_CREATE_ELEMENT html: ', typedMessage.html);

                        newElement.innerHTML = typedMessage.html;
                        try {
                            parent.appendChild(newElement);
                        } catch (error) {
                            console.log('DOM_CREATE_ELEMENT failed ', error);
                        }
                    }

                    break;
                }
                case DOMMessengerAction.DOM_SHOW_IN_PAGE_NOTIFICATION: {
                    if (!typedMessage.message && !typedMessage.pages?.length) {
                        throw new Error(`DOM_SHOW_IN_PAGE_NOTIFICATION requires a message or pages`);
                    }
                    DOMMessenger.displayNotification(typedMessage.message, typedMessage.pages);
                    sendResponse({ success: true });
                    break;
                }
                default:
                    break;
            }

            // Return true for async operations
            return true;
        });
    }

    /*
        makeId unique maybe this should be eutils helper ?
        Original code from https://stackoverflow.com/questions/1349404/generate-a-string-of-random-characters
    */
    static elementId: string = '';
    public static containerId(): string {
        if (DOMMessenger.elementId == '') {
            DOMMessenger.elementId = makeId();
        }
        return DOMMessenger.elementId;
    }

    private static displayNotification(message: string, pages: IPage[]): void {
        const containerId = DOMMessenger.containerId();

        /**
         * remove the exsisting container, so a new can be created.
         */
        let host = document.getElementById(containerId);
        host?.remove();

        host = document.createElement('div');
        host.id = containerId;

        const shadow = host.attachShadow({ mode: 'open' }); // should we use closed to protect the content ?

        createRoot(shadow).render(
            React.createElement(Inspagenotification, { containerId: containerId, message: message, pages: pages })
        );

        document.body.appendChild(host);
    }
}

export default DOMMessenger;
