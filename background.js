const BASE_URL="https://wiki.rossmanngroup.com";
const SEARCH_API_URL= BASE_URL+ "/api.php";
const WIKI_URL= BASE_URL+ "/wiki";
const CAT_DOMAIN = getMainDomain(BASE_URL);


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


function foundCATEntry(url) {
  openTabIfNotExists(url);
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


chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  (async () => {
    const options = await getOptions("domain_exclusions");
    const currentDomain = message.domain;
    if (currentDomain) {
      const searchTerm = getMainDomain(currentDomain);
      // handle circular case.
      // ignore excluded domains
      if ( (searchTerm === CAT_DOMAIN) || isDomainExcluded(options.domain_exclusions, currentDomain) ) {
        return;
      }
      console.log("Searching for main domain: " + searchTerm);
      searchWiki(searchTerm).then((results) => {
        if (results.length > 0) {
          const pageUrl = `${WIKI_URL}/${encodeURIComponent(results[0].title)}`;
          foundCATEntry(pageUrl);
        }
      });
    }
  })();
});

