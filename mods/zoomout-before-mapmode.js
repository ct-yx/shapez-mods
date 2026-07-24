// @ts-nocheck
const METADATA = {
    website: "https://github.com/ct-yx/shapez-mods",
    author: "ct-yx & Codex",
    name: "Zoom out before Mapmode",
    version: "1.4.0",
    id: "zoomout-mapmode",
    description: "Changes map mode zoom and reduces belt item rendering at low camera zoom.",
    minimumGameVersion: ">=1.5.0",
    doesNotAffectSavegame: true,
    settings: {
        mapPreviewZoomMultiplier: 0.5,
        normalCameraZoomMultiplier: 1,
        compactBeltItems: true,
        compactBeltZoom: 0.5,
    },
};

const TILE_SIZE = 32;
const VANILLA_MAP_PREVIEW_ZOOM_FALLBACK = 0.9;
const DEFAULT_MAP_PREVIEW_MULTIPLIER = 0.5;
const DEFAULT_NORMAL_CAMERA_MULTIPLIER = 1;
const DEFAULT_COMPACT_BELT_ZOOM = 0.5;
const COMPACT_BELT_HOVER_DIAMETER_MULTIPLIER = 2.4;
const COMPACT_BELT_HOVER_RADIUS_PX = 30;
const COMPACT_BELT_MERGE_RADIUS_PX = 38;

