import { App, PluginSettingTab, Setting } from "obsidian";
import DeterministicGraphViewPlugin from "./main";

// #0C2B4E (rgb(12, 43, 78)) → Midnight Navy
// #1A3D64 (rgb(26, 61, 100)) → Deep Ocean Blue
// #1D546C (rgb(29, 84, 108)) → Slate Teal
// #F4F4F4 (rgb(244, 244, 244)) → Soft Light Gray

class SettingTab extends PluginSettingTab {
	public readonly plugin: DeterministicGraphViewPlugin;

	constructor(app: App, plugin: DeterministicGraphViewPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	static register(plugin: DeterministicGraphViewPlugin) {
		plugin.addSettingTab(new SettingTab(plugin.app, plugin));
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		this.createColorPickerSetting('Node background color', this.plugin.settings.node.backgroundColor, (value) => {
			this.plugin.settings.node.backgroundColor = value;
		});

		this.createColorPickerSetting('Node text color', this.plugin.settings.node.textColor, (value) => {
			this.plugin.settings.node.textColor = value;
		});

		this.createColorPickerSetting('Edge color', this.plugin.settings.edge.color, (value) => {
			this.plugin.settings.edge.color = value;
		});
	}

	private createColorPickerSetting(name: string, value: string, onChange: (value: string) => void) {
		new Setting(this.containerEl)
			.setName(name)
			.addColorPicker(color => color
				.setValue(value)
				.onChange(async (value) => {
					onChange(value);
					await this.plugin.saveSettings();
				}));
	}

}

export default SettingTab;
