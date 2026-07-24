// @ts-nocheck
const METADATA = {
    website: "https://github.com/ct-yx/shapez-mods",
    author: "ct-yx & Codex",
    name: "Zoom out before Mapmode",
    version: "1.1.0",
    id: "zoomout-mapmode",
    description: "Changes the zoom level at which the game switches to map mode, with a structured settings panel.",
    minimumGameVersion: ">=1.5.0",
    doesNotAffectSavegame: true,
    settings: {
        overviewZoom: 0.5,
    },
};

const DEFAULT_OVERVIEW_ZOOM = 0.5;

class Mod extends shapez.Mod {
    init() {
        this.settings.overviewZoom = this.normalizeZoom(this.settings.overviewZoom);
        this.settingsPanel = null;

        const settingsApi = globalThis.ShapezStructuredSettings
            || (typeof shapez !== "undefined" ? shapez.StructuredModSettings : null);

        if (settingsApi && typeof settingsApi.register === "function") {
            this.settingsPanel = settingsApi.register({
                id: METADATA.id,
                title: { en: "Zoom out before Mapmode", zh: "地图总览缩放" },
                description: {
                    en: "Choose how far you zoom out before the game switches to map mode.",
                    zh: "设置游戏在缩放到多远时切换到地图总览模式。",
                },
                fields: [
                    {
                        id: "overviewZoom",
                        type: "number",
                        label: { en: "Map mode threshold", zh: "地图模式阈值" },
                        description: { en: "Lower values switch later. Vanilla is about 0.9.", zh: "数值越小，进入总览模式越晚；原版约为 0.9。" },
                        min: 0.1,
                        max: 1.5,
                        step: 0.05,
                        default: DEFAULT_OVERVIEW_ZOOM,
                        onChange: value => this.applyZoom(value),
                    },
                    {
                        id: "restoreDefault",
                        type: "heading",
                        label: { en: "0.1 = later · 1.5 = earlier", zh: "0.1 = 更晚 · 1.5 = 更早" },
                    },
                ],
            });
            this.applyZoom(settingsApi.get(METADATA.id, "overviewZoom"));
        } else {
            // The mod still works by itself. The shared panel becomes available
            // automatically when Structured Mod Settings UI is installed first.
            this.applyZoom(this.settings.overviewZoom);
        }

        this.signals.stateEntered.add(() => this.applyZoom(this.getZoomValue()));
    }

    normalizeZoom(value) {
        const parsed = Number(value);
        if (!Number.isFinite(parsed)) return DEFAULT_OVERVIEW_ZOOM;
        return Math.max(0.1, Math.min(1.5, parsed));
    }

    getZoomValue() {
        if (this.settingsPanel) {
            const value = this.settingsPanel.get("overviewZoom");
            if (value !== undefined) return this.normalizeZoom(value);
        }
        return this.normalizeZoom(this.settings.overviewZoom);
    }

    applyZoom(value) {
        const zoom = this.normalizeZoom(value);
        this.settings.overviewZoom = zoom;
        shapez.globalConfig.mapChunkOverviewMinZoom = zoom;
        if (this.settingsPanel && typeof this.saveSettings === "function") this.saveSettings();
    }
}
