// @ts-nocheck
const METADATA = {
    website: "https://github.com/ct-yx/shapez-mods",
    author: "ct-yx & Codex",
    name: "Zoom out before Mapmode",
    version: "1.2.1",
    id: "zoomout-mapmode",
    description: "Changes map mode zoom and reduces belt item rendering at low camera zoom.",
    minimumGameVersion: ">=1.5.0",
    doesNotAffectSavegame: true,
    settings: {
        // These are stored as the number of horizontal world tiles visible
        // at the threshold. The legacy zoom keys are read and migrated below.
        // 0 means "calculate the default from the current window width".
        overviewGridCount: 0,
        compactBeltItems: true,
        compactBeltGridCount: 0,
    },
};

const TILE_SIZE = 32;
const MIN_ZOOM = 0.02;
const MAX_ZOOM = 1.5;
const DEFAULT_OVERVIEW_ZOOM = 0.5;
const DEFAULT_COMPACT_BELT_ZOOM = 0.5;
const COMPACT_BELT_HOVER_DIAMETER_MULTIPLIER = 2.4;
const COMPACT_BELT_HOVER_RADIUS_PX = 30;
const COMPACT_BELT_MERGE_RADIUS_PX = 38;
const DEFAULT_GRID_COUNT_FALLBACK = 120;

class Mod extends shapez.Mod {
    init() {
        this.settings.overviewGridCount = this.migrateGridCount(
            this.settings.overviewGridCount,
            this.settings.overviewZoom,
            DEFAULT_OVERVIEW_ZOOM
        );
        this.settings.compactBeltItems = this.settings.compactBeltItems !== false;
        this.settings.compactBeltGridCount = this.migrateGridCount(
            this.settings.compactBeltGridCount,
            this.settings.compactBeltZoom,
            DEFAULT_COMPACT_BELT_ZOOM
        );
        this.settingsPanel = null;
        this.settingsApi = null;

        this.installMinimumZoomPatch();
        this.registerSettingsWhenAvailable();
        this.installBeltItemRenderingPatch();

        this.signals.stateEntered.add(() => {
            this.registerSettingsWhenAvailable();
            this.applyZoom(this.getZoomValue());
        });
    }

    getSettingsApi() {
        return globalThis.ShapezStructuredSettings
            || (typeof shapez !== "undefined" ? shapez.StructuredModSettings : null);
    }

    installMinimumZoomPatch() {
        // The vanilla regular mode stops camera zooming out at 0.06. The
        // settings range already supports a 0.02 map threshold, so without
        // lowering this floor the largest grid-count values can never be
        // reached and appear to have no effect.
        const RegularGameMode = typeof shapez !== "undefined"
            ? shapez.RegularGameMode
            : null;
        if (!RegularGameMode || !RegularGameMode.prototype
            || typeof RegularGameMode.prototype.getMinimumZoom !== "function"
            || !this.modInterface || typeof this.modInterface.extendClass !== "function") {
            return;
        }

        const marker = "__zoomoutMapmodeMinimumZoom_121";
        if (RegularGameMode.prototype[marker]) return;

        this.modInterface.extendClass(RegularGameMode, ({ $old }) => ({
            getMinimumZoom() {
                const vanillaMinimum = Number($old.getMinimumZoom.call(this));
                const lowerBound = MIN_ZOOM * 0.5;
                return Number.isFinite(vanillaMinimum)
                    ? Math.min(vanillaMinimum, lowerBound)
                    : lowerBound;
            },
        }));
        RegularGameMode.prototype[marker] = true;
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
        const overviewDefault = this.normalizeGridCount(
            this.settings.overviewGridCount,
            DEFAULT_OVERVIEW_ZOOM
        );
        const compactDefault = this.normalizeGridCount(
            this.settings.compactBeltGridCount,
            DEFAULT_COMPACT_BELT_ZOOM
        );
        const range = this.getGridCountRange();
        const width = this.getEnvironmentWidth();

        this.settingsPanel = settingsApi.register({
                id: METADATA.id,
                title: { en: "Zoom out before Mapmode", zh: "地图总览缩放" },
                description: {
                    en: "Use the number of horizontal grids visible on your screen instead of an abstract zoom value.",
                    zh: "使用屏幕横向可显示的网格数，而不是不直观的缩放小数值。",
                },
                fields: [
                    {
                        id: "overviewGridCount",
                        type: "number",
                        label: { en: "Horizontal grids before Map mode", zh: "进入地图总览前的横向网格数" },
                        description: {
                            en: "Current width: " + width + " px. More grids switch later; the upper limit corresponds to zoom 0.02.",
                            zh: "当前窗口宽度：" + width + " px。网格数越多，进入总览越晚；上限对应缩放值 0.02。",
                        },
                        min: range.min,
                        max: range.max,
                        step: 1,
                        default: overviewDefault,
                        onChange: value => this.applyGridCount(value),
                    },
                    {
                        id: "restoreDefault",
                        type: "heading",
                        label: { en: "More grids = later · fewer grids = earlier", zh: "网格数越多 = 更晚 · 网格数越少 = 更早" },
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
                        id: "compactBeltGridCount",
                        type: "number",
                        label: { en: "Horizontal grids for compact belts", zh: "简化传送带时的横向网格数" },
                        description: {
                            en: "At or below this camera scale, only belt endpoints are drawn. Default: " + compactDefault + " grids.",
                            zh: "实际镜头缩放到该网格数或更远时，仅显示传送带端点。默认：" + compactDefault + " 格。",
                        },
                        min: range.min,
                        max: range.max,
                        step: 1,
                        default: compactDefault,
                        onChange: value => this.applyCompactBeltGridCount(value),
                    },
                ],
            });

        this.settings.overviewGridCount = this.normalizeGridCount(
            this.settingsPanel.get("overviewGridCount"),
            DEFAULT_OVERVIEW_ZOOM
        );
        this.settings.compactBeltItems = this.settingsPanel.get("compactBeltItems") !== false;
        this.settings.compactBeltGridCount = this.normalizeGridCount(
            this.settingsPanel.get("compactBeltGridCount"),
            DEFAULT_COMPACT_BELT_ZOOM
        );
        this.applyZoom(this.getZoomValue());
    }

