// @ts-nocheck
const METADATA = {
    website: "https://github.com/ct-yx/shapez-mods",
    author: "ct-yx & Codex",
    name: "Key Reform",
    version: "1.1.4",
    id: "key-reform-ctyx",
    description: "Adds configurable T+number and T/R mouse-wheel shortcuts for every building variant.",
    minimumGameVersion: ">=1.5.0",
    doesNotAffectSavegame: true,
    settings: {
        enabled: true,
        tDigit0: "__auto__",
        tDigit1: "__auto__",
        tDigit2: "__auto__",
        tDigit3: "__auto__",
        tDigit4: "balancer::balancer_4way",
        tDigit5: "balancer::balancer_5way",
        tDigit6: "balancer::balancer_16way",
        tDigit7: "__auto__",
        tDigit8: "balancer::balancer_8way",
        tDigit9: "__auto__",
    },
};

const KEY_T = "T".charCodeAt(0);
const KEY_R = "R".charCodeAt(0);
const FIRST_DIGIT = "0".charCodeAt(0);
// Trackpads and high-resolution wheels emit one user gesture as a stream of
// events. Only the leading event should change a variant/rotation; further
// events remain part of the same gesture until scrolling has gone quiet.
const WHEEL_GESTURE_IDLE_MS = 260;
const AUTO_VARIANT = "__auto__";
const TARGET_SEPARATOR = "::";
const DIGITS = Array.from({ length: 10 }, (_, digit) => digit);
const DEFAULT_DIGIT_TARGETS = {
    4: "balancer::balancer_4way",
    5: "balancer::balancer_5way",
    6: "balancer::balancer_16way",
    8: "balancer::balancer_8way",
    0: "balancer::balancer_10way",
};

class Mod extends shapez.Mod {
    init() {
        this.settings.enabled = this.settings.enabled !== false;
        this.settingsApi = null;
        this.settingsPanel = null;
        this.pendingSettingsRegistration = false;
        this.variantOptions = [];
        this.detectedVariantOptions = new Map();

        this.detectVariantOptions();
        this.registerSettingsWhenAvailable();
        this.signals.gameStarted.add(root => {
            this.detectVariantOptions(root);
            this.registerSettingsWhenAvailable();
            this.installForGame(root);
        }, this);
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
        this.settingsApi = api;
        const fields = [
            {
                id: "enabled",
                type: "boolean",
                label: { en: "Enable Key Reform", zh: "启用按键改革" },
                description: {
                    en: "Use T/R with number keys or the mouse wheel while placing a building.",
                    zh: "建造模式下使用 T/R 加数字键或鼠标滚轮。",
                },
                default: true,
                onChange: value => {
                    this.settings.enabled = Boolean(value);
                    this.saveSettings();
                },
            },
        ];

        for (const digit of DIGITS) {
            const target = this.getConfiguredTarget(digit);
            fields.push({
                id: "tDigit" + digit,
                type: "select",
                label: { en: "T+" + digit + " variant", zh: "T+" + digit + " 变形体" },
                description: {
                    en: "Detected options are refreshed when the game starts. Auto keeps the contextual fallback.",
                    zh: "游戏启动时会重新检测可用变形体；自动保留按当前建筑上下文选择的逻辑。",
                },
                options: this.getSelectOptions(digit),
                default: target,
                onChange: value => {
                    this.settings["tDigit" + digit] = value;
                    this.saveSettings();
                },
            });
        }

        this.settingsPanel = api.register({
            id: METADATA.id,
            title: { en: "Key Reform", zh: "按键改革" },
            description: {
                en: "Configure T+number assignments. T/R + mouse wheel cycles every detected variant of the selected building.",
                zh: "配置 T+数字键。T/R 加鼠标滚轮可切换当前建筑检测到的全部变形体。",
            },
            fields,
        });

        this.settings.enabled = this.settingsPanel.get("enabled") !== false;
        for (const digit of DIGITS) {
            const value = this.settingsPanel.get("tDigit" + digit);
            if (value !== undefined) this.settings["tDigit" + digit] = value;
        }
    }

    getConfiguredTarget(digit) {
        const key = "tDigit" + digit;
        const value = this.settings[key];
        if (typeof value === "string" && value.length > 0) return value;
        return DEFAULT_DIGIT_TARGETS[digit] || AUTO_VARIANT;
    }

    getMetaEntries() {
        const registry = typeof shapez !== "undefined" ? shapez.gMetaBuildingRegistry : null;
        if (!registry) return [];
        if (typeof registry.getEntries === "function") return registry.getEntries();
        if (Array.isArray(registry.entries)) return registry.entries;
        return [];
    }

