import { OPTIONS_DOMAIN_EXCLUSIONS, PAGES_DB_JSON_URL } from "./constants.js";
import { extractMainDomain, isDomainExcluded, getOptions, openForegroundTab, getPagesForDomain, fetchJson } from "./utils.js";

let appDisabled = false;

// get initial appDisabled
chrome.storage.sync.get(
    null,
    (items) => {
        if (typeof items?.appDisabled === "boolean") {
            appDisabled = items.appDisabled;
        }
    },
);

const onOffButtonEle = document.getElementById("on-off-toggle");
const optionsButtonEle = document.getElementById("optionsButton");
const wikiButtonEle = document.getElementById("wikiButton");

onOffButtonEle.addEventListener("click", () => {
    const newAppDisabled = !appDisabled;
    appDisabled = newAppDisabled;

    chrome.storage.sync.set({ appDisabled: newAppDisabled });
    chrome.runtime.sendMessage({ badgeText: newAppDisabled ? "off" : "on" });
});

optionsButtonEle.addEventListener("click", () => {
    chrome.runtime.openOptionsPage();
});

chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
    if (tabs.length === 0) {
        return
    };

    const options = await getOptions([OPTIONS_DOMAIN_EXCLUSIONS, "appDisabled"]);

    const activeTab = tabs[0];
    const currentDomain = new URL(activeTab.url).hostname;

    if (!currentDomain || isDomainExcluded(options.domain_exclusions, currentDomain)) {
        return;
    }
    
    const mainDomain = extractMainDomain(currentDomain);
    
    let pagesDB = [];
    await fetchJson(PAGES_DB_JSON_URL).then(result => {pagesDB = result});

    getPagesForDomain(mainDomain, pagesDB).then((results) => {
        if (results.numPages === 0) {
            return;
        }
        console.log("pageUrl: ", results.pageUrls[0]);
        wikiButtonEle.addEventListener("click", () => {
            openForegroundTab(results.pageUrls[0]);
            window.close();
        })
        wikiButtonEle.disabled = false;
    });
});