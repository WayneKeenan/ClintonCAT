import { OPTIONS_DOMAIN_EXCLUSIONS, STATE_OPEN_DOMAINS } from "./constants.js";
import { getOptions, extractMainDomain, getPagesForDomain, openBackgroundTab, isDomainExcluded } from "./utils.js";
import { FETCH_INTERVAL_MINUTES, updatePagesDB, getCachedPagesDB } from "./db-cache.js";

const UPDATE_ALARM_NAME = "updatePagesDB";

console.log("initial load");
chrome.storage.local.set({ [STATE_OPEN_DOMAINS]: []});
chrome.storage.local.set({ appDisable: false});

// Alarm to trigger periodic updates
chrome.alarms.create(UPDATE_ALARM_NAME, { periodInMinutes: FETCH_INTERVAL_MINUTES });
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === UPDATE_ALARM_NAME) {
    updatePagesDB();
  }
});

// Initial fetch on extension load
updatePagesDB();


function openTabIfNotExists(url) {
  // Query all tabs to find if the URL is already open
  chrome.tabs.query({}, (tabs) => {
    const existingTab = tabs.find((tab) => tab.url === url);
    if (!existingTab) {
      openBackgroundTab(url);
    }
  });
}

function foundCATEntry(url) {
  openTabIfNotExists(url);
}

async function getOpenDomains() {
  return new Promise((resolve) => {
    chrome.storage.local.get(STATE_OPEN_DOMAINS, (result) => {
      console.log("Open domains: ", result[STATE_OPEN_DOMAINS] );
      resolve(result[STATE_OPEN_DOMAINS] || []);
    });
  });
}

async function saveOpenDomains(domainName) {
  const openDomains = await getOpenDomains();
  if (!openDomains.includes(domainName)) {
    openDomains.push(domainName);
    chrome.storage.local.set({ [STATE_OPEN_DOMAINS]: openDomains});
  }
}

async function indicateCATEntries(num) {
  if (num > 0) {
    chrome.action.setBadgeText({text: `${num}`});
  } else {
    chrome.storage.sync.get(
        null,
        (items) => {
          if (typeof items?.appDisabled === "boolean") {
            let appDisabled = items.appDisabled;
            chrome.action.setBadgeText( { text: appDisabled ? "off" : "on" });
          }
        },
    );
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  (async () => {

    const options = await getOptions([OPTIONS_DOMAIN_EXCLUSIONS, "appDisabled"]);
    console.log("CAT options: ", JSON.stringify(options));

    if (message.badgeText) {
      chrome.action.setBadgeText({ text: message.badgeText });
    } else {
      await indicateCATEntries(0);
    }

    console.log("CAT is loafing?", options["appDisabled"]);
    if (options["appDisabled"]) {
      await indicateCATEntries(0);
      return;
    }


    const currentDomain = message.domain;
    if (currentDomain) {
      // ignore excluded domains
      if ( isDomainExcluded(options.domain_exclusions, currentDomain) ){
        return;
      }

      const mainDomain = extractMainDomain(currentDomain);
      console.log("Main domain: " + mainDomain);

      // Block multiple tab openings due to multiple windows and potentially multiple async 'onMessage' invocations
      // TODO: need to remove domains when tabs/windows close.
      //       or somehow add state to the tabs we open and search that instead for supressing dupes
      const openDomains = await getOpenDomains();
      if (openDomains.includes(mainDomain)) {
        return;
      } else {
        saveOpenDomains(currentDomain);
      }

      getPagesForDomain(mainDomain).then((results) => {
        if (results.numPages > 0) {
          indicateCATEntries(results.numPages);
          foundCATEntry(results.pageUrls[0]);
        }
      });
    }
  })();
});