    detectVariantOptions() {
        const options = [{
            value: AUTO_VARIANT,
            label: { en: "Auto / contextual fallback", zh: "自动 / 按当前建筑选择" },
        }];
        const dedupe = new Set([AUTO_VARIANT]);
        this.detectedVariantOptions.clear();
        const entries = this.getMetaEntries();

        for (const meta of entries) {
            if (!meta || typeof meta.getId !== "function") continue;
            const metaId = String(meta.getId());
            const constructor = meta.constructor;
            let combinations = [];
            try {
                if (constructor && typeof constructor.getAllVariantCombinations === "function") {
                    combinations = constructor.getAllVariantCombinations() || [];
                }
            } catch (error) {
                console.warn("Key Reform: failed to inspect variants for", metaId, error);
            }

            for (const combination of combinations) {
                const variant = combination && combination.variant;
                if (variant === undefined || variant === null) continue;
                const variantText = String(variant);
                const value = metaId + TARGET_SEPARATOR + variantText;
                if (dedupe.has(value)) continue;
                dedupe.add(value);
                const label = this.getVariantLabel(meta, metaId, variantText);
                options.push({ value, label });
                this.detectedVariantOptions.set(value, { metaId, variant: variantText });
            }
        }

        // Keep the useful balancer assignments visible even if the balancer
        // extension is loaded after this mod's first initialization pass.
        for (const digit of DIGITS) {
            const target = DEFAULT_DIGIT_TARGETS[digit];
            if (target && !dedupe.has(target)) {
                dedupe.add(target);
                const split = target.split(TARGET_SEPARATOR);
                options.push({
                    value: target,
                    label: { en: split[0] + " / " + split[1], zh: split[0] + " / " + split[1] },
                });
            }
        }

        this.variantOptions = options;
        this.refreshDetectedBindingDefaults();
    }

    getVariantLabel(meta, metaId, variant) {
        if (variant === "default" || variant === "defaultBuildingVariant") {
            return {
                en: metaId + " / Original",
                zh: metaId + " / 原版",
            };
        }
        try {
            const translations = shapez.T && shapez.T.buildings && shapez.T.buildings[metaId];
            if (translations && translations[variant] && translations[variant].name) {
                return { en: metaId + " / " + translations[variant].name, zh: metaId + " / " + translations[variant].name };
            }
        } catch (error) { }
        return { en: metaId + " / " + variant, zh: metaId + " / " + variant };
    }

    getSelectOptions(digit) {
        const configured = this.getConfiguredTarget(digit);
        const options = this.variantOptions.length
            ? this.variantOptions.slice()
            : [{ value: AUTO_VARIANT, label: { en: "Auto / contextual fallback", zh: "自动 / 按当前建筑选择" } }];
        if (configured !== AUTO_VARIANT && !options.some(option => option.value === configured)) {
            const split = configured.split(TARGET_SEPARATOR);
            options.push({
                value: configured,
                label: { en: split.join(" / "), zh: split.join(" / ") },
            });
        }
        return options;
    }

    refreshDetectedBindingDefaults() {
        if (!this.settingsApi || typeof this.settingsApi.register !== "function") return;
        // Re-registering replaces only the definition; the shared settings
        // registry keeps existing values. This lets late-loaded variant mods
        // appear in the same modconfig card without a second UI panel.
        this.registerStructuredSettings(this.settingsApi);
    }

    isEnabled() {
        if (this.settingsPanel) return this.settingsPanel.get("enabled") !== false;
        return this.settings.enabled !== false;
    }

