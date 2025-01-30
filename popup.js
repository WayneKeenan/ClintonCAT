import { OPTIONS_DOMAIN_EXCLUSIONS, PAGES_DB_JSON_URL, ALLOW_SITE, EXCLUDE_SITE } from "./constants.js";
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
    getPagesForDomain(mainDomain).then((results) => {
        if (results.numPages === 0) {
            wikiButtonEle.disabled = true;
            wikiButtonEle.textContent = "Page not on CAT Wiki";
            return;
        }

        wikiButtonEle.disabled = false;
        wikiButtonEle.addEventListener("click", () => {
            openForegroundTab(results.pageUrls[0]);
            window.close();
        })
    });
});

document.addEventListener("DOMContentLoaded", () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const currentTab = tabs[0];
        if (currentTab && currentTab.url) {
            const mainDomain = extractMainDomain(currentTab.url);
            if (mainDomain) {
                chrome.storage.sync.get([OPTIONS_DOMAIN_EXCLUSIONS], (result) => {
                    console.log("Loaded domain_exclusions:", result[OPTIONS_DOMAIN_EXCLUSIONS]);
                    const exclusions = result[OPTIONS_DOMAIN_EXCLUSIONS] || [];
                    showCurrentDomain(mainDomain, exclusions);
                });
            }
        } else {
            console.error("No active tab or URL available");
        }
    });
});

function showCurrentDomain(currentDomain, exclusionList) {
    const domainDisplay = document.createElement("p");
    domainDisplay.textContent = `Current Domain: ${currentDomain}`;
    document.body.appendChild(domainDisplay);
    const button = document.createElement("button");
    button.setAttribute("id", "switchStateButton");
    if (exclusionList.includes(currentDomain)) 
        button.textContent = ALLOW_SITE;
    
    else 
        button.textContent = EXCLUDE_SITE;
        
    button.addEventListener("click", () => { handleButtonClick(currentDomain, exclusionList) });
    document.body.appendChild(button);
}
  
function handleButtonClick(currentDomain, exclusionList) {
    const button = document.getElementById("switchStateButton");
    if (button) {
        if (button.textContent === ALLOW_SITE) {
            const updatedExclusions = exclusionList.filter((item) => item !== currentDomain);
            chrome.storage.sync.set({ [OPTIONS_DOMAIN_EXCLUSIONS]: updatedExclusions }, () => {
                console.log("Exclusions updated:", updatedExclusions);
            });
            button.textContent = EXCLUDE_SITE;
        } else {
            exclusionList.push(currentDomain);
            chrome.storage.sync.set({ [OPTIONS_DOMAIN_EXCLUSIONS]: exclusionList }, () => {
                console.log("Exclusions updated:", exclusionList);
            });
            button.textContent = ALLOW_SITE;
        }    
    }
}