    getEnvironmentWidth() {
        const app = this.app || (this.modLoader && this.modLoader.app);
        if (app && Number.isFinite(Number(app.screenWidth)) && app.screenWidth > 0) {
            return Math.max(320, Math.round(app.screenWidth));
        }
        try {
            if (Number.isFinite(Number(window.innerWidth)) && window.innerWidth > 0) {
                return Math.max(320, Math.round(window.innerWidth));
            }
        } catch (error) { }
        return DEFAULT_GRID_COUNT_FALLBACK * TILE_SIZE * DEFAULT_OVERVIEW_ZOOM;
    }

    getGridCountRange() {
        const width = this.getEnvironmentWidth();
        return {
            min: Math.max(1, Math.ceil(width / (TILE_SIZE * MAX_ZOOM))),
            max: Math.max(2, Math.floor(width / (TILE_SIZE * MIN_ZOOM))),
        };
    }

    zoomToGridCount(value) {
        const parsed = Number(value);
        const zoom = Number.isFinite(parsed) ? Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, parsed)) : DEFAULT_OVERVIEW_ZOOM;
        return Math.round(this.getEnvironmentWidth() / (TILE_SIZE * zoom));
    }

    gridCountToZoom(value, fallbackZoom = DEFAULT_OVERVIEW_ZOOM) {
        const parsed = Number(value);
        const count = Number.isFinite(parsed) && parsed > 0
            ? parsed
            : this.zoomToGridCount(fallbackZoom);
        return Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, this.getEnvironmentWidth() / (TILE_SIZE * count)));
    }

    normalizeGridCount(value, fallbackZoom = DEFAULT_OVERVIEW_ZOOM) {
        const range = this.getGridCountRange();
        const parsed = Number(value);
        const fallback = this.zoomToGridCount(fallbackZoom);
        const count = Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
        return Math.max(range.min, Math.min(range.max, Math.round(count)));
    }

    migrateGridCount(value, legacyZoom, fallbackZoom) {
        const parsed = Number(value);
        const legacy = Number(legacyZoom);
        const metadataDefault = Number(METADATA.settings.overviewGridCount);
        const usingLegacyDefault = Number.isFinite(legacy)
            && legacy > 0
            && Number.isFinite(parsed)
            && parsed === metadataDefault;
        if (Number.isFinite(parsed) && parsed > 1 && !usingLegacyDefault) {
            return this.normalizeGridCount(value, fallbackZoom);
        }
        return this.normalizeGridCount(
            Number.isFinite(legacy) && legacy > 0 ? this.zoomToGridCount(legacy) : undefined,
            fallbackZoom
        );
    }

    getZoomValue() {
        if (this.settingsPanel) {
            const value = this.settingsPanel.get("overviewGridCount");
            if (value !== undefined) return this.gridCountToZoom(value);
        }
        return this.gridCountToZoom(this.settings.overviewGridCount);
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
            const value = this.settingsPanel.get("compactBeltGridCount");
            if (value !== undefined) return this.gridCountToZoom(value, DEFAULT_COMPACT_BELT_ZOOM);
        }
        return this.gridCountToZoom(this.settings.compactBeltGridCount, DEFAULT_COMPACT_BELT_ZOOM);
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

    applyGridCount(value) {
        const count = this.normalizeGridCount(value, DEFAULT_OVERVIEW_ZOOM);
        this.settings.overviewGridCount = count;
        shapez.globalConfig.mapChunkOverviewMinZoom = this.gridCountToZoom(count);
        if (typeof this.saveSettings === "function") this.saveSettings();
    }

    applyCompactBeltGridCount(value) {
        this.settings.compactBeltGridCount = this.normalizeGridCount(value, DEFAULT_COMPACT_BELT_ZOOM);
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

    applyZoom(value) {
        const zoom = this.gridCountToZoom(value, DEFAULT_OVERVIEW_ZOOM);
        shapez.globalConfig.mapChunkOverviewMinZoom = zoom;
    }
}
