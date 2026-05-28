import { ColorComponent, setIcon } from "obsidian";
import DeterministicGraphViewPlugin from "./main";

export interface GraphControlsPanelOptions {
	onFilterChange: (query: string) => void;
	plugin: DeterministicGraphViewPlugin;
}

class GraphControlsPanel {
	private readonly panelEl: HTMLElement;
	private isVisible = false;
	private searchInput: HTMLInputElement | null = null;

	constructor(
		private readonly container: HTMLElement,
		private readonly options: GraphControlsPanelOptions,
	) {
		this.panelEl = this.buildPanel();
	}

	private buildPanel(): HTMLElement {
		const panel = this.container.createDiv({ cls: "dgv-controls-panel dgv-hidden" });

		this.buildFiltersSection(panel);
		this.buildDisplaySection(panel);

		return panel;
	}

	// Filters section gets special treatment: inline reset + close buttons in the header,
	// and a search input in its content area.
	private buildFiltersSection(parent: HTMLElement): void {
		const section = parent.createDiv({ cls: "dgv-controls-section" });
		const header = section.createDiv({ cls: "dgv-section-header" });

		const chevronEl = header.createSpan({ cls: "dgv-section-chevron" });
		setIcon(chevronEl, "chevron-right");
		header.createSpan({ cls: "dgv-section-title", text: "Filters" });

		// Push reset + close to the right
		header.createSpan({ cls: "dgv-section-header-spacer" });

		const resetBtn = header.createEl("button", { cls: "dgv-section-action-btn" });
		setIcon(resetBtn, "rotate-ccw");
		resetBtn.addEventListener("click", (e) => {
			e.stopPropagation();
			this.resetFilters();
		});

		const closeBtn = header.createEl("button", { cls: "dgv-section-action-btn" });
		setIcon(closeBtn, "x");
		closeBtn.addEventListener("click", (e) => {
			e.stopPropagation();
			this.hide();
		});

		// Content
		const content = section.createDiv({ cls: "dgv-section-content dgv-hidden" });
		this.buildSearchInput(content);

		let expanded = false;
		header.addEventListener("click", () => {
			expanded = !expanded;
			setIcon(chevronEl, expanded ? "chevron-down" : "chevron-right");
			content.toggleClass("dgv-hidden", !expanded);
		});
	}

	private buildSearchInput(parent: HTMLElement): void {
		const wrapper = parent.createDiv({ cls: "dgv-search-wrapper" });

		const searchIcon = wrapper.createSpan({ cls: "dgv-search-icon" });
		setIcon(searchIcon, "search");

		const input = wrapper.createEl("input", {
			attr: { type: "text", placeholder: "Search files" },
		});
		this.searchInput = input;

		const clearBtn = wrapper.createEl("button", { cls: "dgv-search-clear dgv-hidden" });
		setIcon(clearBtn, "x");

		input.addEventListener("input", () => {
			const q = input.value;
			clearBtn.toggleClass("dgv-hidden", q.length === 0);
			this.options.onFilterChange(q);
		});

		clearBtn.addEventListener("click", () => {
			input.value = "";
			clearBtn.addClass("dgv-hidden");
			this.options.onFilterChange("");
			input.focus();
		});
	}

	private buildDisplaySection(parent: HTMLElement): void {
		const section = parent.createDiv({ cls: "dgv-controls-section" });
		const header = section.createDiv({ cls: "dgv-section-header" });

		const chevronEl = header.createSpan({ cls: "dgv-section-chevron" });
		setIcon(chevronEl, "chevron-right");
		header.createSpan({ cls: "dgv-section-title", text: "Display" });

		const content = section.createDiv({ cls: "dgv-section-content dgv-hidden" });
		this.populateDisplayContent(content);

		let expanded = false;
		header.addEventListener("click", () => {
			expanded = !expanded;
			setIcon(chevronEl, expanded ? "chevron-down" : "chevron-right");
			content.toggleClass("dgv-hidden", !expanded);
		});
	}

	private populateDisplayContent(content: HTMLElement): void {
		const { settingsManager } = this.options.plugin;
		const effective = settingsManager.getEffectiveSettings();
		const { settings } = settingsManager;

		this.createColorRow(content, "Node background color", effective.node.backgroundColor, (value) => {
			settings.node.backgroundColor = value;
		});

		this.createColorRow(content, "Node text color", effective.node.textColor, (value) => {
			settings.node.textColor = value;
		});

		this.createColorRow(content, "Edge color", effective.edge.color, (value) => {
			settings.edge.color = value;
		});

		const footer = content.createDiv({ cls: "dgv-display-footer" });
		// eslint-disable-next-line obsidianmd/ui/sentence-case
		const resetBtn = footer.createEl("button", { cls: "dgv-reset-btn", text: "↺ Reset to defaults" });
		resetBtn.addEventListener("click", () => {
			settingsManager.resetToDefaults();
			content.empty();
			this.populateDisplayContent(content);
		});
	}

	private createColorRow(container: HTMLElement, name: string, value: string, onChange: (value: string) => void): void {
		const row = container.createDiv({ cls: "dgv-color-row" });
		row.createSpan({ cls: "dgv-color-label", text: name });
		new ColorComponent(row)
			.setValue(value)
			.onChange(async (v) => {
				onChange(v);
				await this.options.plugin.settingsManager.save();
			});
	}

	private resetFilters(): void {
		if (this.searchInput) {
			this.searchInput.value = "";
			this.searchInput.dispatchEvent(new Event("input"));
		}
	}

	show(): void {
		this.isVisible = true;
		this.panelEl.removeClass("dgv-hidden");
	}

	hide(): void {
		this.isVisible = false;
		this.panelEl.addClass("dgv-hidden");
	}

	toggle(): void {
		if (this.isVisible) {
			this.hide();
		} else {
			this.show();
		}
	}

	destroy(): void {
		this.panelEl.remove();
	}
}

export default GraphControlsPanel;
