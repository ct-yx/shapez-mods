// @ts-nocheck
const METADATA = {
    website: "https://github.com/ct-yx/shapez-mods",
    author: "ct-yx & Codex",
    name: "Belt Speed Control",
    // Keep the existing settings namespace so current speed/range choices
    // remain intact while the two new tier fields receive their defaults.
    version: "1.4.0",
    id: "belt-speed-x10",
    description: "Adjusts belt speeds, underground belt range, the vanilla 2-way balancer and replaces the built-in belt reader processor.",
    minimumGameVersion: ">=1.5.0",
    doesNotAffectSavegame: true,
    settings: {
        enabled: true,
        multiplier: 10,
        staticBeltAnimationSpeedThreshold: 15,
        tunnelRangeMultiplierTier1: 1,
        tunnelRangeMultiplierTier2: 1,
        tunnelRangeMultiplierTier3: 1,
        tunnelRangeMultiplierTier4: 1,
    },
};

const DEFAULT_ENABLED = true;
const DEFAULT_MULTIPLIER = 10;
const MIN_MULTIPLIER = 1;
const MAX_MULTIPLIER = 50;
const DEFAULT_STATIC_BELT_ANIMATION_SPEED_THRESHOLD = 15;
const MIN_STATIC_BELT_ANIMATION_SPEED_THRESHOLD = 0;
const MAX_STATIC_BELT_ANIMATION_SPEED_THRESHOLD = 1000;
const DEFAULT_TUNNEL_RANGE_MULTIPLIER = 1;
const MIN_TUNNEL_RANGE_MULTIPLIER = 1;
const MAX_TUNNEL_RANGE_MULTIPLIER = 10;
const UNDERGROUND_BELT_BASE_RANGES = [5, 9, 13, 17];

class Mod extends shapez.Mod {
    init() {
        this.settings.enabled = this.settings.enabled !== false;
        this.settings.multiplier = this.normalizeMultiplier(this.settings.multiplier);
        this.settings.staticBeltAnimationSpeedThreshold = this.normalizeStaticBeltAnimationSpeedThreshold(
            this.settings.staticBeltAnimationSpeedThreshold
        );
        this.settings.tunnelRangeMultiplierTier1 = this.normalizeTunnelRangeMultiplier(
            this.settings.tunnelRangeMultiplierTier1
        );
        this.settings.tunnelRangeMultiplierTier2 = this.normalizeTunnelRangeMultiplier(
            this.settings.tunnelRangeMultiplierTier2
        );
        this.settings.tunnelRangeMultiplierTier3 = this.normalizeTunnelRangeMultiplier(
            this.settings.tunnelRangeMultiplierTier3
        );
        this.settings.tunnelRangeMultiplierTier4 = this.normalizeTunnelRangeMultiplier(
            this.settings.tunnelRangeMultiplierTier4
        );
        this.settingsPanel = null;
        this.tunnelRangeRevision = 0;

        this.installExtendedUndergroundBeltTiers();
        this.registerSettingsWhenAvailable();
        this.installSpeedPatches();
        this.installStaticBeltAnimationPatches();
        this.installTunnelRangeCacheRefreshPatch();
        this.applyTunnelRangeMultipliers(this.getTunnelRangeMultipliers());
        this.installBeltReaderReplacement();
        this.installBeltReaderPatch();
    }

    normalizeMultiplier(value) {
        const number = Number(value);
        if (!Number.isFinite(number)) return DEFAULT_MULTIPLIER;
        return Math.max(MIN_MULTIPLIER, Math.min(MAX_MULTIPLIER, Math.round(number)));
    }

    normalizeStaticBeltAnimationSpeedThreshold(value) {
        const number = Number(value);
        if (!Number.isFinite(number)) return DEFAULT_STATIC_BELT_ANIMATION_SPEED_THRESHOLD;
        return Math.max(
            MIN_STATIC_BELT_ANIMATION_SPEED_THRESHOLD,
            Math.min(MAX_STATIC_BELT_ANIMATION_SPEED_THRESHOLD, Math.round(number))
        );
    }

