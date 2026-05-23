import { TFile } from "obsidian";
import cytoscape, { BoundingBox12, Core, NodeSingular } from "cytoscape";
import DeterministicGraphViewPlugin from "main";

export interface GraphRendererOptions {
	plugin: DeterministicGraphViewPlugin;
	container: Element;
	cursorTarget?: HTMLElement;
}

class GraphRenderer {
	private cy: Core | null = null;
	private readonly plugin: DeterministicGraphViewPlugin;
	private readonly container: Element;
	private readonly cursorTarget?: HTMLElement;

	constructor(options: GraphRendererOptions) {
		this.plugin = options.plugin;
		this.container = options.container;
		this.cursorTarget = options.cursorTarget;
	}

	hasVisibleContainer(): boolean {
		return this.container.clientWidth > 0 && this.container.clientHeight > 0;
	}

	render(): void {
		if (!this.hasVisibleContainer()) return;

		const settings = this.plugin.settingsManager.getEffectiveSettings();

		this.cy?.destroy();
		this.container.empty();

		const el = this.container.createDiv();
		el.setCssProps({
			width: "100%",
			height: "100%",
		});

		const { nodes, edges } = this.buildGraph();

		this.cy = cytoscape({
			container: el,
			elements: [
				...nodes.map((n) => ({
					data: {
						id: n.id,
						label: n.label,
					},
				})),
				...edges.map((e) => ({
					data: {
						id: `${e.from}->${e.to}`,
						source: e.from,
						target: e.to,
						weight: e.count,
					},
				})),
			],
			style: [
				{
					selector: "node",
					style: {
						label: "data(label)",
						"z-index": 10,
						"text-wrap": "wrap",
						"text-max-width": "50px",
						"min-zoomed-font-size": 8,
						"font-size": 5,
						"text-valign": "bottom",
						"text-halign": "center",
						"background-color": settings.node.backgroundColor,
						"color": settings.node.textColor,
						"width": 5,
						"height": 5,
					},
				},
				{
					selector: "edge",
					style: {
						"z-index": 0,
						"line-color": settings.edge.color,
						"width": 0.5,
						"curve-style": "bezier",
						"target-arrow-shape": "none", // https://js.cytoscape.org/#style/edge-arrow for more arrow shapes
						// "arrow-scale": 0.5,
					},
				},
			],
			layout: { name: "preset" },
		});

		this.runLayoutWithAutoSpacing();
		this.registerNodeClickEvents();
		this.registerNodeHoverEvents(settings);
		this.fit();
	}

	private runLayoutWithAutoSpacing(): void {
		const cy = this.cy;
		if (!cy) return;

		const base = 0.2;
		const growth = 1.4;
		const maxIterations = 8;
		let spacingFactor = base;

		for (let i = 0; i < maxIterations; i++) {
			cy.layout({
				name: "breadthfirst",
				spacingFactor,
				directed: true,
				avoidOverlap: true,
				animate: false,
				nodeDimensionsIncludeLabels: true,
			}).run();

			if (!this.hasLabelOverlap()) return;
			spacingFactor *= growth;
		}
	}

	private hasLabelOverlap(): boolean {
		const cy = this.cy;
		if (!cy) return false;

		const boxes: BoundingBox12[] = cy.nodes().map((n) =>
			n.boundingBox({ includeLabels: true, includeOverlays: false }),
		);
		for (let i = 0; i < boxes.length; i++) {
			const a = boxes[i];
			if (!a) continue;
			for (let j = i + 1; j < boxes.length; j++) {
				const b = boxes[j];
				if (!b) continue;
				if (a.x2 > b.x1 && b.x2 > a.x1 && a.y2 > b.y1 && b.y2 > a.y1) {
					return true;
				}
			}
		}
		return false;
	}

	fit(): void {
		window.requestAnimationFrame(() => {
			const cy = this.cy;
			if (!cy || !this.hasVisibleContainer()) return;

			cy.resize();
			cy.fit(cy.elements(), 24);
		});
	}

	destroy(): void {
		this.cy?.destroy();
		this.cy = null;
	}

	private registerNodeClickEvents() {
		const { app } = this.plugin;

		// open file on click
		this.cy?.on("tap", "node", (evt) => {
			const path = (evt.target as { id: () => string }).id();
			const file = app.vault.getAbstractFileByPath(path);
			if (file instanceof TFile) {
				void app.workspace.getLeaf(true).openFile(file);
			}
		});
	}

	private getGraphNodeFocusedColor(): string {
		const temp = document.createElement("div");
		document.body.appendChild(temp);
		temp.setCssProps({
			color: "var(--graph-node-focused)",
		});
		const color = getComputedStyle(temp).color;
		temp.remove();
		return color;
	}

	private registerNodeHoverEvents(settings: ReturnType<typeof this.plugin.settingsManager.getEffectiveSettings>) {
		this.cy?.on("mouseover", "node", (event) => {
			const node = event.target as NodeSingular;
			const focusColor = this.getGraphNodeFocusedColor();
			node.style({ "background-color": focusColor });
			node.connectedEdges().style({ "line-color": focusColor });
			this.cursorTarget?.setCssProps({ cursor: "pointer" });
		});

		this.cy?.on("mouseout", "node", (event) => {
			const node = event.target as NodeSingular;
			node.style({ "background-color": settings.node.backgroundColor });
			node.connectedEdges().style({ "line-color": settings.edge.color });
			this.cursorTarget?.setCssProps({ cursor: "default" });
		});
	}

	private buildGraph() {
		const { app } = this.plugin;
		const userIgnoreFilters = app.vault?.config?.userIgnoreFilters ?? [];
		const files = app.vault.getMarkdownFiles();
		const resolved = app.metadataCache.resolvedLinks ?? {};
		const isIgnored = (path: string) => userIgnoreFilters.some((filter) => path.includes(filter));

		const nodes = files.filter((f) => !isIgnored(f.path)).map((f) => ({
			id: f.path,
			label: f.basename,
		}));
		const nodeIds = new Set(nodes.map((node) => node.id));

		const edges: { from: string; to: string; count: number }[] = [];

		for (const [from, targets] of Object.entries(resolved)) {
			for (const [to, count] of Object.entries(targets)) {
				if (!nodeIds.has(from) || !nodeIds.has(to)) continue;
				edges.push({ from, to, count });
			}
		}

		return { nodes, edges };
	}
}

export default GraphRenderer;

