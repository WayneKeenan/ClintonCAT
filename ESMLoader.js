//Content script does not support ES modules
//Load the content script as a module
(async () => {
	try {
		await import(chrome.runtime.getURL("./content.js"));
	} catch (error) {
		console.error("Error loading module:", error);
	}
})();
