// @ts-nocheck
const METADATA = {
    website: "https://github.com/ct-yx/shapez-mods",
    author: "ct-yx & Codex",
    name: "Belt Optimization",
    version: "1.0.0",
    id: "belt-optimization",
    description: "Optimizes belt animation and item rendering without changing logistics simulation.",
    minimumGameVersion: ">=1.5.0",
    doesNotAffectSavegame: true,
    settings: {
        enabled: true,
        staticBeltAnimationSpeedThreshold: 15,
        compactBeltItems: true,
        compactBeltZoom: 0.5,
    },
};

const TILE_SIZE = 32;
const DEFAULT_STATIC_BELT_ANIMATION_SPEED_THRESHOLD = 15;
const MIN_STATIC_BELT_ANIMATION_SPEED_THRESHOLD = 0;
const MAX_STATIC_BELT_ANIMATION_SPEED_THRESHOLD = 1000;
const DEFAULT_COMPACT_BELT_ZOOM = 0.5;
const MIN_COMPACT_BELT_ZOOM = 0.3;
const MAX_COMPACT_BELT_ZOOM = 2;
const COMPACT_BELT_HOVER_DIAMETER_MULTIPLIER = 2.4;
const COMPACT_BELT_HOVER_RADIUS_PX = 30;
const COMPACT_BELT_MERGE_RADIUS_PX = 38;

class Mod extends shapez.Mod {
    init() {
        this.settings.enabled = this.settings.enabled !== false;
        this.settings.staticBeltAnimationSpeedThreshold = this.normalizeStaticBeltAnimationSpeedThreshold(
            this.settings.staticBeltAnimationSpeedThreshold
        );
        this.settings.compactBeltItems = this.settings.compactBeltItems !== false;
        this.settings.compactBeltZoom = this.normalizeZoom(
            this.settings.compactBeltZoom,
            DEFAULT_COMPACT_BELT_ZOOM
        );
        this.settingsPanel = null;
        this.settingsApi = null;

        this.registerSettingsWhenAvailable();
        this.installStaticBeltAnimationPatches();
        this.installBeltItemRenderingPatch();
        this.installBeltArrowRenderingPatch();
    }

