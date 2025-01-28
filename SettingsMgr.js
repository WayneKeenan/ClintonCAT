class SettingsMgr {
	static #instance = null;
	#defaultSettings;
	#settings;

	#isLoaded = false;
	#loadPromise;

	constructor() {
		if (SettingsMgr.#instance) {
			// Return the existing instance if it already exists
			return SettingsMgr.#instance;
		}
		// Initialize the instance if it doesn't exist
		SettingsMgr.#instance = this;

		this.#settings = {};
		this.#getDefaultSettings();

		//Implicit promise created
		this.#loadPromise = this.#initializeSettings();
	}

	async #initializeSettings() {
		try {
			await this.#loadSettingsFromStorage();

			this.#isLoaded = true;
			return true;
		} catch (error) {
			console.error("Failed to load settings:", error);
			throw error;
		}
	}

	// Replace the old isLoaded() method
	async waitForLoad() {
		return this.#loadPromise;
	}

	// Keep the sync check if needed, but prefer waitForLoad()
	isLoaded() {
		return this.#isLoaded;
	}

	async refresh() {
		await this.#loadSettingsFromStorage();
	}

	get(settingPath, undefinedReturnDefault = true) {
		let answer = this.#getFromObject(this.#settings, settingPath);

		//If the value is not found in the settings, check if we should return the default value.
		if (answer == undefined && undefinedReturnDefault) {
			answer = this.#getFromObject(this.#defaultSettings, settingPath);
		}

		return answer;
	}

	#getFromObject(obj, settingPath) {
		// Split the path by dots to access each level of the object
		const pathArray = settingPath.split(".");

		// Use reduce to iterate over the array and go deeper into the object
		return pathArray.reduce((prev, curr) => prev && prev[curr], obj);
	}

	async set(settingPath, value, reloadSettings = true) {
		//Don't go through the hassle of updating the value if it did not change
		if (this.get(settingPath, false) == value) {
			return false; //No value updated
		}

		if (reloadSettings) {
			await this.#loadSettingsFromStorage(true);
		}

		const pathArray = settingPath.split(".");
		const lastKey = pathArray.pop();

		// Traverse the object and create missing intermediate objects if needed
		let current = this.#settings;
		for (let key of pathArray) {
			if (!current[key]) {
				current[key] = {}; // Create the object if it doesn't exist
			}
			current = current[key];
		}

		// Set the final value
		current[lastKey] = value;

		await this.#save();
		return true;
	}

	async #save() {
		try {
			chrome.storage.local.set({ settings: this.#settings });
		} catch (e) {
			if (e.name === "QuotaExceededError") {
				// The local storage space has been exceeded
				alert("Local storage quota exceeded!");
			} else {
				// Some other error occurred
				alert("Error:", e.name, e.message);
				return false;
			}
		}
	}

	async #loadSettingsFromStorage(skipMigration = false) {
		const data = await chrome.storage.local.get("settings");

		//If no settings exist already, create the default ones
		if (data == null || Object.keys(data).length === 0) {
			//Will generate default settings
			await chrome.storage.local.clear(); //Delete all local storage
			this.#settings = this.#defaultSettings;
			await this.#save();
		} else {
			Object.assign(this.#settings, data.settings);
		}
		if (!skipMigration) {
			await this.#migrate();
		}
	}

	async #migrate() {
		
	}

	#getDefaultSettings() {
		this.#defaultSettings = {
			notification: {
				mode: 0,
			},
		};
	}
}

export { SettingsMgr };
