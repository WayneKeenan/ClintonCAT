import { IContentScannerPlugin, IElementData, IScanParameters } from '@/common/services/content-scanner.types';
import { CATWikiPageSearchResults } from '@/database';
import browser from 'webextension-polyfill';

// Simple test for simple test page, e.g.
// https://waynekeenan.github.io/ClintonCAT/tests/www/3products_1cat.html

// TODO: fix: accidentally reusing classnames will silently override other classes
export class TestScanner implements IContentScannerPlugin {
    metaInfo(): string {
        return 'test scanner';
    }

    canScanContent(params: IScanParameters): boolean {
        return params.domain.endsWith('waynekeenan.github.io') || params.domain === 'localhost';
    }

    async scan(params: IScanParameters): Promise<boolean> {
        console.log(`Test Scanner: ${params.domain} - ${params.mainDomain}`);

        const pageResults = new CATWikiPageSearchResults();

        // Anything in the domain?
        const domainResults = params.pagesDb.getPagesForDomain(params.mainDomain);
        pageResults.addPageEntries(domainResults.pageEntries);

        // Check the page
        const divElements: IElementData[] = await params.dom.querySelectorAll('div');
        console.dir(divElements);

        const alertImgUrl = browser.runtime.getURL('alert.png');

        for (const divElement of divElements) {
            const divId = divElement.id;
            console.log('element', divId);

            const productTitleSelector = `#${divId} h2`;
            // const imgSelector = `#${divId} h2`;
            console.log('productTitleSelector:', productTitleSelector);
            const h2: IElementData | undefined | null = await params.dom.querySelector(productTitleSelector);
            // const h2: IElementData | undefined | null = await _params.dom.querySelectorByParentId(divId, 'h2');
            // const h2: IElementData | undefined | null = await _params.dom.querySelectorByParentId(divId, ':scope > h2');

            const h2Text = h2?.innerText;
            console.log('h2 id: ', h2?.id);
            console.log('h2 text: ', h2Text);

            if (h2Text) {
                const searchResult = params.pagesDb.findConsecutiveWords(h2Text);
                console.log('searchResult', searchResult);
                pageResults.addPageEntries(searchResult.pageEntries);

                if (searchResult.totalPagesFound) {
                    console.log('Adding the CAT html: ', alertImgUrl);
                    const pageEntry = pageResults.pageEntries[0];
                    console.dir(pageEntry);
                    const pageUrl: string = pageEntry.url();
                    const popupText: string = pageEntry.description;
                    await params.dom.createElement(
                        divId,
                        'p',
                        `<a href="${pageUrl}"  target="_blank"><img id="alertIcon"  src="${alertImgUrl}" alt="" title="${popupText}"/></a>`
                        // `<a href="${pagesFound.pageUrls[0]}" target="_blank" \n` +
                        //     `   style="position: fixed; top: 10px; right: 10px; z-index: 1000;">\n` +
                        //     `  <img src="${alertImgUrl}" alt="Clinton is not pleased" \n` +
                        //     `       style="width: 128px; height: 128px; transition: transform 1.3s ease;">\n` +
                        //     '</a>'

                        // Note: adding a <script/> doesn't trigger execution
                    );

                    break; // Only add the first found page alert
                    // TODO: the _params.notify might publish results on the fly to interested subscribers
                }
            }
        }
        params.notify(pageResults);
        return pageResults.totalPagesFound > 0;
    }
}