    normalizeTunnelRangeMultiplier(value) {
        const number = Number(value);
        if (!Number.isFinite(number)) return DEFAULT_TUNNEL_RANGE_MULTIPLIER;
        return Math.max(
            MIN_TUNNEL_RANGE_MULTIPLIER,
            Math.min(MAX_TUNNEL_RANGE_MULTIPLIER, Math.round(number))
        );
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

        // Structured Mod Settings UI may be loaded after this file. The
        // library drains this queue during its own initialization.
        const pending = globalThis.ShapezStructuredSettingsPending
            || (globalThis.ShapezStructuredSettingsPending = []);
        pending.push(nextApi => {
            if (nextApi && typeof nextApi.register === "function") {
                this.registerStructuredSettings(nextApi);
            }
        });
    }

    registerStructuredSettings(api) {
        if (this.settingsPanel) return;
        this.settingsPanel = api.register({
            id: METADATA.id,
            title: { en: "Belt Speed Control", zh: "传送带速度控制" },
            description: {
                en: "Adjust belt throughput. 1x is the vanilla speed and therefore disables the acceleration.",
                zh: "调整传送带吞吐速度。1x 等于原版速度，也就相当于禁用加速。",
            },
            fields: [
                {
                    id: "enabled",
                    type: "boolean",
                    label: { en: "Enable belt acceleration", zh: "启用传送带加速" },
                    description: {
                        en: "Also affects underground belts and the vanilla 2-way balancer.",
                        zh: "同时影响地下传送带和原版 2-way 平衡器。",
                    },
                    default: DEFAULT_ENABLED,
                    onChange: value => {
                        this.settings.enabled = Boolean(value);
                        this.saveSettings();
                    },
                },
                {
                    id: "multiplier",
                    type: "number",
                    label: { en: "Speed per tier", zh: "每级速度倍率" },
                    description: {
                        en: "Slider range: 1x–50x. 1x uses vanilla speed.",
                        zh: "滑块范围：1x–50x。1x 使用原版速度。",
                    },
                    min: MIN_MULTIPLIER,
                    max: MAX_MULTIPLIER,
                    step: 1,
                    default: DEFAULT_MULTIPLIER,
                    onChange: value => {
                        this.settings.multiplier = this.normalizeMultiplier(value);
                        this.saveSettings();
                    },
                },
                {
                    id: "staticBeltAnimationSpeedThreshold",
                    type: "number",
                    label: {
                        en: "Freeze belt animation above throughput",
                        zh: "传送带吞吐超过阈值时静止动画",
                    },
                    description: {
                        en: "Freeze belt and underlay animation only when the actual belt speed exceeds this value. Set to 0 items/s to disable. Does not change simulation speed or item flow.",
                        zh: "仅当传送带实际速度超过此值时，将传送带及其底层贴图固定在静态帧。设为 0 items/s 可关闭；不影响模拟速度或物品流动。",
                    },
                    min: MIN_STATIC_BELT_ANIMATION_SPEED_THRESHOLD,
                    max: MAX_STATIC_BELT_ANIMATION_SPEED_THRESHOLD,
                    step: 1,
                    suffix: "items/s",
                    default: DEFAULT_STATIC_BELT_ANIMATION_SPEED_THRESHOLD,
                    onChange: value => {
                        this.settings.staticBeltAnimationSpeedThreshold =
                            this.normalizeStaticBeltAnimationSpeedThreshold(value);
                        this.saveSettings();
                    },
                },
                {
                    id: "tunnelRangeMultiplierTier1",
                    type: "number",
                    label: { en: "Underground belt range · Tier 1", zh: "一级地下传送带范围" },
                    description: {
                        en: "Range multiplier: 1x–10x. Vanilla range is 5 tiles; 10x reaches 50 tiles.",
                        zh: "范围倍率：1x–10x。原版最远 5 格；10x 时最远 50 格。",
                    },
                    min: MIN_TUNNEL_RANGE_MULTIPLIER,
                    max: MAX_TUNNEL_RANGE_MULTIPLIER,
                    step: 1,
                    default: DEFAULT_TUNNEL_RANGE_MULTIPLIER,
                    onChange: value => {
                        this.settings.tunnelRangeMultiplierTier1 = this.normalizeTunnelRangeMultiplier(value);
                        this.applyTunnelRangeMultipliers(this.getTunnelRangeMultipliers());
                        this.saveSettings();
                    },
                },
                {
                    id: "tunnelRangeMultiplierTier2",
                    type: "number",
                    label: { en: "Underground belt range · Tier 2", zh: "二级地下传送带范围" },
                    description: {
                        en: "Range multiplier: 1x–10x. Vanilla range is 9 tiles; 10x reaches 90 tiles.",
                        zh: "范围倍率：1x–10x。原版最远 9 格；10x 时最远 90 格。",
                    },
                    min: MIN_TUNNEL_RANGE_MULTIPLIER,
                    max: MAX_TUNNEL_RANGE_MULTIPLIER,
                    step: 1,
                    default: DEFAULT_TUNNEL_RANGE_MULTIPLIER,
                    onChange: value => {
                        this.settings.tunnelRangeMultiplierTier2 = this.normalizeTunnelRangeMultiplier(value);
                        this.applyTunnelRangeMultipliers(this.getTunnelRangeMultipliers());
                        this.saveSettings();
                    },
                },
                {
                    id: "tunnelRangeMultiplierTier3",
                    type: "number",
                    label: { en: "Underground belt range · Tier 3", zh: "三级地下传送带范围" },
                    description: {
                        en: "Range multiplier: 1x–10x. Base range is 13 tiles; 10x reaches 130 tiles.",
                        zh: "范围倍率：1x–10x。基础最远 13 格；10x 时最远 130 格。",
                    },
                    min: MIN_TUNNEL_RANGE_MULTIPLIER,
                    max: MAX_TUNNEL_RANGE_MULTIPLIER,
                    step: 1,
                    default: DEFAULT_TUNNEL_RANGE_MULTIPLIER,
                    onChange: value => {
                        this.settings.tunnelRangeMultiplierTier3 = this.normalizeTunnelRangeMultiplier(value);
                        this.applyTunnelRangeMultipliers(this.getTunnelRangeMultipliers());
                        this.saveSettings();
                    },
                },
                {
                    id: "tunnelRangeMultiplierTier4",
                    type: "number",
                    label: { en: "Underground belt range · Tier 4", zh: "四级地下传送带范围" },
                    description: {
                        en: "Range multiplier: 1x–10x. Base range is 17 tiles; 10x reaches 170 tiles.",
                        zh: "范围倍率：1x–10x。基础最远 17 格；10x 时最远 170 格。",
                    },
                    min: MIN_TUNNEL_RANGE_MULTIPLIER,
                    max: MAX_TUNNEL_RANGE_MULTIPLIER,
                    step: 1,
                    default: DEFAULT_TUNNEL_RANGE_MULTIPLIER,
                    onChange: value => {
                        this.settings.tunnelRangeMultiplierTier4 = this.normalizeTunnelRangeMultiplier(value);
                        this.applyTunnelRangeMultipliers(this.getTunnelRangeMultipliers());
                        this.saveSettings();
                    },
                },
            ],
        });

        this.settings.enabled = this.settingsPanel.get("enabled") !== false;
        this.settings.multiplier = this.normalizeMultiplier(
            this.settingsPanel.get("multiplier")
        );
        this.settings.staticBeltAnimationSpeedThreshold = this.normalizeStaticBeltAnimationSpeedThreshold(
            this.settingsPanel.get("staticBeltAnimationSpeedThreshold")
        );
        this.settings.tunnelRangeMultiplierTier1 = this.normalizeTunnelRangeMultiplier(
            this.settingsPanel.get("tunnelRangeMultiplierTier1")
        );
        this.settings.tunnelRangeMultiplierTier2 = this.normalizeTunnelRangeMultiplier(
            this.settingsPanel.get("tunnelRangeMultiplierTier2")
        );
        this.settings.tunnelRangeMultiplierTier3 = this.normalizeTunnelRangeMultiplier(
            this.settingsPanel.get("tunnelRangeMultiplierTier3")
        );
        this.settings.tunnelRangeMultiplierTier4 = this.normalizeTunnelRangeMultiplier(
            this.settingsPanel.get("tunnelRangeMultiplierTier4")
        );
        this.applyTunnelRangeMultipliers(this.getTunnelRangeMultipliers());
    }

