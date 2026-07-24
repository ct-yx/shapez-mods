// @ts-nocheck
const METADATA = {
    website: "https://github.com/ct-yx/shapez-mods",
    author: "ct-yx & Codex",
    name: "Belt Speed Control",
    version: "1.4.0",
    id: "belt-speed-x10",
    description: "Adjusts belt speeds, underground belt range, the vanilla 2-way balancer and replaces the built-in belt reader processor.",
    minimumGameVersion: ">=1.5.0",
    doesNotAffectSavegame: true,
    settings: {
        enabled: true,
        multiplier: 10,
        tunnelRangeMultiplierTier1: 1,
        tunnelRangeMultiplierTier2: 1,
    },
};

const DEFAULT_ENABLED = true;
const DEFAULT_MULTIPLIER = 10;
const MIN_MULTIPLIER = 1;
const MAX_MULTIPLIER = 50;
const DEFAULT_TUNNEL_RANGE_MULTIPLIER = 1;
const MIN_TUNNEL_RANGE_MULTIPLIER = 1;
const MAX_TUNNEL_RANGE_MULTIPLIER = 10;

class Mod extends shapez.Mod {
    init() {
        this.settings.enabled = this.settings.enabled !== false;
        this.settings.multiplier = this.normalizeMultiplier(this.settings.multiplier);
        this.settings.tunnelRangeMultiplierTier1 = this.normalizeTunnelRangeMultiplier(
            this.settings.tunnelRangeMultiplierTier1
        );
        this.settings.tunnelRangeMultiplierTier2 = this.normalizeTunnelRangeMultiplier(
            this.settings.tunnelRangeMultiplierTier2
        );
        this.settingsPanel = null;
        this.tunnelRangeRevision = 0;

        this.registerSettingsWhenAvailable();
        this.installSpeedPatches();
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
            ],
        });

        this.settings.enabled = this.settingsPanel.get("enabled") !== false;
        this.settings.multiplier = this.normalizeMultiplier(
            this.settingsPanel.get("multiplier")
        );
        this.settings.tunnelRangeMultiplierTier1 = this.normalizeTunnelRangeMultiplier(
            this.settingsPanel.get("tunnelRangeMultiplierTier1")
        );
        this.settings.tunnelRangeMultiplierTier2 = this.normalizeTunnelRangeMultiplier(
            this.settingsPanel.get("tunnelRangeMultiplierTier2")
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

    getTunnelRangeMultipliers() {
        const tier1Value = this.settingsPanel
            ? this.settingsPanel.get("tunnelRangeMultiplierTier1")
            : this.settings.tunnelRangeMultiplierTier1;
        const tier2Value = this.settingsPanel
            ? this.settingsPanel.get("tunnelRangeMultiplierTier2")
            : this.settings.tunnelRangeMultiplierTier2;
        return [
            this.normalizeTunnelRangeMultiplier(tier1Value),
            this.normalizeTunnelRangeMultiplier(tier2Value),
        ];
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
