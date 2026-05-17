import PluginSettings from "../types/PluginSettings";

const COLORS = {
	DEEP_OCEAN_BLUE: "#1A3D64",
	SOFT_LIGHT_GRAY: "#F4F4F4",
	SLATE_TEAL: "#1D546C",
}

export const DEFAULT_SETTINGS: PluginSettings = {
	node: {
		backgroundColor: COLORS.DEEP_OCEAN_BLUE,
		textColor: COLORS.SOFT_LIGHT_GRAY,
	},
	edge: {
		color: COLORS.SLATE_TEAL,
	},
}

export const EVENTS = {
	SETTINGS_CHANGED: "settings-changed",
}
