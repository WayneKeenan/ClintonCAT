
import { SettingsMgr } from "./SettingsMgr.js";
const settings = new SettingsMgr();

import { OPTIONS_DOMAIN_EXCLUSIONS, STATE_OPEN_DOMAINS } from "./constants.js";

const BASE_URL="https://wiki.rossmanngroup.com";
const SEARCH_API_URL= BASE_URL+ "/api.php";
const WIKI_URL= BASE_URL+ "/wiki";
const CAT_DOMAIN = getMainDomain(BASE_URL);

console.log("initial load");
chrome.storage.local.set({ [STATE_OPEN_DOMAINS]: []});
chrome.storage.local.set({ appDisable: false});


const searchWiki = async (searchTerm) => {
  const endpoint = SEARCH_API_URL;
  const params = new URLSearchParams({
    action: "query",
    list: "search",
    srsearch: searchTerm,
    format: "json",
    origin: "*" // Required for CORS if making the request from a browser
  });

  try {

	//TODO: Implement a cache system to avoid querying the wiki too often
	
	const response = await fetch(`${endpoint}?${params}`);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const data = await response.json();
    return data.query.search;
  } catch (error) {
    console.error("Error fetching data from MediaWiki API:", error);
  }
};


function getMainDomain(hostname) {
  try {
    const cleanHostname = hostname.replace(/^www\./, "");
    const parts = cleanHostname.split(".");

    // If there are at least two parts, return the second-to-last part (main domain)
    // Ignore the last part (TLD) and any preceding subdomains
    if (parts.length > 2) {
      return parts[parts.length - 2]; // Main domain
    }

    // If only two parts exist, return the first part (main domain)
    return parts[0];
  } catch (error) {
    console.error("Invalid URL:", error);
    return null;
  }
}


function openBackgroundTab(url) {
  chrome.tabs.create({ url: url, active: false }, (tab) => {
  });
}

function openTabIfNotExists(url) {
  // Query all tabs to find if the URL is already open
  chrome.tabs.query({}, (tabs) => {
    const existingTab = tabs.find((tab) => tab.url === url);
    if (!existingTab) {
      openBackgroundTab(url);
    }
  });
}


function foundCATEntry(searchTerm, url) {
  if (settings.get("notification.mode") == "1") {
    const data = {
      type: "foundCATEntry",
      searchTerm: searchTerm,
      urlToWiki: url
    };
    sendMessageToAllTabs(data);
  } else {
	//Default behavior
    openBackgroundTab(url);
  }
}

function getOptions(keys) {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.get(keys, (result) => {
      console.log("Options: ", JSON.stringify(result));
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve(result);
      }
    });
  });
}


function isDomainExcluded(exclusions, domain)  {
  if (exclusions == null) {
    return false;
  }
  return exclusions.some((excludedDomain) => domain.includes(excludedDomain));
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


chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {

    const options = await getOptions([OPTIONS_DOMAIN_EXCLUSIONS, "appDisabled"]);
    console.log("CAT options: ", JSON.stringify(options));

    if (message.badgeText) {
      chrome.action.setBadgeText({ text: message.badgeText });
    }

    console.log("CAT is loafing?", options["appDisabled"]);
    if (options["appDisabled"]) {
      return;
    }

      const currentDomain = message.domain;
    if (currentDomain) {
      const searchTerm = getMainDomain(currentDomain);
      // handle circular case.
      // ignore excluded domains
      if ( (searchTerm === CAT_DOMAIN) || isDomainExcluded(options.domain_exclusions, currentDomain) ) {
        return;
      }

      // Block multiple tb openings due to multiple windows and potentially multiple async 'onMessage' invocations
      const openDomains = await getOpenDomains();
      if (openDomains.includes(searchTerm)) {
        return;
      } else {
        saveOpenDomains(currentDomain);
      }


      console.log("Searching for main domain: " + searchTerm);
      searchWiki(searchTerm).then((results) => {
        if (results.length > 0) {
          const pageUrl = `${WIKI_URL}/${encodeURIComponent(results[0].title)}`;
          foundCATEntry(pageUrl);
        }
      });
    }
});



async function sendMessageToAllTabs(data) {
	try {
		const tabs = await chrome.tabs.query({});
		tabs.forEach((tab) => {
			if (tab) {
				try {
					chrome.tabs.sendMessage(tab.id, data, (response) => {
						if (chrome.runtime.lastError) {
							console.error("Error sending message to tab:", chrome.runtime.lastError.message);
						}
					});
				} catch (e) {
						console.error("Error sending message to tab:", e);
				}
			}
		});
	} catch (error) {
		console.error("Error querying tabs:", error);
		
	}
}