    getEnabled() {
        if (this.settingsPanel) return this.settingsPanel.get("enabled") !== false;
        return this.settings.enabled !== false;
    }

    getMultiplier() {
        if (!this.getEnabled()) return 1;
        const value = this.settingsPanel
            ? this.settingsPanel.get("multiplier")
            : this.settings.multiplier;
        const multiplier = this.normalizeMultiplier(value);
        return multiplier <= 1 ? 1 : multiplier;
    }

    getStaticBeltAnimationSpeedThreshold() {
        const value = this.settingsPanel
            ? this.settingsPanel.get("staticBeltAnimationSpeedThreshold")
            : this.settings.staticBeltAnimationSpeedThreshold;
        return this.normalizeStaticBeltAnimationSpeedThreshold(value);
    }

    shouldFreezeBeltAnimations(root) {
        const threshold = this.getStaticBeltAnimationSpeedThreshold();
        const hubGoals = root && root.hubGoals;
        if (threshold <= 0 || !hubGoals || typeof hubGoals.getBeltBaseSpeed !== "function") {
            return false;
        }

        // getBeltBaseSpeed is the same items/s value shown by the belt's
        // placement statistics and includes this Mod's active multiplier.
        // It reflects real simulation throughput capacity rather than merely
        // the configured multiplier, so belt animations stay live at 5x when
        // a low vanilla belt tier is still below the selected threshold.
        return Number(hubGoals.getBeltBaseSpeed()) > threshold;
    }

