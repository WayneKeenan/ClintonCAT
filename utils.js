import { WIKI_URL } from "./constants.js";
import { getCachedPagesDB } from "./db-cache.js";

export async function fetchJson(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Failed to fetch JSON: ${error.message}`);
    throw error;
  }
}

export function fuzzySearch(query, arr) {
  const lowerQuery = query.toLowerCase();
  return arr.filter(item => item.toLowerCase().includes(lowerQuery));
}

export async function getPagesForDomain(domain) {
  const pagesDB = await getCachedPagesDB();
  const pages =  fuzzySearch(domain, pagesDB);

  console.log("Pages fuzzy search result: ", pages);

  let result = {
    numPages: 0,
    pageUrls: [],
  };

  if (pages && pages.length > 0) {
      const pageUrl = `${WIKI_URL}/${encodeURIComponent(pages[0])}`;
      result.numPages = pages.length;
      result.pageUrls = [pageUrl];
  }

  return result;
}

export function extractMainDomain(hostname) {
  // TODO: https://publicsuffix.org
  const twoLevelTLDs = ['co.uk', 'gov.uk', 'com.au', 'org.uk', 'ac.uk'];

  const cleanHostname = hostname.replace(/^www\./, "");
  const parts = cleanHostname.split(".");

  for (let tld of twoLevelTLDs) {
    const tldParts = tld.split('.');
    if (
        parts.length > tldParts.length &&
        parts.slice(-tldParts.length).join('.') === tld
    ) {
      return parts.slice(-(tldParts.length + 1), -tldParts.length).join('.');
    }
  }

  // Default case for regular TLDs like .com, .net, etc.
  if (parts.length > 2) {
    return parts.slice(-2, -1)[0];
  } else {
    return parts[0];
  }
}

export function openBackgroundTab(url) {
  chrome.tabs.create({ url: url, active: false }, (tab) => {
  });
}

export function openForegroundTab(url) {
  chrome.tabs.create({ url: url, active: true }, (tab) => {
  });
}

export function isDomainExcluded(exclusions, domain)  {
  if (exclusions == null) {
    return false;
  }
  return exclusions.some((excludedDomain) => domain.includes(excludedDomain));
}

export function getOptions(keys) {
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