class Mod extends shapez.Mod {
    init() {
        this.mapPreviewVanillaZoom = this.getVanillaMapPreviewZoom();
        this.settings.mapPreviewZoomMultiplier = this.normalizeMultiplier(
            this.settings.mapPreviewZoomMultiplier,
            DEFAULT_MAP_PREVIEW_MULTIPLIER
        );
        this.settings.normalCameraZoomMultiplier = this.normalizeMultiplier(
            this.settings.normalCameraZoomMultiplier,
            DEFAULT_NORMAL_CAMERA_MULTIPLIER
        );
        this.settings.compactBeltItems = this.settings.compactBeltItems !== false;
        this.settings.compactBeltZoom = this.normalizeZoom(
            this.settings.compactBeltZoom,
            DEFAULT_COMPACT_BELT_ZOOM
        );
        this.settingsPanel = null;
        this.settingsApi = null;

        this.installMinimumZoomPatch();
        this.registerSettingsWhenAvailable();
        this.installBeltItemRenderingPatch();
        this.applyMapPreviewZoom(this.getMapPreviewMultiplier());

        this.signals.stateEntered.add(() => {
            this.registerSettingsWhenAvailable();
            this.applyMapPreviewZoom(this.getMapPreviewMultiplier());
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
        this.settingsApi = settingsApi;
        const mapPreviewDefault = this.normalizeMultiplier(
            this.settings.mapPreviewZoomMultiplier,
            DEFAULT_MAP_PREVIEW_MULTIPLIER
        );
        const normalCameraDefault = this.normalizeMultiplier(
            this.settings.normalCameraZoomMultiplier,
            DEFAULT_NORMAL_CAMERA_MULTIPLIER
        );
        const compactDefault = this.normalizeZoom(this.settings.compactBeltZoom);

        this.settingsPanel = settingsApi.register({
            id: METADATA.id,
            title: { en: "Zoom out before Mapmode", zh: "地图总览缩放" },
            description: {
                en: "Separate map-preview and normal-camera zoom ranges. Both controls use vanilla as 1x.",
                zh: "分别设置地图预览和普通镜头的缩小范围；两个设置都以原版为 1x。",
            },
            fields: [
                {
                    id: "mapPreviewZoomMultiplier",
                    type: "number",
                    label: { en: "Map preview zoom range", zh: "地图预览缩放范围" },
                    description: {
                        en: "Multiplier relative to vanilla (1x). Lower values let the map preview zoom out farther and switch later.",
                        zh: "相对于原版的倍数（1x）。数值越小，地图预览可以缩得更远，切换也更晚。",
                    },
                    min: 0.02,
                    max: 2,
                    step: 0.01,
                    default: mapPreviewDefault,
                    onChange: value => this.applyMapPreviewZoom(value),
                },
                {
                    id: "normalCameraZoomMultiplier",
                    type: "number",
                    label: { en: "Normal camera zoom-out range", zh: "普通镜头缩小范围" },
                    description: {
                        en: "Multiplier relative to vanilla (1x). Lower values allow the normal camera to zoom out farther and may increase the visible/generated area.",
                        zh: "相对于原版的倍数（1x）。数值越小，普通镜头可以缩得更远，也可能增加可见/生成区域。",
                    },
                    min: 0.1,
                    max: 2,
                    step: 0.01,
                    default: normalCameraDefault,
                    onChange: value => this.applyNormalCameraZoomMultiplier(value),
                },
                {
                    id: "zoomHelp",
                    type: "heading",
                    label: { en: "1x = vanilla · lower = farther out", zh: "1x = 原版 · 越小 = 缩得更远" },
                },
                {
                    id: "compactBeltItems",
                    type: "boolean",
                    label: { en: "Compact belt items at low zoom", zh: "低缩放时简化传送带物品" },
                    description: {
                        en: "Below the actual camera zoom threshold, only the first and last belt items are shown.",
                        zh: "低于实际镜头缩放阈值时，只显示传送带路径首尾的物品。",
                    },
                    default: true,
                    onChange: value => {
                        this.settings.compactBeltItems = Boolean(value);
                        this.saveSettings();
                    },
                },
                {
                    id: "compactBeltZoom",
                    type: "number",
                    label: { en: "Compact belt zoom threshold", zh: "简化传送带物品的缩放阈值" },
                    description: {
                        en: "At or below this camera scale, only belt endpoints are drawn. Default: " + compactDefault + ".",
                        zh: "实际镜头缩放到该数值或更低时，仅显示传送带端点物品。默认：" + compactDefault + "。",
                    },
                    min: 0.1,
                    max: 1.5,
                    step: 0.05,
                    default: compactDefault,
                    onChange: value => this.applyCompactBeltZoom(value),
                },
            ],
        });

        this.settings.mapPreviewZoomMultiplier = this.normalizeMultiplier(
            this.settingsPanel.get("mapPreviewZoomMultiplier"),
            DEFAULT_MAP_PREVIEW_MULTIPLIER
        );
        this.settings.normalCameraZoomMultiplier = this.normalizeMultiplier(
            this.settingsPanel.get("normalCameraZoomMultiplier"),
            DEFAULT_NORMAL_CAMERA_MULTIPLIER
        );
        this.settings.compactBeltItems = this.settingsPanel.get("compactBeltItems") !== false;
        this.settings.compactBeltZoom = this.normalizeZoom(
            this.settingsPanel.get("compactBeltZoom"),
            DEFAULT_COMPACT_BELT_ZOOM
        );
        this.applyMapPreviewZoom(this.getMapPreviewMultiplier());
    }

    getMapPreviewMultiplier() {
        if (this.settingsPanel) {
            const value = this.settingsPanel.get("mapPreviewZoomMultiplier");
            if (value !== undefined) return this.normalizeMultiplier(value);
        }
        return this.normalizeMultiplier(
            this.settings.mapPreviewZoomMultiplier,
            DEFAULT_MAP_PREVIEW_MULTIPLIER
        );
    }

    getNormalCameraZoomMultiplier() {
        if (this.settingsPanel) {
            const value = this.settingsPanel.get("normalCameraZoomMultiplier");
            if (value !== undefined) return this.normalizeMultiplier(value);
        }
        return this.normalizeMultiplier(
            this.settings.normalCameraZoomMultiplier,
            DEFAULT_NORMAL_CAMERA_MULTIPLIER
        );
    }

    getCompactBeltItemsEnabled() {
        if (this.settingsPanel) {
            const value = this.settingsPanel.get("compactBeltItems");
            if (value !== undefined) return value !== false;
        }
        return this.settings.compactBeltItems !== false;
    }

    getCompactBeltZoom() {
        if (this.settingsPanel) {
            const value = this.settingsPanel.get("compactBeltZoom");
            if (value !== undefined) return this.normalizeZoom(value);
        }
        return this.normalizeZoom(this.settings.compactBeltZoom, DEFAULT_COMPACT_BELT_ZOOM);
    }

    installBeltItemRenderingPatch() {
        let BeltPath = null;
        try {
            BeltPath = typeof shapez !== "undefined" ? shapez.BeltPath : null;
        } catch (error) { }

        if (!BeltPath || !BeltPath.prototype || typeof BeltPath.prototype.draw !== "function") {
            console.warn("Zoom out before Mapmode: BeltPath draw hook is unavailable");
            return;
        }

        const prototype = BeltPath.prototype;
        const marker = "__zoomoutMapmodeCompactItems_12";
        if (prototype[marker]) return;

        const originalDraw = prototype.draw;
        const mod = this;
        this.signals.gameStarted.add(root => {
            if (!root || !root.signals || !root.signals.gameFrameStarted) return;
            root.signals.gameFrameStarted.add(() => this.resetEndpointDrawState(root), this);
            root.signals.aboutToDestruct.add(() => {
                delete root.__zoomoutMapmodeEndpointDrawState;
            });
        }, this);
        prototype.draw = function(parameters) {
            if (
                !mod.getCompactBeltItemsEnabled() ||
                !parameters ||
                !Number.isFinite(parameters.zoomLevel) ||
                parameters.zoomLevel >= mod.getCompactBeltZoom()
            ) {
                return originalDraw.call(this, parameters);
            }
            mod.prepareEndpointDrawState(this.root);
            return mod.drawCompactBeltPath(this, parameters);
        };
        prototype[marker] = true;
    }

    installMinimumZoomPatch() {
        const RegularGameMode = typeof shapez !== "undefined"
            ? shapez.RegularGameMode
            : null;
        if (!RegularGameMode || !RegularGameMode.prototype
            || typeof RegularGameMode.prototype.getMinimumZoom !== "function"
            || !this.modInterface || typeof this.modInterface.extendClass !== "function") {
            return;
        }

        const marker = "__zoomoutMapmodeMinimumZoom_140";
        if (RegularGameMode.prototype[marker]) return;

        const mod = this;
        this.modInterface.extendClass(RegularGameMode, ({ $old }) => ({
            getMinimumZoom() {
                const vanillaMinimum = Number($old.getMinimumZoom.call(this));
                if (!Number.isFinite(vanillaMinimum) || vanillaMinimum <= 0) {
                    return vanillaMinimum;
                }
                return vanillaMinimum * mod.getNormalCameraZoomMultiplier();
            },
        }));
        RegularGameMode.prototype[marker] = true;
    }

    drawCompactBeltPath(path, parameters) {
        if (!parameters.visibleRect.containsRect(path.worldBounds) || path.items.length === 0) return;

        const first = path.items[0];
        const lastIndex = path.items.length - 1;
        const last = path.items[lastIndex];

        this.drawCompactBeltItem(path, parameters, first, path.spacingToFirstItem, "start");
        if (lastIndex > 0) {
            let lastProgress = path.spacingToFirstItem;
            for (let i = 0; i < lastIndex; ++i) {
                lastProgress += path.items[i][0];
            }
            this.drawCompactBeltItem(path, parameters, last, lastProgress, "end");
        }
    }

    drawCompactBeltItem(path, parameters, distanceAndItem, progress, endpoint) {
        const entity = path.computePositionFromProgress(progress);
        const worldPos = entity.toWorldSpaceCenterOfTile();
        const item = distanceAndItem[1];
        const endpointState = this.registerEndpoint(path.root, worldPos, item, endpoint, parameters);
        const isHovered = endpointState.hovered;
        const isMerged = endpointState.merged;
        const diameter = shapez.globalConfig.defaultItemDiameter *
            (isHovered || isMerged ? COMPACT_BELT_HOVER_DIAMETER_MULTIPLIER : 1);
        item.drawItemCenteredClipped(worldPos.x, worldPos.y, parameters, diameter);
    }

    prepareEndpointDrawState(root) {
        if (!root) return;
        if (!root.__zoomoutMapmodeEndpointDrawState) {
            root.__zoomoutMapmodeEndpointDrawState = {
                path: null,
                endpoints: [],
                hovered: null,
            };
        }
        const state = root.__zoomoutMapmodeEndpointDrawState;
        if (state.path !== root) {
            state.path = root;
            state.endpoints = [];
            state.hovered = null;
        }
    }

    resetEndpointDrawState(root) {
        if (!root || !root.__zoomoutMapmodeEndpointDrawState) return;
        root.__zoomoutMapmodeEndpointDrawState.endpoints = [];
        root.__zoomoutMapmodeEndpointDrawState.hovered = null;
    }

    sameItem(left, right) {
        if (left === right) return true;
        if (!left || !right) return false;
        if (typeof left.equals === "function") {
            try {
                return Boolean(left.equals(right));
            } catch (error) { }
        }
        if (typeof left.serialize === "function" && typeof right.serialize === "function") {
            try {
                return left.getItemType() === right.getItemType()
                    && left.serialize() === right.serialize();
            } catch (error) { }
        }
        return false;
    }

    registerEndpoint(root, worldPos, item, endpoint, parameters) {
        const state = root && root.__zoomoutMapmodeEndpointDrawState;
        if (!state) return { hovered: false, merged: false };

        const screenPos = root.camera.worldToScreen(worldPos);
        const endpointRecord = { worldPos, screenPos, item, endpoint, parameters };
        let merged = false;
        for (const previous of state.endpoints) {
            const dx = previous.screenPos.x - screenPos.x;
            const dy = previous.screenPos.y - screenPos.y;
            const distanceSquare = dx * dx + dy * dy;
            const worldDx = previous.worldPos.x - worldPos.x;
            const worldDy = previous.worldPos.y - worldPos.y;
            const worldDistanceSquare = worldDx * worldDx + worldDy * worldDy;
            if (
                distanceSquare <= COMPACT_BELT_MERGE_RADIUS_PX * COMPACT_BELT_MERGE_RADIUS_PX
                && worldDistanceSquare <= (TILE_SIZE * 2.25) * (TILE_SIZE * 2.25)
                && this.sameItem(previous.item, item)
            ) {
                merged = true;
                break;
            }
        }

        const mousePosition = root.app && root.app.mousePosition;
        const dx = mousePosition ? mousePosition.x - screenPos.x : Infinity;
        const dy = mousePosition ? mousePosition.y - screenPos.y : Infinity;
        const distanceSquare = dx * dx + dy * dy;
        const insideHoverRadius = distanceSquare <= COMPACT_BELT_HOVER_RADIUS_PX * COMPACT_BELT_HOVER_RADIUS_PX;
        let hovered = false;
        if (insideHoverRadius) {
            if (!state.hovered) {
                state.hovered = { item, distanceSquare, screenPos, record: endpointRecord };
                hovered = true;
            } else if (this.sameItem(state.hovered.item, item)) {
                // If two different endpoint items are close, only the nearest
                // one grows. Equal neighbouring items share the enlarged look.
                state.hovered = { item, distanceSquare, screenPos, record: endpointRecord };
                hovered = true;
            } else if (distanceSquare < state.hovered.distanceSquare) {
                // A later path can be closer to the cursor than the endpoint
                // drawn earlier in this frame. Paint that earlier icon back at
                // normal size before enlarging the nearer, different item.
                if (state.hovered.record) {
                    const previous = state.hovered.record;
                    previous.item.drawItemCenteredClipped(
                        previous.worldPos.x,
                        previous.worldPos.y,
                        previous.parameters,
                        shapez.globalConfig.defaultItemDiameter
                    );
                }
                state.hovered = { item, distanceSquare, screenPos, record: endpointRecord };
                hovered = true;
            }
        }
        state.endpoints.push(endpointRecord);
        return { hovered, merged };
    }

    applyMapPreviewZoom(value) {
        const multiplier = this.normalizeMultiplier(value, DEFAULT_MAP_PREVIEW_MULTIPLIER);
        this.settings.mapPreviewZoomMultiplier = multiplier;
        shapez.globalConfig.mapChunkOverviewMinZoom = this.mapPreviewVanillaZoom * multiplier;
        if (typeof this.saveSettings === "function") this.saveSettings();
    }

    applyNormalCameraZoomMultiplier(value) {
        this.settings.normalCameraZoomMultiplier = this.normalizeMultiplier(
            value,
            DEFAULT_NORMAL_CAMERA_MULTIPLIER
        );
        if (typeof this.saveSettings === "function") this.saveSettings();
    }

    applyCompactBeltZoom(value) {
        this.settings.compactBeltZoom = this.normalizeZoom(value, DEFAULT_COMPACT_BELT_ZOOM);
        if (typeof this.saveSettings === "function") this.saveSettings();
    }

    isCompactBeltStartHovered(root, worldPos) {
        // Compatibility helper for older callers; both endpoints now use the
        // same enlarged hit area through registerEndpoint().
        const mousePosition = root && root.app && root.app.mousePosition;
        if (!mousePosition || !root.camera) return false;

        const screenPos = root.camera.worldToScreen(worldPos);
        const dx = mousePosition.x - screenPos.x;
        const dy = mousePosition.y - screenPos.y;
        return dx * dx + dy * dy <= COMPACT_BELT_HOVER_RADIUS_PX * COMPACT_BELT_HOVER_RADIUS_PX;
    }

    normalizeZoom(value, fallback = DEFAULT_COMPACT_BELT_ZOOM) {
        const parsed = Number(value);
        if (!Number.isFinite(parsed)) return fallback;
        return Math.max(0.1, Math.min(1.5, parsed));
    }

    normalizeMultiplier(value, fallback = 1) {
        const parsed = Number(value);
        if (!Number.isFinite(parsed)) return fallback;
        return Math.max(0.02, Math.min(2, parsed));
    }
}
