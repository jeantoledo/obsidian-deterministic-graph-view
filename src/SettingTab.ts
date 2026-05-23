import { App, PluginSettingTab, Setting } from "obsidian";
import DeterministicGraphViewPlugin from "./main";

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
		const { settings } = this.plugin.settingsManager;
		// Resolve nulls to live CSS-var values so pickers always show a real color.
		const effective = this.plugin.settingsManager.getEffectiveSettings();

		containerEl.empty();

		this.createColorPickerSetting('Node background color', effective.node.backgroundColor, (value) => {
			settings.node.backgroundColor = value;
		});

		this.createColorPickerSetting('Node text color', effective.node.textColor, (value) => {
			settings.node.textColor = value;
		});

		this.createColorPickerSetting('Edge color', effective.edge.color, (value) => {
			settings.edge.color = value;
		});

		new Setting(containerEl)
			.setName('Reset to defaults')
			.setDesc('Restore all colors to their default theme values. Removes saved settings.')
			.addButton(button => button
				.setButtonText('Reset')
				.setWarning()
				.onClick(async () => {
					this.plugin.settingsManager.resetToDefaults();
					this.display();
				}));
	}

	private createColorPickerSetting(name: string, value: string, onChange: (value: string) => void) {
		new Setting(this.containerEl)
			.setName(name)
			.addColorPicker(color => color
				.setValue(value)
				.onChange(async (value) => {
					onChange(value);
					await this.plugin.settingsManager.save();
				}));
	}

}

export default SettingTab;
