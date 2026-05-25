import { ItemView, WorkspaceLeaf, debounce, setIcon } from "obsidian";
import DeterministicGraphViewPlugin from "main";
import GraphRenderer from "./GraphRenderer";
import GraphControlsPanel from "./GraphControlsPanel";
import { EVENTS } from './constants';

export const VIEW_TYPE = "deterministic-graph-view";

class PluginView extends ItemView {
	plugin: DeterministicGraphViewPlugin;
	private renderer: GraphRenderer | null = null;
	private controlsPanel: GraphControlsPanel | null = null;
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
		const viewContent = this.containerEl.children[1] as HTMLElement;
		if (!viewContent) return;

		// Wrapper gives GraphRenderer and overlay elements a shared positioning context
		const wrapper = viewContent.createDiv({ cls: "dgv-graph-wrapper" });

		this.renderer = new GraphRenderer({
			plugin: this.plugin,
			container: wrapper,
			cursorTarget: this.containerEl,
		});

		const settingsBtn = wrapper.createEl("button", { cls: "dgv-controls-btn" });
		settingsBtn.addEventListener("click", () => this.controlsPanel?.toggle());
		setIcon(settingsBtn, "settings");

		// Controls panel (starts hidden; lives as a sibling of the cy container)
		this.controlsPanel = new GraphControlsPanel(wrapper, {
			onFilterChange: (query) => this.renderer?.setFilter(query),
		});

		this.registerEvents();
		this.renderGraph();
	}

	async onClose() {
		this.controlsPanel?.destroy();
		this.controlsPanel = null;
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
		const onCssChange = debounce(() => this.scheduleRenderGraph(), 250, true);
		this.registerEvent(app.workspace.on('css-change', onCssChange));
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
