// @ts-nocheck
const METADATA = {
    website: "https://github.com/ct-yx/shapez-mods",
    author: "ct-yx & Codex",
    name: "Zoom out before Mapmode",
    version: "1.6.0",
    id: "zoomout-mapmode",
    description: "Changes how far the camera can zoom out before entering map mode.",
    minimumGameVersion: ">=1.5.0",
    doesNotAffectSavegame: true,
    settings: { mapPreviewRangeMultiplier: 2 },
};

const VANILLA_MAP_PREVIEW_ZOOM_FALLBACK = 0.9;
const DEFAULT_MAP_PREVIEW_RANGE_MULTIPLIER = 2;

class Mod extends shapez.Mod {
    init() {
        this.mapPreviewVanillaZoom = this.getVanillaMapPreviewZoom();
        this.settings.mapPreviewRangeMultiplier = this.normalizeMapPreviewRangeMultiplier(
            this.settings.mapPreviewRangeMultiplier,
            DEFAULT_MAP_PREVIEW_RANGE_MULTIPLIER
        );
        this.settingsPanel = null;
        this.settingsApi = null;
        this.registerSettingsWhenAvailable();
        this.applyMapPreviewRange(this.getMapPreviewRangeMultiplier());
        this.signals.stateEntered.add(() => {
            this.registerSettingsWhenAvailable();
            this.applyMapPreviewRange(this.getMapPreviewRangeMultiplier());
        });
    }

    getVanillaMapPreviewZoom() {
        try {
            const value = Number(shapez.globalConfig.mapChunkOverviewMinZoom);
            if (Number.isFinite(value) && value > 0) return value;
        } catch (error) { }
        return VANILLA_MAP_PREVIEW_ZOOM_FALLBACK;
    }

    getSettingsApi() {
        return globalThis.ShapezStructuredSettings
            || (typeof shapez !== "undefined" ? shapez.StructuredModSettings : null);
    }

    registerSettingsWhenAvailable() {
        const settingsApi = this.getSettingsApi();
        if (settingsApi && typeof settingsApi.register === "function") {
            this.registerStructuredSettings(settingsApi);
            return;
        }
        const pending = globalThis.ShapezStructuredSettingsPending
            || (globalThis.ShapezStructuredSettingsPending = []);
        if (!this.pendingSettingsRegistration) {
            this.pendingSettingsRegistration = true;
            pending.push(nextApi => {
                this.pendingSettingsRegistration = false;
                if (nextApi && typeof nextApi.register === "function") {
                    this.registerStructuredSettings(nextApi);
                }
            });
        }
    }

    registerStructuredSettings(settingsApi) {
        if (this.settingsPanel) return;
        this.settingsApi = settingsApi;
        const defaultValue = this.normalizeMapPreviewRangeMultiplier(
            this.settings.mapPreviewRangeMultiplier,
            DEFAULT_MAP_PREVIEW_RANGE_MULTIPLIER
        );
        this.settingsPanel = settingsApi.register({
            id: METADATA.id,
            title: { en: "Zoom out before Mapmode", zh: "地图总览缩放" },
            description: {
                en: "Controls how far you can zoom out before entering map mode. Vanilla is 1x.",
                zh: "设置进入地图总览前可缩小的范围；原版范围为 1x。",
            },
            fields: [
                {
                    id: "mapPreviewRangeMultiplier",
                    type: "number",
                    suffix: "x",
                    label: { en: "Pre-map-mode zoom-out range", zh: "进入地图总览前的缩小范围" },
                    description: {
                        en: "Multiplier relative to vanilla (1x). Higher values let you zoom out farther before map mode; 8x is the maximum.",
                        zh: "相对于原版的倍数（1x）。数值越大，进入地图总览前可以缩得更远；最高 8x。",
                    },
                    min: 1,
                    max: 8,
                    step: 0.05,
                    default: defaultValue,
                    onChange: value => this.applyMapPreviewRange(value),
                },
                {
                    id: "zoomHelp",
                    type: "heading",
                    label: { en: "1x = vanilla · higher = farther out", zh: "1x = 原版 · 越大 = 缩得更远" },
                },
            ],
        });
        this.settings.mapPreviewRangeMultiplier = this.normalizeMapPreviewRangeMultiplier(
            this.settingsPanel.get("mapPreviewRangeMultiplier"),
            DEFAULT_MAP_PREVIEW_RANGE_MULTIPLIER
        );
        this.applyMapPreviewRange(this.getMapPreviewRangeMultiplier());
    }

    getMapPreviewRangeMultiplier() {
        if (this.settingsPanel) {
            const value = this.settingsPanel.get("mapPreviewRangeMultiplier");
            if (value !== undefined) return this.normalizeMapPreviewRangeMultiplier(value);
        }
        return this.normalizeMapPreviewRangeMultiplier(
            this.settings.mapPreviewRangeMultiplier,
            DEFAULT_MAP_PREVIEW_RANGE_MULTIPLIER
        );
    }

    applyMapPreviewRange(value) {
        const multiplier = this.normalizeMapPreviewRangeMultiplier(
            value,
            DEFAULT_MAP_PREVIEW_RANGE_MULTIPLIER
        );
        this.settings.mapPreviewRangeMultiplier = multiplier;
        shapez.globalConfig.mapChunkOverviewMinZoom = this.mapPreviewVanillaZoom / multiplier;
        if (typeof this.saveSettings === "function") this.saveSettings();
    }

    normalizeMapPreviewRangeMultiplier(value, fallback = 1) {
        const parsed = Number(value);
        if (!Number.isFinite(parsed)) return fallback;
        return Math.max(1, Math.min(8, parsed));
    }
}
