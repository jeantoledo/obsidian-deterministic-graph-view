/** for colors, null means "derive from the active theme's CSS variables" */
export interface PluginSettings {
	node: {
		backgroundColor: string | null;
		textColor: string | null;
	},
	edge: {
		color: string | null;
	}
}