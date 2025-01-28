chrome.storage.sync.get(
  null,
  (items) => {
    if (typeof items?.appDisabled === "boolean") {
      chrome.runtime.sendMessage({ badgeText: items.appDisabled ? "off" : "on" });

      if (items.appDisabled) {
        return;
      }
    }

    const currentDomain = window.location.hostname;
    chrome.runtime.sendMessage({ domain: currentDomain });
  },
);