    installForGame(root) {
        if (!root || root.__keyReformInstalled_113) return;
        root.__keyReformInstalled_113 = true;
        this.root = root;
        root.__keyReformKeyState_113 = {
            t: false,
            r: false,
            lastWheelEventAt: -Infinity,
            lastWheelDirection: 0,
        };

        const inputReceiver = root.gameState && root.gameState.inputReciever;
        if (inputReceiver && inputReceiver.keydown) {
            inputReceiver.keydown.addToTop(event => {
                this.updateHeldKey(root, event, true);
                return this.onKeyDown(root, event);
            });
        }
        if (inputReceiver && inputReceiver.keyup) {
            inputReceiver.keyup.addToTop(event => {
                this.updateHeldKey(root, event, false);
            });
        }

        const wheelHandler = event => this.onWheel(root, event);
        const keydownHandler = event => this.updateHeldKey(root, event, true);
        const keyupHandler = event => this.updateHeldKey(root, event, false);
        const blurHandler = () => this.clearHeldKeys(root);

        // Camera zoom is handled by a canvas/game input listener. Register on
        // every available event target in capture phase. This covers both the
        // normal canvas event path and browser/game versions which attach the
        // zoom handler to document or window.
        const targets = [];
        if (typeof window !== "undefined" && window.addEventListener) {
            targets.push(window);
        }
        if (typeof document !== "undefined" && document.addEventListener) {
            targets.push(document);
        }
        if (root.canvas && root.canvas.addEventListener) {
            targets.push(root.canvas);
        }
        const uniqueTargets = Array.from(new Set(targets));
        const listenerOptions = { capture: true, passive: false };
        for (const target of uniqueTargets) {
            target.addEventListener("keydown", keydownHandler, listenerOptions);
            target.addEventListener("keyup", keyupHandler, listenerOptions);
            target.addEventListener("wheel", wheelHandler, listenerOptions);
            // Older Chromium/Electron builds may still dispatch this alias.
            target.addEventListener("mousewheel", wheelHandler, listenerOptions);
        }
        if (typeof window !== "undefined" && window.addEventListener) {
            window.addEventListener("blur", blurHandler, { capture: true });
        }
        root.__keyReformWheelHandler_113 = wheelHandler;
        root.__keyReformListenerTargets_113 = uniqueTargets;
        root.__keyReformKeyHandlers_113 = { keydownHandler, keyupHandler, blurHandler };

        if (root.signals && root.signals.aboutToDestruct) {
            root.signals.aboutToDestruct.add(() => {
                for (const target of uniqueTargets) {
                    target.removeEventListener("keydown", keydownHandler, listenerOptions);
                    target.removeEventListener("keyup", keyupHandler, listenerOptions);
                    target.removeEventListener("wheel", wheelHandler, listenerOptions);
                    target.removeEventListener("mousewheel", wheelHandler, listenerOptions);
                }
                if (typeof window !== "undefined" && window.removeEventListener) {
                    window.removeEventListener("blur", blurHandler, { capture: true });
                }
                this.clearHeldKeys(root);
            }, this);
        }
    }

    getKeyCode(event) {
        if (!event) return 0;
        const numericCode = Number(event.keyCode !== undefined ? event.keyCode : event.which);
        if (Number.isFinite(numericCode) && numericCode > 0) return numericCode;
        const key = String(event.key || "").toLowerCase();
        if (key === "t") return KEY_T;
        if (key === "r") return KEY_R;
        if (key >= "0" && key <= "9") return FIRST_DIGIT + Number(key);
        return 0;
    }

    updateHeldKey(root, event, isDown) {
        const keyCode = this.getKeyCode(event);
        const state = root && root.__keyReformKeyState_113;
        if (!state) return;
        if (keyCode === KEY_T) state.t = isDown;
        if (keyCode === KEY_R) state.r = isDown;
        if (!state.t && !state.r) {
            state.lastWheelEventAt = -Infinity;
            state.lastWheelDirection = 0;
        }
    }

    clearHeldKeys(root) {
        const state = root && root.__keyReformKeyState_113;
        if (!state) return;
        state.t = false;
        state.r = false;
        state.lastWheelEventAt = -Infinity;
        state.lastWheelDirection = 0;
    }

    isKeyDown(root, keyCode) {
        const state = root && root.__keyReformKeyState_113;
        if (state && ((keyCode === KEY_T && state.t) || (keyCode === KEY_R && state.r))) {
            return true;
        }
        const inputManager = root && root.app && root.app.inputMgr;
        return Boolean(inputManager && inputManager.keysDown && inputManager.keysDown.has(keyCode));
    }

    getPlacer(root) {
        if (!root || !root.hud || !root.hud.parts) return null;
        if (root.hud.hasBlockingOverlayOpen && root.hud.hasBlockingOverlayOpen()) return null;
        const placer = root.hud.parts.buildingPlacer;
        if (!placer || !placer.currentMetaBuilding || !placer.currentMetaBuilding.get()) return null;
        return placer;
    }

    getAvailableVariants(placer) {
        const meta = placer && placer.currentMetaBuilding && placer.currentMetaBuilding.get();
        if (!meta) return [];
        let variants = [];
        try {
            variants = meta.getAvailableVariants(placer.root) || [];
        } catch (error) { }
        return Array.isArray(variants) ? variants : [];
    }

