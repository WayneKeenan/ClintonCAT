import { SettingsMgr } from "../SettingsMgr.js";
const settings = new SettingsMgr();
import { manageRadio } from "./FormHelper.js";

(async () => {
	await settings.waitForLoad();

	manageRadio("notification.mode");
})();