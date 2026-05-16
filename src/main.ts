import { Plugin } from 'obsidian';
import { DEFAULT_SETTINGS } from "./constants";
import PluginView from './PluginView';
import PluginSettings from '../types/PluginSettings';
import SettingTab from './SettingTab';

export default class DeterministicGraphViewPlugin extends Plugin {
	settings: PluginSettings;

	async onload() {
		await this.loadSettings();

		PluginView.register(this);
		SettingTab.register(this);

		this.addRibbonIcon('network', 'Open deterministic graph view', () => PluginView.open(this));
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData() as Partial<PluginSettings>);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

