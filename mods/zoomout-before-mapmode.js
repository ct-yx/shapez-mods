// @ts-nocheck
const METADATA = {
    website: "https://github.com/ct-yx/shapez-mods",
    author: "ct-yx & Codex",
    name: "Zoom out before Mapmode",
    version: "1.5.1",
    id: "zoomout-mapmode",
    description: "Changes map mode zoom and reduces belt item rendering at low camera zoom.",
    minimumGameVersion: ">=1.5.0",
    doesNotAffectSavegame: true,
    settings: {
        mapPreviewRangeMultiplier: 2,
        compactBeltItems: true,
        compactBeltZoom: 0.5,
    },
};

const TILE_SIZE = 32;
const VANILLA_MAP_PREVIEW_ZOOM_FALLBACK = 0.9;
const DEFAULT_MAP_PREVIEW_RANGE_MULTIPLIER = 2;
const DEFAULT_COMPACT_BELT_ZOOM = 0.5;
const MIN_COMPACT_BELT_ZOOM = 0.3;
const MAX_COMPACT_BELT_ZOOM = 2;
const COMPACT_BELT_HOVER_DIAMETER_MULTIPLIER = 2.4;
const COMPACT_BELT_HOVER_RADIUS_PX = 30;
const COMPACT_BELT_MERGE_RADIUS_PX = 38;

