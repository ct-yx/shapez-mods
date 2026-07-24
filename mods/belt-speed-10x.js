// @ts-nocheck
const METADATA = {
    website: "https://github.com/ct-yx/shapez-mods",
    author: "ct-yx & Codex",
    name: "Belt Speed Control",
    version: "1.1.0",
    id: "belt-speed-x10",
    description: "Adjusts every belt tier, underground belt tier and the vanilla 2-way balancer speed.",
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
            ],
        });

        this.settings.enabled = this.settingsPanel.get("enabled") !== false;
        this.settings.multiplier = this.normalizeMultiplier(
            this.settingsPanel.get("multiplier")
        );
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
}