    onKeyDown(root, event) {
        const keyCode = this.getKeyCode(event);
        if (!this.isEnabled() || !event || keyCode < 48 || keyCode > 57) return;

        const digit = keyCode - FIRST_DIGIT;
        const placer = this.getPlacer(root);
        if (!placer) return;

        if (this.isKeyDown(root, KEY_T)) {
            const variant = this.findVariantForDigit(placer, digit);
            if (variant !== undefined) {
                placer.setVariant(variant);
                return shapez.STOP_PROPAGATION;
            }
        }

        if (this.isKeyDown(root, KEY_R)) {
            const rotations = { 1: 0, 2: 90, 3: 180, 4: 270 };
            if (Object.prototype.hasOwnProperty.call(rotations, digit)) {
                this.setRotation(placer, rotations[digit]);
                return shapez.STOP_PROPAGATION;
            }
        }
    }

    findVariantForDigit(placer, digit) {
        const meta = placer.currentMetaBuilding.get();
        const variants = this.getAvailableVariants(placer);
        const configured = this.getConfiguredTarget(digit);
        if (configured !== AUTO_VARIANT) {
            const split = configured.split(TARGET_SEPARATOR);
            if (split.length === 2 && split[0] === String(meta.getId())) {
                const exactConfigured = variants.find(variant => String(variant) === split[1]);
                if (exactConfigured !== undefined) return exactConfigured;
            }
        }

        // Preserve the original convenience mapping when the setting is Auto.
        const target = digit === 0 ? "10" : digit === 6 ? "16" : String(digit);
        const exact = variants.find(variant => {
            const text = String(variant).toLowerCase();
            return text === target || text.indexOf(target + "way") >= 0;
        });
        if (exact !== undefined) return exact;

        // For buildings with non-numeric variants, use a one-based fallback.
        const index = digit === 0 ? 9 : digit - 1;
        return index >= 0 && index < variants.length ? variants[index] : undefined;
    }

    setRotation(placer, rotation) {
        placer.currentBaseRotation = rotation;
        if (placer.fakeEntity && placer.fakeEntity.components.StaticMapEntity) {
            placer.fakeEntity.components.StaticMapEntity.rotation = rotation;
        }
    }

    onWheel(root, event) {
        if (!this.isEnabled() || !event) return;
        const holdingT = this.isKeyDown(root, KEY_T);
        const holdingR = this.isKeyDown(root, KEY_R);
        if (!holdingT && !holdingR) return;

        // Cancel every wheel event before checking the placer or throttle.
        // Otherwise a wheel burst can still reach the camera zoom handler
        // while T/R is held, especially when the game receives tiny deltas.
        if (typeof event.preventDefault === "function") event.preventDefault();
        if (typeof event.stopImmediatePropagation === "function") {
            event.stopImmediatePropagation();
        } else if (typeof event.stopPropagation === "function") {
            event.stopPropagation();
        }
        try {
            event.returnValue = false;
            event.cancelBubble = true;
        } catch (error) { }

        const wheelDelta = this.getWheelDelta(event);
        if (!wheelDelta) return;
        const state = root.__keyReformKeyState_113;
        const now = this.getNow();
        const direction = wheelDelta < 0 ? 1 : -1;
        if (state) {
            const isSameGesture = state.lastWheelDirection === direction
                && now - state.lastWheelEventAt < WHEEL_GESTURE_IDLE_MS;
            // Always refresh this timestamp, including ignored events. This
            // prevents a long inertial/trackpad stream from becoming a second
            // step merely because it outlasted a fixed success-only throttle.
            state.lastWheelEventAt = now;
            state.lastWheelDirection = direction;
            if (isSameGesture) return;
        }
        const placer = this.getPlacer(root);
        if (!placer) return;
        const variants = this.getAvailableVariants(placer);
        if (holdingT) {
            // This is intentionally generic: every building's own available
            // variant list is used, including variants added by other mods.
            if (variants.length > 0) {
                const current = variants.indexOf(placer.currentVariant.get());
                const index = (current < 0 ? 0 : current + direction + variants.length) % variants.length;
                placer.setVariant(variants[index]);
            }
        } else if (holdingR) {
            this.setRotation(placer, (placer.currentBaseRotation + direction * 90 + 360) % 360);
        }
    }

    getWheelDelta(event) {
        if (!event) return 0;
        if (Number.isFinite(Number(event.deltaY)) && Number(event.deltaY) !== 0) {
            return Number(event.deltaY);
        }
        if (Number.isFinite(Number(event.wheelDelta)) && Number(event.wheelDelta) !== 0) {
            return -Number(event.wheelDelta);
        }
        if (Number.isFinite(Number(event.detail)) && Number(event.detail) !== 0) {
            return Number(event.detail);
        }
        return 0;
    }

    getNow() {
        try {
            if (typeof performance !== "undefined" && typeof performance.now === "function") {
                return performance.now();
            }
        } catch (error) { }
        return Date.now();
    }
}