    normalizeStaticBeltAnimationSpeedThreshold(value) {
        const number = Number(value);
        if (!Number.isFinite(number)) return DEFAULT_STATIC_BELT_ANIMATION_SPEED_THRESHOLD;
        return Math.max(
            MIN_STATIC_BELT_ANIMATION_SPEED_THRESHOLD,
            Math.min(MAX_STATIC_BELT_ANIMATION_SPEED_THRESHOLD, Math.round(number))
        );
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
        this.migrateLegacySettings(settingsApi);
        this.settingsApi = settingsApi;
        const thresholdDefault = this.normalizeStaticBeltAnimationSpeedThreshold(
            this.settings.staticBeltAnimationSpeedThreshold
        );
        const compactDefault = this.normalizeZoom(this.settings.compactBeltZoom);
        this.settingsPanel = settingsApi.register({
            id: METADATA.id,
            title: { en: "Belt Optimization", zh: "传送带优化" },
            description: {
                en: "Reduces belt rendering cost without changing item flow or simulation logic.",
                zh: "降低传送带绘制开销，不改变物品流动或模拟逻辑。",
            },
            fields: [
                {
                    id: "enabled",
                    type: "boolean",
                    label: { en: "Enable belt visual optimization", zh: "启用传送带视觉优化" },
                    description: {
                        en: "Master switch for belt animation and low-zoom item rendering.",
                        zh: "控制传送带动画和低缩放物品绘制优化。",
                    },
                    default: true,
                    onChange: value => { this.settings.enabled = Boolean(value); this.saveSettings(); },
                },
                {
                    id: "staticBeltAnimationSpeedThreshold",
                    type: "number",
                    suffix: " items/s",
                    label: { en: "Freeze belt animation above throughput", zh: "超过吞吐阈值时冻结传送带动画" },
                    description: {
                        en: "Freezes belt and underlay animation above this speed. Set to 0 to disable.",
                        zh: "传送带实际速度超过此值时冻结箭头和底纹动画；设为 0 可关闭。",
                    },
                    min: MIN_STATIC_BELT_ANIMATION_SPEED_THRESHOLD,
                    max: MAX_STATIC_BELT_ANIMATION_SPEED_THRESHOLD,
                    step: 1,
                    default: thresholdDefault,
                    onChange: value => {
                        this.settings.staticBeltAnimationSpeedThreshold = this.normalizeStaticBeltAnimationSpeedThreshold(value);
                        this.saveSettings();
                    },
                },
                {
                    id: "compactBeltItems",
                    type: "boolean",
                    label: { en: "Compact belt items at low zoom", zh: "低缩放时简化传送带物品" },
                    description: {
                        en: "Shows only the first and last item on each belt path below the zoom threshold.",
                        zh: "低于缩放阈值时，每条传送带路径只显示首尾物品。",
                    },
                    default: true,
                    onChange: value => { this.settings.compactBeltItems = Boolean(value); this.saveSettings(); },
                },
                {
                    id: "compactBeltZoom",
                    type: "number",
                    suffix: "x",
                    label: { en: "Simplified belt rendering threshold", zh: "简化传送带渲染阈值" },
                    description: {
                        en: "At or below this camera zoom, draw static belt bases and endpoint items only. Default: " + compactDefault + "x.",
                        zh: "镜头缩放达到或低于该值时，只绘制静态传送带底图和端点物品。默认：" + compactDefault + "x。",
                    },
                    min: MIN_COMPACT_BELT_ZOOM,
                    max: MAX_COMPACT_BELT_ZOOM,
                    step: 0.05,
                    default: compactDefault,
                    onChange: value => this.applyCompactBeltZoom(value),
                },
            ],
        });
        this.settings.enabled = this.settingsPanel.get("enabled") !== false;
        this.settings.staticBeltAnimationSpeedThreshold = this.normalizeStaticBeltAnimationSpeedThreshold(
            this.settingsPanel.get("staticBeltAnimationSpeedThreshold")
        );
        this.settings.compactBeltItems = this.settingsPanel.get("compactBeltItems") !== false;
        this.settings.compactBeltZoom = this.normalizeZoom(this.settingsPanel.get("compactBeltZoom"));
    }

    migrateLegacySettings(settingsApi) {
        if (this.legacySettingsMigrated || !settingsApi
            || typeof settingsApi.copyStoredValues !== "function") {
            return;
        }
        settingsApi.copyStoredValues("belt-speed-x10", METADATA.id, [
            "staticBeltAnimationSpeedThreshold",
        ]);
        settingsApi.copyStoredValues("zoomout-mapmode", METADATA.id, [
            "compactBeltItems",
            "compactBeltZoom",
        ]);
        this.legacySettingsMigrated = true;
    }

    getEnabled() {
        if (this.settingsPanel) return this.settingsPanel.get("enabled") !== false;
        return this.settings.enabled !== false;
    }

    getStaticBeltAnimationSpeedThreshold() {
        const value = this.settingsPanel
            ? this.settingsPanel.get("staticBeltAnimationSpeedThreshold")
            : this.settings.staticBeltAnimationSpeedThreshold;
        return this.normalizeStaticBeltAnimationSpeedThreshold(value);
    }

    shouldFreezeBeltAnimations(root) {
        const renderCache = this.getRenderFrameCache(root);
        if (renderCache && renderCache.hasFrozenBeltAnimations) {
            return renderCache.freezeBeltAnimations;
        }

        let shouldFreeze = false;
        if (this.getEnabled()) {
            const threshold = this.getStaticBeltAnimationSpeedThreshold();
            const hubGoals = root && root.hubGoals;
            if (
                threshold > 0
                && hubGoals
                && typeof hubGoals.getBeltBaseSpeed === "function"
            ) {
                // getBeltBaseSpeed is the same items/s value shown by the belt's
                // placement statistics and includes this Mod's active multiplier.
                // It reflects real simulation throughput capacity rather than merely
                // the configured multiplier, so belt animations stay live at 5x when
                // a low vanilla belt tier is still below the selected threshold.
                shouldFreeze = Number(hubGoals.getBeltBaseSpeed()) > threshold;
            }
        }

        if (renderCache) {
            renderCache.hasFrozenBeltAnimations = true;
            renderCache.freezeBeltAnimations = shouldFreeze;
        }
        return shouldFreeze;
    }

