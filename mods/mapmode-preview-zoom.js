// @ts-nocheck
const METADATA = {
    website: "https://github.com/ct-yx/shapez-mods",
    author: "ct-yx & Codex",
    name: "Mapmode Preview Zoom",
    version: "1.0.0",
    id: "mapmode-preview-zoom",
    description: "Allows the map preview to zoom farther out without changing the normal camera limit.",
    minimumGameVersion: ">=1.5.0",
    doesNotAffectSavegame: true,
    settings: {
        enabled: true,
        minimumPreviewZoom: 0.02,
    },
};

const DEFAULT_ENABLED = true;
const DEFAULT_MINIMUM_PREVIEW_ZOOM = 0.02;
const VANILLA_MINIMUM_ZOOM = 0.06;
const MINIMUM_PREVIEW_ZOOM = 0.02;
const MAXIMUM_PREVIEW_ZOOM = VANILLA_MINIMUM_ZOOM;

class Mod extends shapez.Mod {
    init() {
        this.settings.enabled = this.settings.enabled !== false;
        this.settings.minimumPreviewZoom = this.normalizePreviewZoom(
            this.settings.minimumPreviewZoom
        );
        this.settingsPanel = null;

        this.registerSettingsWhenAvailable();
        this.installPreviewZoomPatch();
    }

    normalizePreviewZoom(value) {
        const parsed = Number(value);
        if (!Number.isFinite(parsed)) return DEFAULT_MINIMUM_PREVIEW_ZOOM;
        return Math.max(MINIMUM_PREVIEW_ZOOM, Math.min(MAXIMUM_PREVIEW_ZOOM, parsed));
    }

    getSettingsApi() {
        return globalThis.ShapezStructuredSettings
            || (typeof shapez !== "undefined" ? shapez.StructuredModSettings : null);
    }

    registerSettingsWhenAvailable() {
        const api = this.getSettingsApi();
        if (api && typeof api.register === "function") {
            this.registerStructuredSettings(api);
            return;
        }

        const pending = globalThis.ShapezStructuredSettingsPending
            || (globalThis.ShapezStructuredSettingsPending = []);
        if (this.pendingSettingsRegistration) return;
        this.pendingSettingsRegistration = true;
        pending.push(nextApi => {
            this.pendingSettingsRegistration = false;
            if (nextApi && typeof nextApi.register === "function") {
                this.registerStructuredSettings(nextApi);
            }
        });
    }

    registerStructuredSettings(api) {
        if (this.settingsPanel) return;
        this.settingsPanel = api.register({
            id: METADATA.id,
            title: { en: "Mapmode Preview Zoom", zh: "地图预览缩放" },
            description: {
                en: "Extends zoom only after map mode is active. Normal factory camera zoom remains vanilla.",
                zh: "只在地图总览模式已经启用后扩展缩放；普通工厂镜头仍保持原版范围。",
            },
            fields: [
                {
                    id: "enabled",
                    type: "boolean",
                    label: { en: "Enable map preview zoom", zh: "启用地图预览缩放" },
                    default: DEFAULT_ENABLED,
                    onChange: value => {
                        this.settings.enabled = Boolean(value);
                        this.saveSettings();
                    },
                },
                {
                    id: "minimumPreviewZoom",
                    type: "number",
                    label: { en: "Minimum map preview zoom", zh: "地图预览最小缩放值" },
                    description: {
                        en: "0.02 shows the widest preview. The normal camera limit stays at 0.06.",
                        zh: "0.02 可显示最宽的预览范围；普通镜头下限仍为 0.06。",
                    },
                    min: MINIMUM_PREVIEW_ZOOM,
                    max: MAXIMUM_PREVIEW_ZOOM,
                    step: 0.01,
                    default: DEFAULT_MINIMUM_PREVIEW_ZOOM,
                    onChange: value => {
                        this.settings.minimumPreviewZoom = this.normalizePreviewZoom(value);
                        this.saveSettings();
                    },
                },
            ],
        });

        this.settings.enabled = this.settingsPanel.get("enabled") !== false;
        this.settings.minimumPreviewZoom = this.normalizePreviewZoom(
            this.settingsPanel.get("minimumPreviewZoom")
        );
    }

    isEnabled() {
        if (this.settingsPanel) return this.settingsPanel.get("enabled") !== false;
        return this.settings.enabled !== false;
    }

    getMinimumPreviewZoom() {
        const value = this.settingsPanel
            ? this.settingsPanel.get("minimumPreviewZoom")
            : this.settings.minimumPreviewZoom;
        return this.normalizePreviewZoom(value);
    }

    isMapPreviewActive(gameMode) {
        const root = gameMode && gameMode.root;
        const camera = root && root.camera;
        if (camera && typeof camera.getIsMapOverlayActive === "function") {
            try {
                return Boolean(camera.getIsMapOverlayActive());
            } catch (error) { }
        }

        const zoomLevel = camera && Number(camera.zoomLevel);
        const overviewZoom = Number(
            shapez.globalConfig && shapez.globalConfig.mapChunkOverviewMinZoom
        );
        return Number.isFinite(zoomLevel)
            && Number.isFinite(overviewZoom)
            && zoomLevel < overviewZoom;
    }

    installPreviewZoomPatch() {
        const RegularGameMode = typeof shapez !== "undefined"
            ? shapez.RegularGameMode
            : null;
        if (!RegularGameMode || !RegularGameMode.prototype
            || typeof RegularGameMode.prototype.getMinimumZoom !== "function"
            || !this.modInterface || typeof this.modInterface.extendClass !== "function") {
            console.warn("Mapmode Preview Zoom: RegularGameMode hook is unavailable");
            return;
        }

        const prototype = RegularGameMode.prototype;
        const marker = "__mapmodePreviewZoom_100";
        if (prototype[marker]) return;

        const mod = this;
        this.modInterface.extendClass(RegularGameMode, ({ $old }) => ({
            getMinimumZoom() {
                const vanillaMinimum = Number($old.getMinimumZoom.call(this));
                if (!mod.isEnabled() || !mod.isMapPreviewActive(this)) {
                    return Number.isFinite(vanillaMinimum)
                        ? vanillaMinimum
                        : VANILLA_MINIMUM_ZOOM;
                }

                const previewMinimum = mod.getMinimumPreviewZoom();
                return Number.isFinite(vanillaMinimum)
                    ? Math.min(vanillaMinimum, previewMinimum)
                    : previewMinimum;
            },
        }));
        prototype[marker] = true;
    }
}