    getTunnelRangeMultipliers() {
        const tier1Value = this.settingsPanel
            ? this.settingsPanel.get("tunnelRangeMultiplierTier1")
            : this.settings.tunnelRangeMultiplierTier1;
        const tier2Value = this.settingsPanel
            ? this.settingsPanel.get("tunnelRangeMultiplierTier2")
            : this.settings.tunnelRangeMultiplierTier2;
        const tier3Value = this.settingsPanel
            ? this.settingsPanel.get("tunnelRangeMultiplierTier3")
            : this.settings.tunnelRangeMultiplierTier3;
        const tier4Value = this.settingsPanel
            ? this.settingsPanel.get("tunnelRangeMultiplierTier4")
            : this.settings.tunnelRangeMultiplierTier4;
        return [
            this.normalizeTunnelRangeMultiplier(tier1Value),
            this.normalizeTunnelRangeMultiplier(tier2Value),
            this.normalizeTunnelRangeMultiplier(tier3Value),
            this.normalizeTunnelRangeMultiplier(tier4Value),
        ];
    }

    installExtendedUndergroundBeltTiers() {
        const meta = shapez.MetaUndergroundBeltBuilding;
        const config = shapez.globalConfig;
        if (!meta || !meta.prototype || !config) return;

        // UndergroundBeltComponent.tier is an integer and the vanilla systems
        // already use it to decide both pairing and range. Keep the original
        // 5 / 9 progression, then continue it by four tiles for two new tiers.
        const ranges = config.undergroundBeltMaxTilesByTier;
        if (Array.isArray(ranges)) {
            for (let index = 0; index < UNDERGROUND_BELT_BASE_RANGES.length; ++index) {
                if (!Number.isFinite(Number(ranges[index]))) {
                    ranges[index] = UNDERGROUND_BELT_BASE_RANGES[index];
                }
            }
        }

        const marker = "__beltSpeedControlUndergroundTiers_150";
        if (meta.prototype[marker]) return;

        const tier2Variant = (shapez.enumUndergroundBeltVariants
            && shapez.enumUndergroundBeltVariants.tier2) || "tier2";
        const customTiers = {
            tier3: 2,
            tier4: 3,
        };
        const isCustomTier = variant => Object.prototype.hasOwnProperty.call(customTiers, variant);
        const hasTier2Reward = root => {
            const rewards = shapez.enumHubGoalRewards;
            const reward = rewards && rewards.reward_underground_belt_tier_2;
            return !reward || (root && root.hubGoals
                && typeof root.hubGoals.isRewardUnlocked === "function"
                && root.hubGoals.isRewardUnlocked(reward));
        };

        // This registers the two variants with the game code cache so they
        // participate in normal T-key cycling and are valid savegame codes.
        // Sprites are deliberately supplied below by mapping them to tier2.
        if (typeof this.modInterface.addVariantToExistingBuilding === "function") {
            for (const [variant, tier] of Object.entries(customTiers)) {
                this.modInterface.addVariantToExistingBuilding(meta, variant, {
                    rotationVariants: [0, 1],
                    name: "Underground Belt Tier " + (tier + 1),
                    description: "Extended underground belt tier with a longer reach.",
                    isUnlocked: hasTier2Reward,
                });
                this.modInterface.registerBuildingTranslation(meta, variant, {
                    language: "zh-CN",
                    name: "地下传送带 · " + (tier + 1) + " 级",
                    description: "扩展地下传送带等级，拥有更远的连接距离。",
                });
            }
        } else {
            return;
        }

        const mod = this;
        this.modInterface.extendClass(meta, ({ $old }) => ({
            // tier3 and tier4 reuse the native tier2 artwork for both the
            // placement selector and the building/blueprint render caches.
            getPreviewSprite(rotationVariant, variant) {
                return $old.getPreviewSprite.call(
                    this,
                    rotationVariant,
                    isCustomTier(variant) ? tier2Variant : variant
                );
            },
            getBlueprintSprite(rotationVariant, variant) {
                return $old.getBlueprintSprite.call(
                    this,
                    rotationVariant,
                    isCustomTier(variant) ? tier2Variant : variant
                );
            },
            updateVariants(entity, rotationVariant, variant) {
                if (!isCustomTier(variant)) {
                    return $old.updateVariants.call(this, entity, rotationVariant, variant);
                }

                // Let vanilla configure sender/receiver slots and mode, then
                // promote the component to the actual extended tier.
                const result = $old.updateVariants.call(this, entity, rotationVariant, tier2Variant);
                entity.components.UndergroundBelt.tier = customTiers[variant];
                return result;
            },
            computeOptimalDirectionAndRotationVariantAtTile(options) {
                if (!options || !isCustomTier(options.variant)) {
                    return $old.computeOptimalDirectionAndRotationVariantAtTile.call(this, options);
                }
                return mod.computeExtendedUndergroundBeltDirection(options, customTiers[options.variant]);
            },
            getAdditionalStatistics(root, variant) {
                if (!isCustomTier(variant)) {
                    return $old.getAdditionalStatistics.call(this, root, variant);
                }

                // Reuse the vanilla speed statistic and replace only the
                // range row, which is indexed through vanilla's two-tier map.
                const statistics = $old.getAdditionalStatistics.call(this, root, tier2Variant);
                const range = shapez.globalConfig.undergroundBeltMaxTilesByTier[customTiers[variant]];
                if (Array.isArray(statistics) && statistics[0]) {
                    const infoTexts = shapez.T && shapez.T.ingame
                        && shapez.T.ingame.buildingPlacement
                        && shapez.T.ingame.buildingPlacement.infoTexts;
                    statistics[0][1] = infoTexts && typeof infoTexts.tiles === "string"
                        ? infoTexts.tiles.replace("<x>", String(range))
                        : String(range) + " tiles";
                }
                return statistics;
            },
        }));

        meta.prototype[marker] = true;
    }