    installStaticBeltAnimationPatches() {
        const mod = this;
        this.installStaticAnimationPatch(shapez.BeltSystem, "__beltOptimizationStaticBelt_100", mod);
        this.installStaticAnimationPatch(
            shapez.BeltUnderlaysSystem,
            "__beltOptimizationStaticUnderlay_100",
            mod
        );
    }

    installStaticAnimationPatch(systemClass, marker, mod) {
        if (
            !systemClass ||
            !systemClass.prototype ||
            typeof systemClass.prototype.drawChunk !== "function" ||
            systemClass.prototype[marker]
        ) {
            return;
        }

        this.modInterface.replaceMethod(systemClass, "drawChunk", function (oldDrawChunk, args) {
            if (!mod.shouldFreezeBeltAnimations(this.root)) {
                return oldDrawChunk(args && args[0], args && args[1]);
            }

            // Both vanilla draw methods derive their belt-sprite animation
            // frame from root.time.realtimeNow(). Freeze just that synchronous
            // draw call at frame 0, then immediately restore the clock so
            // logic, item movement, and every other renderer remain live.
            const time = this.root && this.root.time;
            const realtimeNow = time && time.realtimeNow;
            if (typeof realtimeNow !== "function") {
                return oldDrawChunk(args && args[0], args && args[1]);
            }

            time.realtimeNow = () => 0;
            try {
                return oldDrawChunk(args && args[0], args && args[1]);
            } finally {
                time.realtimeNow = realtimeNow;
            }
        });

        systemClass.prototype[marker] = true;
    }

