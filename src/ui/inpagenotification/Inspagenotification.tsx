import React from 'react';

import { ArticleType, IPage, Page } from '@/models/page';
import LocalStorage from '@/utils/helpers/local-storage';
import { CompanyPage, ICompanyPage } from '@/models/company';
import { IIncidentPage, IncidentPage } from '@/models/incident';
import { IProductPage, ProductPage } from '@/models/product';
import { IProductLinePage, ProductLinePage } from '@/models/product-line';

export interface IInpagenotificationPage {
    page: Page;
}

const InpagenotificationPage = ({ page }: IInpagenotificationPage) => {
    const componentReferance = React.createRef<HTMLParagraphElement>();

    const showPage = Date.now() > LocalStorage.readPage(page.pageId).timestamp + 60 * 60 * 1000; // curent mute 1 hour, TODO: should come from an option.

    const closePage = () => {
        const storedPage = LocalStorage.readPage(page.pageId);

        storedPage.timestamp = Date.now();

        LocalStorage.writePage(storedPage);

        if (componentReferance) {
            componentReferance.current?.remove();
        }
    };

    const seeMore = (event: React.MouseEvent<HTMLElement>) => {
        event.preventDefault();
        const categoryHeader = event.currentTarget as HTMLElement;
        if (categoryHeader) {
            const categoryContent = categoryHeader.parentElement?.parentElement?.querySelector('.page-info');
            if (categoryContent) {
                categoryContent.classList.toggle('hidden');

                categoryHeader.textContent = categoryContent.classList.contains('hidden') ? '⯈' : '▼';
            }
        }
    };

    if (showPage) {
        return (
            <>
                <div className="page" ref={componentReferance}>
                    <div className="page-menu">
                        <span className="page-more" onClick={seeMore}>
                            ⯈
                        </span>
                        <span className="page-close" onClick={closePage}>
                            ✖
                        </span>
                    </div>
                    <a href={page.url()} target="_blank">
                        {page.pageName}
                    </a>
                    <div className="page-info hidden">{page.description}</div>
                </div>
            </>
        );
    } else {
        return <></>;
    }
};

export interface IInpagenotificationMessage {
    message: string;
}

const InpagenotificationMessage = ({ message }: IInpagenotificationMessage) => {
    if (message && message.length > 0) {
        return (
            <>
                <p className="message">{message}</p>
            </>
        );
    } else {
        return <></>;
    }
};

export interface IInpagenotificationCategory {
    pages: [string, Page[]];
}

const InpagenotificationCategory = ({ pages }: IInpagenotificationCategory) => {
    const categoryTitle = pages[0];
    const pagesList = pages[1];

    if (categoryTitle && pagesList) {
        const cattegoryPages = pagesList.map((page, index) => <InpagenotificationPage key={index} page={page} />);

        const toggleCategory = (event: React.MouseEvent<HTMLElement>) => {
            event.preventDefault();
            const categoryHeader = event.currentTarget as HTMLElement;
            if (categoryHeader) {
                const categoryContent = categoryHeader.parentElement?.querySelector('.category-content');
                const arrow = categoryHeader.querySelector('.arrow');
                const categoryTitle = categoryHeader.nextElementSibling;
                if (categoryContent && arrow && categoryTitle) {
                    categoryContent.classList.toggle('show-content');

                    arrow.textContent = categoryContent.classList.contains('show-content') ? '▼' : '⯈';
                }
            }
        };
        return (
            <>
                <div className="category">
                    <div className="category-header" onClick={toggleCategory}>
                        <span className="arrow">⯈</span> <span className="category-title">{categoryTitle}</span>
                    </div>
                    <div className="category-content">{cattegoryPages}</div>
                </div>
            </>
        );
    } else {
        return <></>;
    }
};

