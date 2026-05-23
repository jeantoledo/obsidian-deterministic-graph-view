import { Events, Plugin } from 'obsidian';
import PluginView from './PluginView';
import SettingTab from './SettingTab';
import SettingsManager from './SettingsManager';

export default class DeterministicGraphViewPlugin extends Plugin {
	readonly events = new Events();

	public settingsManager: SettingsManager;

	async onload() {
		this.settingsManager = new SettingsManager(this);

		await this.settingsManager.load();

		PluginView.register(this);
		SettingTab.register(this);

		this.addRibbonIcon('network', 'Open deterministic graph view', () => PluginView.open(this));

		this.addCommand({
			id: 'open-graph-view',
			name: 'Open graph view',
			callback: () => PluginView.open(this),
		});
	}
}

