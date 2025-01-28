const currentDomain = window.location.hostname;
chrome.runtime.sendMessage({ domain: currentDomain });


//Dispay a banner fixed tot he top of the page with a message with linking to the wiki page
function displayBanner(currentDomain,urlToWiki){
	const banner = document.createElement("div");
	banner.classList.add("clinton-cat-banner");
	banner.innerHTML = `The site ${currentDomain} had an entry on the CAT wiki: <a href="${urlToWiki}" target="_blank">View</a> 
	<br /><a href="#" onclick="this.parentElement.remove(); return false;">(close)</a>`;
	document.body.appendChild(banner);
}


//Listen to the service worker for messages
chrome.runtime.onMessage.addListener(async function (message, sender, sendResponse) {
	let data = message;
	if (data.type == undefined) {
		return false;
	}

	sendResponse({ success: true });

	//If we received a request for a hook execution
	if (data.type == "foundCATEntry") {
		displayBanner(data.searchTerm,data.urlToWiki);
	}
});