import DeterministicGraphViewPlugin from "main";
import { PluginSettings } from "../types/PluginSettings";
import { COLORS, EVENTS } from "./constants";

/**
 * Centralises settings persistence and theme-color resolution.
 * `null` for any color means "derive from the active theme's CSS variables".
 */
class SettingsManager {
	public settings: PluginSettings;

	private plugin: DeterministicGraphViewPlugin;

	constructor(plugin: DeterministicGraphViewPlugin) {
		this.plugin = plugin;
	}

	async save() {
		await this.plugin.saveData(this.settings);
		this.plugin.events.trigger(EVENTS.SETTINGS_CHANGED);
	}

	async load() {
		const saved = await this.plugin.loadData() as PluginSettings;

		// null for each color means "follow the active theme" — no persisted override.
		this.settings = {
			node: {
				backgroundColor: saved?.node?.backgroundColor ?? null,
				textColor: saved?.node?.textColor ?? null,
			},
			edge: {
				color: saved?.edge?.color ?? null,
			},
		};
	}

	/**
	 * Returns settings with every null resolved to the live CSS-variable value.
	 * Call this at render time so the graph always reflects the current theme when
	 * the user has not set a custom color.
	 */
	getEffectiveSettings() {
		const theme = this.getThemeColors();
		return {
			node: {
				backgroundColor: this.settings.node.backgroundColor ?? theme.node.backgroundColor,
				textColor: this.settings.node.textColor ?? theme.node.textColor,
			},
			edge: {
				color: this.settings.edge.color ?? theme.edge.color,
			},
		};
	}

	/**
	 * Resets all colors back to null so they follow the active theme again.
	 * Mutates the existing settings object in-place so any callers holding a
	 * reference to `settings` see the updated values without needing to re-fetch.
	 * Persists the reset so it survives reloads.
	 */
	resetToDefaults() {
		this.settings.node.backgroundColor = null;
		this.settings.node.textColor = null;
		this.settings.edge.color = null;
		this.save().catch(e => console.error('[DGV] Failed to save after reset', e));
	}

	/**
	 * Reads the active Obsidian theme's CSS variables to derive graph colors
	 * that match the current theme. Mirrors the same variables Obsidian's
	 * built-in graph view uses:
	 *   --graph-node   → regular node fill color
	 *   --graph-line   → edge / connecting-line color
	 *   --graph-label  → node label text (aspirational; set by some themes)
	 *   --text-muted   → fallback label color (always present in every theme)
	 *
	 * Each value falls back to a structural theme variable and finally to the
	 * hard-coded COLORS constant so this is always safe to call.
	 */
	private getThemeColors() {
		const style = getComputedStyle(document.body);
		const get = (variable: string) => style.getPropertyValue(variable).trim();

		return {
			node: {
				backgroundColor:
					get("--graph-node") ||
					get("--interactive-accent") ||
					COLORS.DEEP_OCEAN_BLUE,
				textColor:
					get("--graph-label") ||
					get("--text-muted") ||
					COLORS.SOFT_LIGHT_GRAY,
			},
			edge: {
				color:
					get("--graph-line") ||
					get("--text-faint") ||
					COLORS.SLATE_TEAL,
			},
		};
	}
}

export default SettingsManager;
