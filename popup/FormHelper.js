import { SettingsMgr } from "../SettingsMgr.js";
const settings = new SettingsMgr();

function manageRadio(key) {
	const keyE = CSS.escape(key);
	
	document.querySelectorAll(`input[name="${keyE}"]`).forEach((elem) => {
		console.log(elem);
		console.log(settings.get(key));
		
		if (elem.value == settings.get(key)) {
			elem.checked = true;
		}

		elem.addEventListener("click", () => {
			settings.set(key, elem.value);
		});
	});
}

export { manageRadio };
