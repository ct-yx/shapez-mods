// @ts-nocheck
const METADATA = {
    website: "https://github.com/ct-yx/shapez-mods",
    author: "ct-yx & Codex",
    name: "Underground Belt Expansion",
    version: "1.0.0",
    id: "underground-belt-expansion",
    description: "Adds extended underground belt tiers and independently configurable ranges.",
    minimumGameVersion: ">=1.5.0",
    doesNotAffectSavegame: true,
    settings: {
        tunnelRangeMultiplierTier1: 1,
        tunnelRangeMultiplierTier2: 1,
        tunnelRangeMultiplierTier3: 1,
        tunnelRangeMultiplierTier4: 1,
    },
};

const DEFAULT_TUNNEL_RANGE_MULTIPLIER = 1;
const MIN_TUNNEL_RANGE_MULTIPLIER = 1;
const MAX_TUNNEL_RANGE_MULTIPLIER = 10;
const UNDERGROUND_BELT_BASE_RANGES = [5, 9, 13, 17];

class Mod extends shapez.Mod {
    init() {
        this.settings.tunnelRangeMultiplierTier1 = this.normalizeTunnelRangeMultiplier(this.settings.tunnelRangeMultiplierTier1);
        this.settings.tunnelRangeMultiplierTier2 = this.normalizeTunnelRangeMultiplier(this.settings.tunnelRangeMultiplierTier2);
        this.settings.tunnelRangeMultiplierTier3 = this.normalizeTunnelRangeMultiplier(this.settings.tunnelRangeMultiplierTier3);
        this.settings.tunnelRangeMultiplierTier4 = this.normalizeTunnelRangeMultiplier(this.settings.tunnelRangeMultiplierTier4);
        this.settingsPanel = null;
        this.tunnelRangeRevision = 0;
        this.installExtendedUndergroundBeltTiers();
        this.registerSettingsWhenAvailable();
        this.installTunnelRangeCacheRefreshPatch();
        this.applyTunnelRangeMultipliers(this.getTunnelRangeMultipliers());
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
        this.migrateLegacyRangeSettings(api);
        this.settingsPanel = api.register({
            id: METADATA.id,
            title: { en: "Underground Belt Expansion", zh: "地下传送带扩展" },
            description: {
                en: "Adds tier 3 and tier 4 underground belts and configures each tier's range.",
                zh: "增加三级、四级地下传送带，并分别配置四个等级的连接距离。",
            },
            fields: [
                {
                    id: "tunnelRangeMultiplierTier1",
                    type: "number",
                    label: { en: "Underground belt range · Tier 1", zh: "一级地下传送带范围" },
                    description: {
                        en: "Range multiplier: 1x–10x. Base range is 5 tiles; 10x reaches 50 tiles.",
                        zh: "范围倍率：1x–10x。基础最远 5 格；10x 时最远 50 格。",
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
                        en: "Range multiplier: 1x–10x. Base range is 9 tiles; 10x reaches 90 tiles.",
                        zh: "范围倍率：1x–10x。基础最远 9 格；10x 时最远 90 格。",
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
        for (let tier = 1; tier <= 4; ++tier) {
            this.settings["tunnelRangeMultiplierTier" + tier] = this.normalizeTunnelRangeMultiplier(
                this.settingsPanel.get("tunnelRangeMultiplierTier" + tier)
            );
        }
        this.applyTunnelRangeMultipliers(this.getTunnelRangeMultipliers());
    }

    migrateLegacyRangeSettings(api) {
        if (this.legacyRangeSettingsMigrated || !api
            || typeof api.copyStoredValues !== "function") {
            return;
        }
        api.copyStoredValues("belt-speed-x10", METADATA.id, [
            "tunnelRangeMultiplierTier1",
            "tunnelRangeMultiplierTier2",
            "tunnelRangeMultiplierTier3",
            "tunnelRangeMultiplierTier4",
        ]);
        this.legacyRangeSettingsMigrated = true;
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

        const marker = "__undergroundBeltExpansionTiers_100";
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

        const baseKey = "__undergroundBeltExpansionVanillaTunnelRanges";
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

        const marker = "__undergroundBeltExpansionRangeCache_100";
        if (undergroundBeltSystem.prototype[marker]) return;

        const mod = this;
        this.modInterface.runBeforeMethod(undergroundBeltSystem, "update", function () {
            if (this.__undergroundBeltExpansionRangeRevision === mod.tunnelRangeRevision) return;
            if (Array.isArray(this.allEntities)) {
                for (const entity of this.allEntities) {
                    const tunnel = entity && entity.components && entity.components.UndergroundBelt;
                    if (tunnel) tunnel.cachedLinkedEntity = null;
                }
            }
            this.__undergroundBeltExpansionRangeRevision = mod.tunnelRangeRevision;
        });

        undergroundBeltSystem.prototype[marker] = true;
    }
}
