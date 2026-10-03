// @ts-nocheck
const METADATA = {
    website: "https://github.com/ct-yx/shapez-mods",
    author: "ct-yx & Codex",
    name: "Belt Speed Control",
    version: "1.5.0",
    id: "belt-speed-x10",
    description: "Adjusts belt speeds, the vanilla 2-way balancer and the built-in belt reader processor.",
    minimumGameVersion: ">=1.5.0",
    doesNotAffectSavegame: true,
    settings: {
        enabled: true,
        multiplier: 10,
    },
};

const DEFAULT_ENABLED = true;
const DEFAULT_MULTIPLIER = 10;
const MIN_MULTIPLIER = 1;
const MAX_MULTIPLIER = 50;

class Mod extends shapez.Mod {
    init() {
        this.settings.enabled = this.settings.enabled !== false;
        this.settings.multiplier = this.normalizeMultiplier(this.settings.multiplier);
        this.settingsPanel = null;

        this.registerSettingsWhenAvailable();
        this.installSpeedPatches();
        this.installBeltReaderReplacement();
        this.installBeltReaderPatch();
    }

    normalizeMultiplier(value) {
        const number = Number(value);
        if (!Number.isFinite(number)) return DEFAULT_MULTIPLIER;
        return Math.max(MIN_MULTIPLIER, Math.min(MAX_MULTIPLIER, Math.round(number)));
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
                        this.settings.enabled = value !== false;
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
            ],
        });

        this.settings.enabled = this.settingsPanel.get("enabled") !== false;
        this.settings.multiplier = this.normalizeMultiplier(
            this.settingsPanel.get("multiplier")
        );
    }

    getEnabled() {
        // init() and registerStructuredSettings() keep settings.enabled in
        // sync with the current value; onChange refreshes it for UI edits.
        return this.settings.enabled !== false;
    }

    getMultiplier() {
        if (!this.getEnabled()) return 1;
        // Use the synchronized setting snapshot instead of calling the
        // Structured Settings API from every belt speed hook.
        // init(), settings registration, and onChange keep this snapshot normalized.
        const multiplier = this.settings.multiplier;
        return multiplier <= 1 ? 1 : multiplier;
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

        const updateMarker = "__beltSpeedControlReaderUpdate_150";
        if (!itemProcessorSystem.prototype[updateMarker]) {
            // Restore legacy readers once per load, then handle newly created
            // entities through the ECS signals instead of rescanning the full
            // processor list on every logic tick.
            this.modInterface.runBeforeMethod(itemProcessorSystem, "update", function () {
                if (this.__beltSpeedControlReaderCompatibilityReady) return;
                this.__beltSpeedControlReaderCompatibilityReady = true;

                const root = this.root;
                const signals = root && root.signals;
                if (signals) {
                    if (signals.entityAdded && typeof signals.entityAdded.add === "function") {
                        signals.entityAdded.add(normalizeReader);
                    }
                    if (signals.entityGotNewComponent
                        && typeof signals.entityGotNewComponent.add === "function") {
                        signals.entityGotNewComponent.add(normalizeReader);
                    }

                    if (signals.postLoadHook && typeof signals.postLoadHook.add === "function") {
                        signals.postLoadHook.add(() => {
                            if (!Array.isArray(this.allEntities)) return;
                            for (const entity of this.allEntities) normalizeReader(entity);
                        });
                    }
                }

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