    getCompactBeltItemsEnabled() {
        if (!this.getEnabled()) return false;
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

    applyCompactBeltZoom(value) {
        this.settings.compactBeltZoom = this.normalizeZoom(value, DEFAULT_COMPACT_BELT_ZOOM);
        if (typeof this.saveSettings === "function") this.saveSettings();
    }


    installBeltItemRenderingPatch() {
        let BeltPath = null;
        try {
            BeltPath = typeof shapez !== "undefined" ? shapez.BeltPath : null;
        } catch (error) { }

        if (!BeltPath || !BeltPath.prototype || typeof BeltPath.prototype.draw !== "function") {
            console.warn("Belt Optimization: BeltPath draw hook is unavailable");
            return;
        }

        const prototype = BeltPath.prototype;
        const marker = "__beltOptimizationCompactItems_100";
        if (prototype[marker]) return;

        const originalDraw = prototype.draw;
        const mod = this;
        this.signals.gameStarted.add(root => {
            if (!root || !root.signals || !root.signals.gameFrameStarted) return;
            root.__beltOptimizationRenderFrameCache = { frameStarted: false };
            // GameCore dispatches this only for a real draw, so skipped draw
            // frames never consume cached values and the next draw resets them.
            root.signals.gameFrameStarted.add(() => {
                this.resetEndpointDrawState(root);
                this.resetRenderFrameCache(root);
            }, this);
            root.signals.aboutToDestruct.add(() => {
                delete root.__beltOptimizationEndpointDrawState;
                delete root.__beltOptimizationRenderFrameCache;
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
            console.warn("Belt Optimization: BeltSystem draw hook is unavailable");
            return;
        }

        const prototype = BeltSystem.prototype;
        const marker = "__beltOptimizationStaticBelts_100";
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
        const renderCache = this.getRenderFrameCache(root);
        // Shapez shares one DrawParameters object across a render pass. Keeping
        // its identity as the key also avoids reusing the result for another pass.
        if (
            renderCache
            && renderCache.hasCompactBeltRendering
            && renderCache.compactBeltParameters === parameters
        ) {
            return renderCache.compactBeltRendering;
        }

        let shouldUseCompactRendering = false;
        if (this.getCompactBeltItemsEnabled()) {
            const zoom = this.getRenderZoom(parameters, root);
            shouldUseCompactRendering = Number.isFinite(zoom)
                && zoom <= this.getCompactBeltZoom();
        }
        if (renderCache) {
            renderCache.hasCompactBeltRendering = true;
            renderCache.compactBeltParameters = parameters;
            renderCache.compactBeltRendering = shouldUseCompactRendering;
        }
        return shouldUseCompactRendering;
    }

    getRenderFrameCache(root) {
        const renderCache = root && root.__beltOptimizationRenderFrameCache;
        return renderCache && renderCache.frameStarted ? renderCache : null;
    }

    resetRenderFrameCache(root) {
        if (!root) return;
        const renderCache = root.__beltOptimizationRenderFrameCache;
        if (!renderCache) return;

        renderCache.frameStarted = true;
        renderCache.hasCompactBeltRendering = false;
        renderCache.compactBeltParameters = null;
        renderCache.compactBeltRendering = false;
        renderCache.hasFrozenBeltAnimations = false;
        renderCache.freezeBeltAnimations = false;
    }

    drawCompactBeltPath(path, parameters) {
        if (!parameters.visibleRect.containsRect(path.worldBounds) || path.items.length === 0) return;

        const first = path.items[0];
        const lastIndex = path.items.length - 1;
        const last = path.items[lastIndex];

        this.drawCompactBeltItem(path, parameters, first, path.spacingToFirstItem, "start");
        if (lastIndex > 0) {
            // Each item stores its distance to the next item (or the path end),
            // so the last item's position is available without summing all items.
            const lastProgress = path.totalLength - last[0];
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
        if (!root.__beltOptimizationEndpointDrawState) {
            root.__beltOptimizationEndpointDrawState = {
                path: null,
                endpointBuckets: new Map(),
                hovered: null,
            };
        }
        const state = root.__beltOptimizationEndpointDrawState;
        if (state.path !== root) {
            state.path = root;
            state.endpointBuckets.clear();
            state.hovered = null;
        }
    }

    resetEndpointDrawState(root) {
        if (!root || !root.__beltOptimizationEndpointDrawState) return;
        const state = root.__beltOptimizationEndpointDrawState;
        state.endpointBuckets.clear();
        state.hovered = null;
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
        const state = root && root.__beltOptimizationEndpointDrawState;
        if (!state) return { hovered: false, merged: false };

        const screenPos = root.camera.worldToScreen(worldPos);
        const endpointRecord = { worldPos, screenPos, item, endpoint, parameters };
        let merged = false;
        const bucketSize = COMPACT_BELT_MERGE_RADIUS_PX;
        const bucketX = Math.floor(screenPos.x / bucketSize);
        const bucketY = Math.floor(screenPos.y / bucketSize);
        const screenPositionIsFinite = Number.isFinite(screenPos.x) && Number.isFinite(screenPos.y);

        if (screenPositionIsFinite) {
            // A point within the merge radius can only be in this screen-space
            // bucket or one of its eight neighbors. This keeps distant belt
            // endpoints out of the candidate scan while retaining the exact
            // distance checks below.
            for (let y = bucketY - 1; y <= bucketY + 1 && !merged; ++y) {
                for (let x = bucketX - 1; x <= bucketX + 1 && !merged; ++x) {
                    const candidates = state.endpointBuckets.get(x + "," + y);
                    if (!candidates) continue;

                    for (const previous of candidates) {
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
                }
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
        if (screenPositionIsFinite) {
            const bucketKey = bucketX + "," + bucketY;
            let bucket = state.endpointBuckets.get(bucketKey);
            if (!bucket) {
                bucket = [];
                state.endpointBuckets.set(bucketKey, bucket);
            }
            bucket.push(endpointRecord);
        }
        return { hovered, merged };
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
}