class Mod extends shapez.Mod {
    init() {
        this.mapPreviewVanillaZoom = this.getVanillaMapPreviewZoom();
        this.settings.mapPreviewRangeMultiplier = this.normalizeMapPreviewRangeMultiplier(
            this.settings.mapPreviewRangeMultiplier,
            DEFAULT_MAP_PREVIEW_RANGE_MULTIPLIER
        );
        this.settings.compactBeltItems = this.settings.compactBeltItems !== false;
        this.settings.compactBeltZoom = this.normalizeZoom(
            this.settings.compactBeltZoom,
            DEFAULT_COMPACT_BELT_ZOOM
        );
        this.settingsPanel = null;
        this.settingsApi = null;

        this.registerSettingsWhenAvailable();
        this.installBeltItemRenderingPatch();
        this.installBeltArrowRenderingPatch();
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
        this.settingsApi = settingsApi;
        const mapPreviewRangeDefault = this.normalizeMapPreviewRangeMultiplier(
            this.settings.mapPreviewRangeMultiplier,
            DEFAULT_MAP_PREVIEW_RANGE_MULTIPLIER
        );
        const compactDefault = this.normalizeZoom(this.settings.compactBeltZoom);

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
                    default: mapPreviewRangeDefault,
                    onChange: value => this.applyMapPreviewRange(value),
                },
                {
                    id: "zoomHelp",
                    type: "heading",
                    label: { en: "1x = vanilla · higher = farther out", zh: "1x = 原版 · 越大 = 缩得更远" },
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
                    suffix: "x",
                    label: { en: "Simplified belt rendering threshold", zh: "简化传送带渲染阈值" },
                    description: {
                        en: "Actual camera zoom multiplier. Range: 0.3x–2x. At or below it, only belt endpoint items and static, arrow-free belt bases are drawn. Default: " + compactDefault + "x.",
                        zh: "实际镜头缩放倍率。范围：0.3x–2x。到达或低于该倍率时，只绘制传送带端点物品和无箭头的静态传送带底图。默认：" + compactDefault + "x。",
                    },
                    min: MIN_COMPACT_BELT_ZOOM,
                    max: MAX_COMPACT_BELT_ZOOM,
                    step: 0.05,
                    default: compactDefault,
                    onChange: value => this.applyCompactBeltZoom(value),
                },
            ],
        });

        this.settings.mapPreviewRangeMultiplier = this.normalizeMapPreviewRangeMultiplier(
            this.settingsPanel.get("mapPreviewRangeMultiplier"),
            DEFAULT_MAP_PREVIEW_RANGE_MULTIPLIER
        );
        this.settings.compactBeltItems = this.settingsPanel.get("compactBeltItems") !== false;
        this.settings.compactBeltZoom = this.normalizeZoom(
            this.settingsPanel.get("compactBeltZoom"),
            DEFAULT_COMPACT_BELT_ZOOM
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
            if (!mod.shouldUseCompactBeltRendering(parameters, this.root)) {
                return originalDraw.call(this, parameters);
            }
            mod.prepareEndpointDrawState(this.root);
            return mod.drawCompactBeltPath(this, parameters);
        };
        prototype[marker] = true;
    }

    installBeltArrowRenderingPatch() {
        let BeltSystem = null;
        try {
            BeltSystem = typeof shapez !== "undefined" ? shapez.BeltSystem : null;
        } catch (error) { }

        if (!BeltSystem || !BeltSystem.prototype || typeof BeltSystem.prototype.drawChunk !== "function") {
            console.warn("Zoom out before Mapmode: BeltSystem draw hook is unavailable");
            return;
        }

        const prototype = BeltSystem.prototype;
        const marker = "__zoomoutMapmodeStaticBelts_13";
        if (prototype[marker]) return;

        const originalDrawChunk = prototype.drawChunk;
        const mod = this;
        prototype.drawChunk = function(parameters, chunk) {
            if (!mod.shouldUseCompactBeltRendering(parameters, this.root)) {
                return originalDrawChunk.call(this, parameters, chunk);
            }
            return mod.drawCompactBeltChunk(this, parameters, chunk, originalDrawChunk);
        };
        prototype[marker] = true;
    }

    // BeltPath.draw is responsible for the items moving on top of belts. The
    // arrows themselves come from BeltSystem.drawChunk, which normally picks
    // a time-based animation frame. In compact mode draw only beltSprites:
    // they are the base, arrow-free sprites used by the game for static belts.
    drawCompactBeltChunk(system, parameters, chunk, originalDrawChunk) {
        const entities = chunk && chunk.containedEntitiesByLayer
            && chunk.containedEntitiesByLayer.regular;
        if (!entities || typeof entities.length !== "number" || !system.beltSprites) {
            return originalDrawChunk.call(system, parameters, chunk);
        }

        for (let index = 0; index < entities.length; ++index) {
            const entity = entities[index];
            const components = entity && entity.components;
            const belt = components && components.Belt;
            const staticMapEntity = components && components.StaticMapEntity;
            if (!belt || !staticMapEntity || typeof staticMapEntity.drawSpriteOnBoundsClipped !== "function") {
                continue;
            }
            const baseSprite = system.beltSprites[belt.direction];
            if (baseSprite) staticMapEntity.drawSpriteOnBoundsClipped(parameters, baseSprite, 0);
        }
    }

    getRenderZoom(parameters, root) {
        const parameterZoom = parameters && Number(parameters.zoomLevel);
        if (Number.isFinite(parameterZoom)) return parameterZoom;
        const cameraZoom = root && root.camera && Number(root.camera.zoomLevel);
        return Number.isFinite(cameraZoom) ? cameraZoom : NaN;
    }

    shouldUseCompactBeltRendering(parameters, root) {
        if (!this.getCompactBeltItemsEnabled()) return false;
        const zoom = this.getRenderZoom(parameters, root);
        return Number.isFinite(zoom) && zoom <= this.getCompactBeltZoom();
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

    applyMapPreviewRange(value) {
        const multiplier = this.normalizeMapPreviewRangeMultiplier(
            value,
            DEFAULT_MAP_PREVIEW_RANGE_MULTIPLIER
        );
        this.settings.mapPreviewRangeMultiplier = multiplier;
        shapez.globalConfig.mapChunkOverviewMinZoom = this.mapPreviewVanillaZoom / multiplier;
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
        return Math.max(MIN_COMPACT_BELT_ZOOM, Math.min(MAX_COMPACT_BELT_ZOOM, parsed));
    }

    normalizeMapPreviewRangeMultiplier(value, fallback = 1) {
        const parsed = Number(value);
        if (!Number.isFinite(parsed)) return fallback;
        return Math.max(1, Math.min(8, parsed));
    }
}
