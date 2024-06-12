import { Notice, Platform, Plugin } from "obsidian";
import { ReactView, BEAUTITAB_REACT_VIEW } from "./Views/ReactView";
import Observable from "src/Utils/Observable";
import {
	BeautitabPluginSettingTab,
	BeautitabPluginSettings,
	DEFAULT_SETTINGS,
} from "src/Settings/Settings";


export default class BeautitabPlugin extends Plugin {
	settings: BeautitabPluginSettings;
	settingsObservable: Observable;

	async onload() {
		await this.loadSettings();

		this.settingsObservable = new Observable(this.settings);

		this.registerView(
			BEAUTITAB_REACT_VIEW,
			(leaf) =>
				new ReactView(this.app, this.settingsObservable, leaf, this)
		);

		this.addSettingTab(new BeautitabPluginSettingTab(this.app, this));

		this.registerEvent(
			this.app.workspace.on(
				"layout-change",
				this.onLayoutChange.bind(this)
			)
		);

		if (process.env.NODE_ENV === "development") {
			if (process.env.EMULATE_MOBILE && !Platform.isMobile) {
				this.app.emulateMobile(true);
			}

			if (!process.env.EMULATE_MOBILE && Platform.isMobile) {
				this.app.emulateMobile(false);
			}
		}
	}

	onunload() {
		console.log("unloading Beautitab");
	}

	/**
	 * Load data from disk, stored in data.json in plugin folder
	 */
	async loadSettings() {
		const data = (await this.loadData()) || {};
		this.settings = Object.assign({}, DEFAULT_SETTINGS, data);
	}

	/**
	 * Save data to disk, stored in data.json in plugin folder
	 */
	async saveSettings() {
		await this.saveData(this.settings);
	}

	

	/**
	 * Hijack new tabs and show Beauitab
	 */
	private onLayoutChange(): void {
		const leaf = this.app.workspace.getMostRecentLeaf();
		if (leaf?.getViewState().type === "empty") {
			leaf.setViewState({
				type: BEAUTITAB_REACT_VIEW,
			});
		}
	}

	/**
	 * Check if the choosen provider is enabled
	 * If yes: open it by using executeCommandById
	 * If no: Notice the user and tell them to enable it in the settings
	 */
	openSwitcherCommand(command: string): void {
		const pluginID = command.split(":")[0];
		const plugins = this.app.plugins.enabledPlugins.has(pluginID);
		const internalPlugins = this.app.internalPlugins.getEnabledPlugins().find((plugin) => plugin.manifest.id === pluginID);

		if (plugins || internalPlugins) {
			this.app.commands.executeCommandById(command);
		} else {
			new Notice(
				`Plugin ${pluginID} is not enabled. Please enable it in the settings.`
			);
		}
	}
}
