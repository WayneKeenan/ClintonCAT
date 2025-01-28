const currentDomain = window.location.hostname;

browser.runtime.sendMessage({ domain: currentDomain }).catch((error) => {
  console.error("Error sending message:", error);
});

