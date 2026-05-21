import { ItemView, WorkspaceLeaf, debounce } from "obsidian";
import DeterministicGraphViewPlugin from "main";
import GraphRenderer from "./GraphRenderer";
import { EVENTS } from './constants';

export const VIEW_TYPE = "deterministic-graph-view";

class PluginView extends ItemView {
	plugin: DeterministicGraphViewPlugin;
	private renderer: GraphRenderer | null = null;
	private needsRender = false;

	constructor(leaf: WorkspaceLeaf, plugin: DeterministicGraphViewPlugin) {
		super(leaf);
		this.plugin = plugin;
	}

	static register(plugin: DeterministicGraphViewPlugin) {
		plugin.registerView(VIEW_TYPE, (leaf) => new PluginView(leaf, plugin));
	}

	static open = async (plugin: DeterministicGraphViewPlugin) => {
		const leaf = plugin.app.workspace.getLeaf('tab');
		await leaf.setViewState({ type: VIEW_TYPE, active: true });
		await plugin.app.workspace.revealLeaf(leaf);
	}

	getViewType(): string {
		return VIEW_TYPE;
	}

	getDisplayText(): string {
		return "Deterministic graph view";
	}

	async onOpen() {
		const container = this.containerEl.children[1];
		if (!container) return;

		this.renderer = new GraphRenderer({
			plugin: this.plugin,
			container,
			cursorTarget: this.containerEl,
		});

		this.registerEvents();
		this.renderGraph();
	}

	async onClose() {
		this.renderer?.destroy();
		this.renderer = null;
		this.needsRender = false;
	}

	private registerEvents() {
		const { app } = this.plugin;

		this.registerEvent(app.vault.on("create", () => this.scheduleRenderGraph()));
		this.registerEvent(app.vault.on("delete", () => this.scheduleRenderGraph()));
		this.registerEvent(app.vault.on("rename", () => this.scheduleRenderGraph()));

		// Listen to metadata cache events to ensure graph edges update as links resolve.
		// 'resolved' triggers after all files are indexed; 'changed' triggers on per-file link changes.
		// This prevents the initial graph from missing connections.
		const onMetadataChanged = debounce(() => this.scheduleRenderGraph(), 250, true);
		this.registerEvent(app.metadataCache.on("resolved", () => this.scheduleRenderGraph()));
		this.registerEvent(app.metadataCache.on("changed", () => onMetadataChanged()));

		this.registerEvent(app.workspace.on("active-leaf-change", () => this.refreshVisibleGraph()));
		this.registerEvent(app.vault.on("config-changed", (key) => {
			if (key === "userIgnoreFilters") {
				this.scheduleRenderGraph();
			}
		}));
		const onSettingsChanged = debounce(() => this.scheduleRenderGraph(), 250, true);
		this.registerEvent(this.plugin.events.on(EVENTS.SETTINGS_CHANGED, onSettingsChanged));
	}

	private scheduleRenderGraph() {
		if (!this.renderer?.hasVisibleContainer()) {
			this.needsRender = true;
			return;
		}

		this.renderGraph();
	}

	private refreshVisibleGraph() {
		if (!this.renderer?.hasVisibleContainer()) return;

		if (this.needsRender) {
			this.renderGraph();
			return;
		}

		this.renderer.fit();
	}

	private renderGraph() {
		if (!this.renderer) return;
		if (!this.renderer.hasVisibleContainer()) {
			this.needsRender = true;
			return;
		}

		this.needsRender = false;
		this.renderer.render();
	}
}

export default PluginView;