    computeExtendedUndergroundBeltDirection(options, tier) {
        const direction = shapez.enumAngleToDirection[options.rotation];
        const vector = shapez.enumDirectionToVector[direction];
        const oppositeRotation = (options.rotation + 180) % 360;
        const range = shapez.globalConfig.undergroundBeltMaxTilesByTier[tier] || 1;
        const modes = shapez.enumUndergroundBeltMode;
        let checkedTile = options.tile;

        for (let distance = 1; distance <= range; ++distance) {
            checkedTile = checkedTile.addScalars(vector.x, vector.y);
            const entity = options.root.map.getTileContent(checkedTile, "regular");
            if (!entity) continue;

            const tunnel = entity.components && entity.components.UndergroundBelt;
            const staticEntity = entity.components && entity.components.StaticMapEntity;
            if (!tunnel || !staticEntity || tunnel.tier !== tier) continue;

            if (staticEntity.rotation === oppositeRotation) {
                if (tunnel.mode !== modes.sender) break;
                return {
                    rotation: oppositeRotation,
                    rotationVariant: 1,
                    connectedEntities: [entity],
                };
            }
            if (staticEntity.rotation === options.rotation) {
                if (tunnel.mode === modes.receiver) {
                    return {
                        rotation: options.rotation,
                        rotationVariant: 0,
                        connectedEntities: [entity],
                    };
                }
                break;
            }
        }

        return { rotation: options.rotation, rotationVariant: 0 };
    }