export interface IInpagenotification {
    containerId: string;
    message: string;
    pages: IPage[];
}

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

    const closeNotification = () => {
        const container = document.getElementById(containerId);
        if (timeoutID) {
            clearTimeout(timeoutID);
        }
        if (container) {
            container.remove();
        }
    };

    const mouseOver = () => {
        if (timeoutID) {
            clearTimeout(timeoutID);
        }
    };

    const showNotification = (event: React.MouseEvent<HTMLElement>) => {
        event.preventDefault();
        const categoryHeader = event.currentTarget as HTMLElement;
        if (categoryHeader) {
            const icon = categoryHeader.parentElement?.querySelector('.notice-icon');
            const notice = categoryHeader.parentElement?.querySelector('.notice-hidden');

            if (icon && notice) {
                icon.remove();
                notice.classList.remove('notice-hidden');
            }
        }
    };

    const _pages = {
        Company: [] as CompanyPage[],
        Incident: [] as IncidentPage[],
        Product: [] as ProductPage[],
        ProductLine: [] as ProductLinePage[],
    };

    pages.forEach((page) => {
        if (page.articleType == ArticleType.Company) {
            _pages.Company.push(CompanyPage.fromJSON(page as unknown as ICompanyPage));
        }
        if (page.articleType == ArticleType.Incident) {
            _pages.Incident.push(IncidentPage.fromJSON(page as unknown as IIncidentPage));
        }
        if (page.articleType == ArticleType.Product) {
            _pages.Product.push(ProductPage.fromJSON(page as unknown as IProductPage));
        }
        if (page.articleType == ArticleType.ProductLine) {
            _pages.ProductLine.push(ProductLinePage.fromJSON(page as unknown as IProductLinePage));
        }
    });

    const inpagenotificationCategorysPages = Object.entries(_pages).map(([category, categoryPages], index) => {
        if (categoryPages.length) return <InpagenotificationCategory key={index} pages={[category, categoryPages]} />;
    });

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
                div {
                    all: initial;
                }

                div, p, h1, h2, h3, h4, h5, h6, section, article, header, footer {
                    display: block;
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
                    margin: 10px 10px 10px;
                    max-width: 250px;
                    height: auto;
                    position: fixed;
                    right: 0px;
                    top: 0px;
                    z-index: 2147483647;
                    display: inline-block;
                    border-color: red red red;
                    border-style: solid solid solid;
                    border-width: medium 2px 2px;
                    border-radius: 1rem 1rem 1rem 1rem;
                }

                .message {
                    padding: 0.5em;
                    color: #333;
                }

                .page {
                    padding: 0.5em;
                    color: #333;
                }
                .page:not(:first-child) {
                    margin-top: 10px;
                }

                .page-menu {
                    float: right;
                    cursor: pointer;
                    font-weight:
                    bold;
                 
                    margin-left: 10px;
                }

                .page-more {
                    margin-right: 10px;
                }

                .page-close {
                }                    

                .wikilink {
                    height: 100%;
                    align-items: center;
                    min-width: 13.875em;
                    font-size: 1.5em;
                }

                a {
                    cursor: revert;
                    color: rgb(75, 119, 214);
                    text-decoration: none;
                }

                .category {
                    border: 1px solid #ccc;
                    border-radius: 6px;
                    overflow: hidden;
                    font-family: Arial, sans-serif;
                    overflow: hidden;
                    transition: max-height 0.3s ease;
                    background-color: #fff;                    
                }

                .category:not(:first-child) {
                    margin-top: 10px;
                }

                .category-header {
                    background-color: #f5f5f5;
                    padding: 5px;
                    cursor: pointer;
                    font-weight: bold;
                    user-select: none;
                }

                .category-content {
                    max-height: 0;
                    overflow: hidden;
                    transition: max-height 0.3s ease;
                    background-color: #fff;
                }

                .show-content {
                    max-height: 500px;
                }

                .page-info.hidden {
                    max-height: 0;
                    overflow: hidden;
                    transition: max-height 0.3s ease;
                    background-color: #fff;
                }

                .categorys {
                    overflow-y: auto;
                    max-height: calc(100dvh - 115px);
                }

                .notice-hidden {
                    max-height: 0;
                    max-width: 0;
                    overflow: hidden;
                    transition: max-height 0.3s ease;
                    background-color: #fff;
                }

                .notice-icon {
                    width: 75px;
                }                
                `}
            </style>

            <div className="container" onMouseOver={mouseOver}>
                <div className="page-menu">
                    <span className="page-close" onClick={closeNotification}>
                        ✖
                    </span>
                </div>
                <div className="notice-icon" onClick={showNotification} onMouseOver={showNotification}>
                    <img src="data:image/png;base64,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" />
                </div>

                <div className="notice-hidden">
                    <a className="wikilink" href="https://consumerrights.wiki/" target="_blank">
                        <span>
                            <strong>Consumer Rights Wiki</strong>
                        </span>
                    </a>
                    <InpagenotificationMessage message={message} />
                    <div className="categorys">{inpagenotificationCategorysPages}</div>
                </div>
            </div>
        </>
    );
};

export default Inpagenotification;
