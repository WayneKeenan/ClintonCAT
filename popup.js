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

const buttonEle = document.getElementById("on-off-toggle");

buttonEle.addEventListener("click", () => {
  const newAppDisabled = !appDisabled;
  appDisabled = newAppDisabled;

  chrome.storage.sync.set({ appDisabled: newAppDisabled });
  chrome.runtime.sendMessage({ badgeText: newAppDisabled ? "off" : "on" });
});
