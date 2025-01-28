const BASE_URL = "https://wiki.rossmanngroup.com";
const SEARCH_API_URL = BASE_URL + "/api.php";
const WIKI_URL = BASE_URL + "/wiki";
const CAT_DOMAIN = getMainDomain(BASE_URL);

const searchWiki = async (searchTerm) => {
  const endpoint = SEARCH_API_URL;
  const params = new URLSearchParams({
    action: "query",
    list: "search",
    srsearch: searchTerm,
    format: "json",
    origin: "*", // Required for CORS if making the request from a browser
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
  chrome.tabs.create({ url: url, active: false }, (tab) => {});
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

function getCattedPages() {
  return JSON.parse(localStorage.getItem("cattedPages")) || [];
}

function saveCattedPage(domainName) {
  const cattedPages = getCattedPages();
  if (!cattedPages.includes(domainName)) {
    cattedPages.push(domainName);
    localStorage.setItem("cattedPages", JSON.stringify(cattedPages));
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.domain) {
    const searchTerm = getMainDomain(message.domain);
    const cattedPages = getCattedPages();

    if (cattedPages.includes(searchTerm)) {
      return;
    }

    // handle circular case.
    if (searchTerm === CAT_DOMAIN) {
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
});