    applyTunnelRangeMultipliers(multipliers) {
        const config = shapez.globalConfig;
        const ranges = config && config.undergroundBeltMaxTilesByTier;
        if (!config || !Array.isArray(ranges)) return;

        const baseKey = "__beltSpeedControlVanillaTunnelRanges";
        if (!Array.isArray(config[baseKey])) {
            config[baseKey] = ranges.slice();
        }

        const baseRanges = config[baseKey];
        // A development hot-reload can retain the old two-value baseline
        // while the live range array has already gained tiers 3 and 4.
        // Complete that cached baseline before applying the four multipliers.
        for (let index = 0; index < UNDERGROUND_BELT_BASE_RANGES.length; ++index) {
            if (!Number.isFinite(Number(baseRanges[index]))) {
                baseRanges[index] = Number.isFinite(Number(ranges[index]))
                    ? Number(ranges[index])
                    : UNDERGROUND_BELT_BASE_RANGES[index];
            }
        }
        let changed = false;
        for (let index = 0; index < baseRanges.length; ++index) {
            const multiplier = this.normalizeTunnelRangeMultiplier(
                multipliers && multipliers[index]
            );
            const nextRange = Math.max(1, Math.round(baseRanges[index] * multiplier));
            if (ranges[index] !== nextRange) {
                ranges[index] = nextRange;
                changed = true;
            }
        }
        if (changed) this.tunnelRangeRevision++;
    }

    installTunnelRangeCacheRefreshPatch() {
        const undergroundBeltSystem = shapez.UndergroundBeltSystem;
        if (
            !undergroundBeltSystem ||
            !undergroundBeltSystem.prototype ||
            typeof undergroundBeltSystem.prototype.update !== "function"
        ) {
            return;
        }

        const marker = "__beltSpeedControlTunnelRangeCache_140";
        if (undergroundBeltSystem.prototype[marker]) return;

        const mod = this;
        this.modInterface.runBeforeMethod(undergroundBeltSystem, "update", function () {
            if (this.__beltSpeedControlTunnelRangeRevision === mod.tunnelRangeRevision) return;
            if (Array.isArray(this.allEntities)) {
                for (const entity of this.allEntities) {
                    const tunnel = entity && entity.components && entity.components.UndergroundBelt;
                    if (tunnel) tunnel.cachedLinkedEntity = null;
                }
            }
            this.__beltSpeedControlTunnelRangeRevision = mod.tunnelRangeRevision;
        });

        undergroundBeltSystem.prototype[marker] = true;
    }

    installSpeedPatches() {
        const hubGoals = shapez.HubGoals;
        if (!hubGoals || !hubGoals.prototype) return;

        const mod = this;
        const marker = "__beltSpeedControl_110";
        if (hubGoals.prototype[marker]) return;

        this.modInterface.replaceMethod(hubGoals, "getBeltBaseSpeed", oldMethod => {
            return oldMethod() * mod.getMultiplier();
        });

        this.modInterface.replaceMethod(hubGoals, "getUndergroundBeltBaseSpeed", oldMethod => {
            return oldMethod() * mod.getMultiplier();
        });

        // The vanilla balancer's processor speed is derived independently
        // from getBeltBaseSpeed (4 * belt upgrade improvement), which is why
        // wrapping belts alone leaves the original 2-way balancer slow.
        this.modInterface.replaceMethod(hubGoals, "getProcessorBaseSpeed", (oldMethod, args) => {
            const processorType = args && args.length ? args[0] : undefined;
            const baseSpeed = oldMethod(processorType);
            if (
                processorType === shapez.enumItemProcessorTypes.balancer
                || processorType === "balancer"
            ) {
                return baseSpeed * mod.getMultiplier();
            }
            return baseSpeed;
        });

        hubGoals.prototype[marker] = true;
    }

