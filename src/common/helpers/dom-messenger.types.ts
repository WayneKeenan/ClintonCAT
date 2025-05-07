import { IElementData } from '@/common/services/content-scanner.types';

export interface IDOMMessengerInterface {
    querySelectorAll(selector: string): Promise<IElementData[]>;
    querySelector(selector: string): Promise<IElementData | undefined | null>;
    querySelectorByParentId(id: string, selector: string): Promise<IElementData | undefined | null>;
    querySelectorAllAsText(selector: string): Promise<string>;
    createElement(parentId: string, element: string, html: string): Promise<void>;
    showInPageNotification(message: string): Promise<unknown>;
}

export enum DOMMessengerAction {
    DOM_QUERY_SELECTOR_ALL = 'DOM_QUERY_SELECTOR_ALL',
    DOM_QUERY_SELECTOR_ALL_AS_TEXT = 'DOM_QUERY_SELECTOR_ALL_AS_TEXT',
    DOM_QUERY_SELECTOR = 'DOM_QUERY_SELECTOR',
    DOM_QUERY_SELECTOR_BY_PARENT_ID = 'DOM_QUERY_SELECTOR_BY_PARENT_ID',
    DOM_CREATE_ELEMENT = 'DOM_CREATE_ELEMENT',
    DOM_SHOW_IN_PAGE_NOTIFICATION = 'DOM_SHOW_IN_PAGE_NOTIFICATION',
}

export interface IShowInPageNotificationPayload {
    message: string;
}
