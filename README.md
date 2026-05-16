# Deterministic Graph View

An [Obsidian](https://obsidian.md) plugin that renders your vault's link graph with a **deterministic layout**. Unlike Obsidian's built-in graph view (which uses a force-directed simulation and rearranges itself every time you open it), this plugin produces the **same layout on every render** for the same set of notes and links.

Built on top of [Cytoscape.js](https://js.cytoscape.org/) using a `breadthfirst` layout.

## Why

The default graph view is great for exploring, but the positions of nodes shift every time you reopen it. That makes it hard to:

- Build a mental map of your vault.
- Compare the graph across sessions.
- Use the graph as a stable visual index of your notes.

This plugin trades some of the "organic" look for **predictable, reproducible** node placement.

## Features

- Deterministic `breadthfirst` graph layout (Cytoscape).
- Click a node to open the corresponding note in a new tab.
- Hover highlight on nodes (darkened background + pointer cursor).
- Auto-refreshes when files are created, deleted, or renamed.
- Refits the graph when the view becomes active again.
- Respects Obsidian's **Files & links → Excluded files** (`userIgnoreFilters`) and re-renders when they change.
- Customizable node and edge colors via the settings tab.
- Single **network** ribbon icon to open the graph in a new tab.

## Installation

### Manual

1. Download `main.js`, `manifest.json`, and `styles.css` from the latest [release](https://github.com/jeantoledo/obsidian-deterministic-graph-view/releases).
2. Copy them into your vault under:
   ```
   <Vault>/.obsidian/plugins/deterministic-graph-view/
   ```
3. Reload Obsidian.
4. Enable **Deterministic Graph View** under **Settings → Community plugins**.

### From source

```bash
git clone https://github.com/jeantoledo/obsidian-deterministic-graph-view.git
cd obsidian-deterministic-graph-view
npm install
npm run build
```

Then copy `main.js`, `manifest.json`, and `styles.css` into `<Vault>/.obsidian/plugins/deterministic-graph-view/`.

## Usage

Click the **network** ribbon icon to open the graph in a new tab. Click any node to open the corresponding note.

The graph rebuilds automatically when notes are created, deleted, or renamed, and when you change Obsidian's excluded-files filters. When the view leaf becomes active again, the graph is refit to the container.

## Settings

**Settings → Deterministic Graph View** exposes:

- **Node background color**
- **Node text color**
- **Edge color**

Defaults use a "Deep Ocean Blue / Soft Light Gray / Slate Teal" palette (see `src/constants.ts`).

> Note: settings changes apply on the next render (e.g. after creating/renaming a note, or reopening the view).

## Development

Requirements: Node 18+ and npm.

```bash
npm install
npm run dev       # esbuild watch mode
npm run build     # type-check + production build
npm run lint      # eslint
```

For local testing, symlink or copy this folder into `<Vault>/.obsidian/plugins/deterministic-graph-view/` and run `npm run dev`. Reload Obsidian to pick up changes.

### Project layout

```
src/
  main.ts            # plugin lifecycle: load settings, register view + setting tab, ribbon icon
  PluginView.ts      # ItemView wrapper: lifecycle, vault/workspace events, render scheduling
  GraphRenderer.ts   # Cytoscape instance, graph build, styling, node interactions
  SettingTab.ts      # color-picker based settings UI
  constants.ts       # default settings + color palette
  utils.ts           # small helpers (e.g. darkenHexColor)
types/
  PluginSettings.ts  # PluginSettings interface (node + edge colors)
```

## License

[0BSD](LICENSE)