    installStaticBeltAnimationPatches() {
        const mod = this;
        this.installStaticAnimationPatch(shapez.BeltSystem, "__beltSpeedControlStaticBelt_141", mod);
        this.installStaticAnimationPatch(
            shapez.BeltUnderlaysSystem,
            "__beltSpeedControlStaticUnderlay_141",
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

    installBeltReaderReplacement() {
        const itemProcessorSystem = shapez.ItemProcessorSystem;
        if (
            !itemProcessorSystem ||
            !itemProcessorSystem.prototype ||
            typeof itemProcessorSystem.prototype.update !== "function" ||
            typeof itemProcessorSystem.prototype.startNewCharge !== "function"
        ) {
            return;
        }

        const stockReaderType = shapez.enumItemProcessorTypes
            ? shapez.enumItemProcessorTypes.reader
            : "reader";
        const normalizeReader = entity => {
            const components = entity && entity.components;
            const processor = components && components.ItemProcessor;
            if (!components || !components.BeltReader || !processor) return false;
            if (processor.type === stockReaderType || processor.type === "reader") return true;

            // Restore the vanilla type so ItemProcessorOverlaysSystem keeps
            // drawing the familiar reader overlay and its numeric value.
            processor.type = stockReaderType || "reader";
            if (Array.isArray(processor.ongoingCharges)) processor.ongoingCharges.length = 0;
            processor.bonusTime = 0;
            return true;
        };

        const updateMarker = "__beltSpeedControlReaderUpdate_140";
        if (!itemProcessorSystem.prototype[updateMarker]) {
            // Readers created by the earlier custom implementation are
            // restored before the first processor tick of an existing save.
            this.modInterface.runBeforeMethod(itemProcessorSystem, "update", function () {
                if (!Array.isArray(this.allEntities)) return;
                for (const entity of this.allEntities) normalizeReader(entity);
            });
            itemProcessorSystem.prototype[updateMarker] = true;
        }

        const chargeMarker = "__beltSpeedControlReaderCharge_141";
        if (!itemProcessorSystem.prototype[chargeMarker]) {
            this.modInterface.replaceMethod(
                itemProcessorSystem,
                "startNewCharge",
                function (oldStartNewCharge, args) {
                    const entity = args && args.length ? args[0] : null;
                    const components = entity && entity.components;
                    const reader = components && components.BeltReader;
                    const processor = components && components.ItemProcessor;
                    const inputSlots = processor && processor.inputSlots;
                    const queuedEjects = processor && processor.queuedEjects;
                    const item = inputSlots && typeof inputSlots.get === "function"
                        ? inputSlots.get(0)
                        : null;

                    if (!reader || !processor || !item || !Array.isArray(queuedEjects)
                        || !this.root || !this.root.time || typeof this.root.time.now !== "function") {
                        return oldStartNewCharge(entity);
                    }

                    // Reimplement the reader as an immediate pass-through.
                    // There is no 2 items/s processing charge anymore: the
                    // only remaining limits are the input/output belts and
                    // the engine's regular logic-tick throughput.
                    reader.lastItemTimes.push(this.root.time.now());
                    reader.lastItem = item;
                    queuedEjects.push({ item, doNotTrack: true });
                    inputSlots.clear();
                    processor.inputCount = 0;
                    processor.bonusTime = 0;
                }
            );
            itemProcessorSystem.prototype[chargeMarker] = true;
        }
    }

    installBeltReaderPatch() {
        const beltReaderSystem = shapez.BeltReaderSystem;
        if (
            !beltReaderSystem ||
            !beltReaderSystem.prototype ||
            typeof beltReaderSystem.prototype.update !== "function"
        ) {
            // BeltReaderSystem is not exported by a few older game builds.
            // The speed patches above still work on those builds.
            return;
        }

        const marker = "__beltSpeedControlReader_121";
        if (beltReaderSystem.prototype[marker]) return;

        const mod = this;
        this.modInterface.replaceMethod(beltReaderSystem, "update", function (oldUpdate) {
            oldUpdate();

            // Vanilla shapez clamps the reader overlay to 47.8 items/s. The
            // timestamps are already recorded at the real belt speed, so
            // recalculate the same moving average without that presentation
            // cap while this mod is enabled above 1x.
            if (mod.getMultiplier() <= 1 || !Array.isArray(this.allEntities)) return;

            for (const entity of this.allEntities) {
                const component = entity && entity.components && entity.components.BeltReader;
                const timestamps = component && component.lastItemTimes;
                if (!component || !Array.isArray(timestamps) || timestamps.length < 2) continue;

                // Vanilla recomputes once every 0.5 seconds. Avoid walking all
                // timestamps every frame, which matters when many readers are
                // present in a high-speed factory.
                if (component.__beltSpeedControlLastComputation === component.lastThroughputComputation) {
                    continue;
                }
                component.__beltSpeedControlLastComputation = component.lastThroughputComputation;

                let totalInterval = 0;
                let intervalCount = 0;
                for (let index = 0; index < timestamps.length - 1; ++index) {
                    const interval = Number(timestamps[index + 1]) - Number(timestamps[index]);
                    if (Number.isFinite(interval) && interval > 0) {
                        totalInterval += interval;
                        intervalCount++;
                    }
                }

                if (intervalCount > 0 && totalInterval > 0) {
                    // This is equivalent to vanilla's 1 / average interval,
                    // but deliberately has no 47.8 items/s upper bound.
                    component.lastThroughput = intervalCount / totalInterval;
                }
            }
        });

        beltReaderSystem.prototype[marker] = true;
    }
}
