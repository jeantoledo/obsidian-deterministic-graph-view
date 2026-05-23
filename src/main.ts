import { Events, Plugin } from 'obsidian';
import { DEFAULT_SETTINGS } from "./constants";
import PluginView from './PluginView';
import PluginSettings from '../types/PluginSettings';
import SettingTab from './SettingTab';
import { EVENTS } from './constants';

export default class DeterministicGraphViewPlugin extends Plugin {
	settings: PluginSettings;
	readonly events = new Events();

	async onload() {
		await this.loadSettings();

		PluginView.register(this);
		SettingTab.register(this);

		this.addRibbonIcon('network', 'Open deterministic graph view', () => PluginView.open(this));

		this.addCommand({
			id: 'open-graph-view',
			name: 'Open graph view',
			callback: () => PluginView.open(this),
		});
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData() as Partial<PluginSettings>);
	}

	async saveSettings() {
		await this.saveData(this.settings);
		this.events.trigger(EVENTS.SETTINGS_CHANGED);
	}
}

