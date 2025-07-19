import React from 'react';

import { IPageEntry, PageEntry } from '@/database';

import LocalStorage from '@/utils/helpers/local-storage';

export interface IInpagenotificationPage {
    page: PageEntry;
}

/**
 *
 * @param param0 InpagenotificationPageProps
 * @returns React
 *
 * Creates a React to display page info
 *
 * It will only be displayed if the user has previously not dismissed it.
 *
 * TODO: I think the dismiss should de depend on when the page was last updated.
 *  I would sugges that we add page.lastmodifyed or something,
 *  dismiss could also have a time component.
 */
const InpagenotificationPage = ({ page }: IInpagenotificationPage) => {
    const componentReferance = React.createRef<HTMLParagraphElement>();

    // TODO: should localStorage be a helper ? or should another aproact be made, would clean up the code a bit.
    const now = Date.now();
    const storedPage = LocalStorage.readPage(page.pageId);

    const showPage = now > storedPage.timestamp + 60 * 60 * 1000; // curent mute 1 hour, TODO: should come from an option.

    const closePage = () => {
        const storedPage = LocalStorage.readPage(page.pageId);

        storedPage.timestamp = Date.now();

        LocalStorage.writePage(storedPage);
        LocalStorage.save();

        if (componentReferance) {
            componentReferance.current?.remove();
        }
    };

    if (showPage) {
        return (
            <>
                <p className="pageItem" ref={componentReferance}>
                    <a href={page.url()} target="_blank">
                        {page.pageTitle}
                    </a>
                    <span className="close" onClick={closePage}>
                        ✖
                    </span>
                </p>
            </>
        );
    } else {
        return <></>;
    }
};

export interface IInpagenotificationMessage {
    message: string;
}

/**
 *
 * @param param0 InpagenotificationMessageProps
 * @returns React
 *
 * Creates a React to display message
 */
const InpagenotificationMessage = ({ message }: IInpagenotificationMessage) => {
    if (message && message.length > 0) {
        return (
            <>
                <p className="pageItem">{message}</p>
            </>
        );
    } else {
        return <></>;
    }
};

export interface IInpagenotification {
    containerId: string;
    message: string;
    pages: IPageEntry[];
}

/**
 *
 * @param param0 InpagenotificationProps
 * @returns React
 *
 * base64 encoded image so that domains cant block it. (eg ikea.com) it blosk it via header
 * curently is based on original size but it shouled propearly be a 1:1 so no scaling overhead.
 *
 * Creates a React object for a inpage notification
 */
const Inpagenotification = ({ containerId, message, pages }: IInpagenotification) => {
    /**
     * timeout even for hiding the notification after a set time
     *
     * TODO: make the time a variable ?
     */
    const timeoutID = setTimeout(() => {
        const container = document.getElementById(containerId);
        if (container) {
            container.remove();
        }
    }, 5000);

    /**
     * close event when nortice is manually hidden.
     */
    const closeNotification = () => {
        const container = document.getElementById(containerId);
        if (timeoutID) {
            clearTimeout(timeoutID);
        }
        if (container) {
            container.remove();
        }
    };

    /**
     * mouse over event of the notice to prevent altu hide
     */
    const mouseOver = () => {
        if (timeoutID) {
            clearTimeout(timeoutID);
        }
    };

    /**
     * recreate PageEntry from object.
     */
    const _pages: PageEntry[] = [];
    pages.forEach((page) => {
        _pages.push(new PageEntry(page));
    });

    /**
     * create a list of InpagenotificationMessage
     */
    const componentPages = _pages.map((page, index) => <InpagenotificationPage key={index} page={page} />);

    return (
        <>
            <style>
                {`
                /**
                 * Start of css cascade prevention
                 */
                :host {
                    all: initial;
                    display: block;

                    /* Block inherited root styles */
                    font-family: system-ui, sans-serif;
                    color: black;
                    --main-color: initial;
                    --some-other-var: initial;
                }

                *, *::before, *::after {
                    all: unset;
                    display: revert;
                    box-sizing: border-box;
                }
                /**
                 * End of css cascade prevention
                 */

                /**
                 * Start Optionally restore HTML5 block elements
                 */
                div, p, h1, h2, h3, h4, h5, h6, section, article, header, footer {
                    display: block;
                }
                div {
                    all: initial;
                }
                body, div {
                    font-family: system-ui, sans-serif;
                    font-size: 14px;
                    color: black;
                    background: white;
                }
                /**
                 * End Optionally restore HTML5 block elements
                 */
                
                /**
                 * Start of css style for notification.
                 */
                .container {
                    background: rgb(255, 255, 255);
                    box-shadow: rgb(0, 0, 0) 0px 4px 40px 3px;
                    padding: 10px;
                    margin: 0px 20px 20px;
                    width: 400px;
                    height: auto;
                    position: fixed;
                    right: 0px;
                    top: 0px;
                    z-index: 2147483647;
                    display: inline-block;
                    border-color: currentcolor red red;
                    border-style: none solid solid;
                    border-width: medium 2px 2px;
                    border-radius: 0px 0px 1rem 1rem;
                }

                .close {
                    float: right;
                    cursor: pointer;
                    font-weight:
                    bold;
                    margin-left: 10px;
                }
                    
                .pageItem {
                    margin-top: 10px;

                    border-radius: 12px;
                    background-color: rgba(0, 0, 0, 0.1);
                    border: 1px solid rgba(0, 0, 0, 0.3);
                    padding: 0.5em;
                    color: #333;
                    max-width: 400px;
                }

                .link {
                    display: flex;
                    height: 100%;
                    align-items: center;
                    min-width: 13.875em;
                }

                a {
                    cursor: revert;
                    color: rgb(75, 119, 214);
                    text-decoration: none;
                }
                `}
            </style>

            <div className="container" onMouseOver={mouseOver}>
                <span className="close" onClick={closeNotification}>
                    ✖
                </span>
                <a className="link" href="https://consumerrights.wiki/" target="_blank">
                    <span>
                        <strong>Consumer Rights Wiki</strong>
                    </span>
                </a>
                <InpagenotificationMessage message={message} />
                {componentPages}
            </div>
        </>
    );
};

export default Inpagenotification;
