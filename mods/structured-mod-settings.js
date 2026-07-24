// @ts-nocheck
const METADATA = {
    website: "https://github.com/ct-yx/shapez-mods",
    author: "ct-yx & Codex",
    name: "Structured Mod Settings UI",
    // Keep the persisted filename stable while the UI implementation evolves.
    version: "1.0.1",
    id: "structured-mod-settings-ui",
    description: "Adds a native Game Mods (MODS) settings category for other mods.",
    minimumGameVersion: ">=1.5.0",
    doesNotAffectSavegame: true,

    // The official loader persists this object through the mod settings API.
    // Registered mod values are grouped below values[modId].
    settings: {
        values: {},
    },
};

const API_NAME = "ShapezStructuredSettings";
const API_VERSION = "1.1.1";
const SETTINGS_CATEGORY_ID = "structured-mod-settings";

class StructuredSettingsRegistry {
    constructor(mod) {
        this.mod = mod;
        this.definitions = new Map();
        this.expandedDefinitions = new Set();
        this.locale = this.detectLocale();
        this.nativeSettingsPatched = false;
        this.domObserver = null;
        this.reloadRequested = false;
    }

    init() {
        if (!this.mod.settings || typeof this.mod.settings !== "object") {
            this.mod.settings = { values: {} };
        }
        if (!this.mod.settings.values || typeof this.mod.settings.values !== "object") {
            this.mod.settings.values = {};
        }

        this.mod.modInterface.registerCss(this.getCss());
        this.exposeApi();
        this.flushPendingRegistrations();
        this.patchNativeSettingsState();

        this.mod.signals.stateEntered.add(() => {
            this.locale = this.detectLocale();
            this.refreshNativeSettings();
        });
    }

    // Mods are loaded from the filesystem and their order is not guaranteed.
    // A small queue lets a dependent mod register its panel even when this
    // library happens to initialize after it.
    flushPendingRegistrations() {
        const pending = globalThis.ShapezStructuredSettingsPending;
        if (!Array.isArray(pending)) return;
        delete globalThis.ShapezStructuredSettingsPending;
        for (const callback of pending.splice(0)) {
            try {
                if (typeof callback === "function") callback(globalThis.ShapezStructuredSettings);
            } catch (error) {
                console.error("Structured Mod Settings pending registration failed", error);
            }
        }
    }

    detectLocale() {
        // App settings are the source of truth once the application has been
        // created. Mod initialization happens before that, so the DOM/browser
        // language is used as a small bootstrap fallback.
        try {
            const appSettings = this.mod.app && this.mod.app.settings;
            if (appSettings) {
                const all = typeof appSettings.getAllSettings === "function"
                    ? appSettings.getAllSettings()
                    : appSettings;
                const language = String(all && all.language || "").toLowerCase();
                if (language.indexOf("zh") === 0) return "zh";
                if (language && language !== "auto-detect") return "en";
            }
        } catch (error) { }

        let candidates = [];
        try {
            candidates.push(document.documentElement && document.documentElement.lang);
            candidates = candidates.concat(navigator.languages || navigator.language || []);
        } catch (error) { }
        for (const candidate of candidates) {
            const value = String(candidate || "").toLowerCase();
            if (value === "zh" || value.indexOf("zh-") === 0 || value.indexOf("zh_") === 0) return "zh";
        }
        return "en";
    }

    text(value) {
        if (value && typeof value === "object") {
            return String(value[this.locale] || value.en || value.zh || Object.values(value)[0] || "");
        }
        return String(value === undefined || value === null ? "" : value);
    }

    clone(value) {
        if (value === undefined || value === null) return value;
        if (typeof value !== "object") return value;
        try {
            return JSON.parse(JSON.stringify(value));
        } catch (error) {
            return value;
        }
    }

    escape(value) {
        return this.text(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    normalizeDefinition(definition) {
        const source = definition || {};
        const id = String(source.id || "").trim();
        if (!id) throw new Error("Structured Mod Settings: a mod id is required");

        const fields = Array.isArray(source.fields)
            ? source.fields
            : (Array.isArray(source.settings) ? source.settings : []);
        const normalizedFields = [];
        for (const sourceField of fields) {
            const field = sourceField || {};
            const fieldId = String(field.id || "").trim();
            if (!fieldId) continue;
            const type = ["boolean", "number", "select", "text", "heading"].indexOf(field.type) >= 0
                ? field.type
                : "text";
            const options = Array.isArray(field.options) ? field.options.map(option => {
                if (option && typeof option === "object" && Object.prototype.hasOwnProperty.call(option, "value")) {
                    return { value: option.value, label: option.label === undefined ? option.value : option.label };
                }
                return { value: option, label: option };
            }) : [];
            let defaultValue = field.default;
            if (defaultValue === undefined) {
                if (type === "boolean") defaultValue = false;
                else if (type === "number") defaultValue = Number.isFinite(field.min) ? field.min : 0;
                else if (type === "select" && options.length) defaultValue = options[0].value;
                else defaultValue = "";
            }
            normalizedFields.push({
                id: fieldId,
                type,
                label: field.label === undefined ? fieldId : field.label,
                description: field.description || "",
                default: this.clone(defaultValue),
                min: Number.isFinite(Number(field.min)) ? Number(field.min) : 0,
                max: Number.isFinite(Number(field.max)) ? Number(field.max) : 100,
                step: Number.isFinite(Number(field.step)) && Number(field.step) > 0 ? Number(field.step) : 1,
                options,
                placeholder: field.placeholder || "",
                suffix: field.suffix || "",
                onChange: typeof field.onChange === "function" ? field.onChange : null,
            });
        }

        return {
            id,
            title: source.title || id,
            description: source.description || "",
            fields: normalizedFields,
        };
    }

    register(definition) {
        const normalized = this.normalizeDefinition(definition);
        const previous = this.definitions.get(normalized.id);
        this.definitions.set(normalized.id, normalized);
        const values = this.getValuesBucket(normalized.id);
        for (const field of normalized.fields) {
            if (!Object.prototype.hasOwnProperty.call(values, field.id)) {
                values[field.id] = this.clone(field.default);
            }
            this.normalizeStoredValue(normalized, field);
        }
        if (!previous) this.mod.saveSettings();
        this.refreshNativeSettings();

        return {
            id: normalized.id,
            get: fieldId => this.get(normalized.id, fieldId),
            set: (fieldId, value) => this.set(normalized.id, fieldId, value),
            getAll: () => this.getAll(normalized.id),
            // Kept as a compatibility alias. The UI now lives in the native
            // SettingsState, so open navigates to its MODS category.
            open: () => this.openNativeSettings(),
            reset: () => this.reset(normalized.id),
            unregister: () => this.unregister(normalized.id),
        };
    }

    unregister(modId) {
        const id = String(modId);
        const removed = this.definitions.delete(id);
        this.expandedDefinitions.delete(id);
        if (removed) this.refreshNativeSettings();
        return removed;
    }

    getValuesBucket(modId) {
        if (!this.mod.settings.values[modId] || typeof this.mod.settings.values[modId] !== "object") {
            this.mod.settings.values[modId] = {};
        }
        return this.mod.settings.values[modId];
    }

    getDefinition(modId) {
        return this.definitions.get(String(modId));
    }

    normalizeStoredValue(definition, field) {
        const values = this.getValuesBucket(definition.id);
        let value = values[field.id];
        if (field.type === "boolean") {
            values[field.id] = Boolean(value);
        } else if (field.type === "number") {
            value = Number(value);
            values[field.id] = Number.isFinite(value)
                ? Math.max(field.min, Math.min(field.max, value))
                : Number(field.default) || field.min;
        } else if (field.type === "select") {
            const valid = field.options.some(option => option.value === value);
            if (!valid && field.options.length) values[field.id] = this.clone(field.options[0].value);
        } else if (field.type === "text") {
            values[field.id] = String(value === undefined || value === null ? "" : value);
        }
    }

    get(modId, fieldId) {
        const definition = this.getDefinition(modId);
        if (!definition) return undefined;
        const field = definition.fields.find(item => item.id === String(fieldId));
        if (!field) return undefined;
        this.normalizeStoredValue(definition, field);
        return this.getValuesBucket(definition.id)[field.id];
    }

    getAll(modId) {
        const definition = this.getDefinition(modId);
        if (!definition) return {};
        const result = {};
        for (const field of definition.fields) result[field.id] = this.get(definition.id, field.id);
        return result;
    }

    set(modId, fieldId, rawValue, options = {}) {
        const definition = this.getDefinition(modId);
        if (!definition) return undefined;
        const field = definition.fields.find(item => item.id === String(fieldId));
        if (!field || field.type === "heading") return undefined;

        let value = rawValue;
        if (field.type === "boolean") {
            value = rawValue === true || rawValue === "true" || rawValue === 1 || rawValue === "1";
        } else if (field.type === "number") {
            value = Number(rawValue);
            if (!Number.isFinite(value)) value = Number(field.default) || field.min;
            value = Math.max(field.min, Math.min(field.max, value));
        } else if (field.type === "select") {
            const matched = field.options.find(option => option.value === rawValue || String(option.value) === String(rawValue));
            if (matched) value = matched.value;
            else return undefined;
        } else {
            value = String(rawValue === undefined || rawValue === null ? "" : rawValue);
        }

        const values = this.getValuesBucket(definition.id);
        values[field.id] = value;
        if (field.onChange) {
            try {
                field.onChange(value, { modId: definition.id, fieldId: field.id, source: options.source || "api" });
            } catch (error) {
                console.error("Structured Mod Settings onChange failed", definition.id, field.id, error);
            }
        }
        if (options.persist !== false) this.mod.saveSettings();
        if (options.rerender !== false) this.refreshNativeSettings();
        return value;
    }

    reset(modId) {
        const definition = this.getDefinition(modId);
        if (!definition) return false;
        const values = this.getValuesBucket(definition.id);
        for (const field of definition.fields) {
            if (field.type === "heading") continue;
            values[field.id] = this.clone(field.default);
            if (field.onChange) {
                try {
                    field.onChange(values[field.id], { modId: definition.id, fieldId: field.id, source: "reset" });
                } catch (error) {
                    console.error("Structured Mod Settings reset failed", definition.id, field.id, error);
                }
            }
        }
        this.mod.saveSettings();
        this.refreshNativeSettings();
        return true;
    }

    exposeApi() {
        const api = {
            version: API_VERSION,
            register: definition => this.register(definition),
            unregister: modId => this.unregister(modId),
            get: (modId, fieldId) => this.get(modId, fieldId),
            set: (modId, fieldId, value) => this.set(modId, fieldId, value),
            getAll: modId => this.getAll(modId),
            reset: modId => this.reset(modId),
            open: () => this.openNativeSettings(),
            close: () => this.closeNativeSettings(),
        };
        globalThis[API_NAME] = api;
        if (typeof shapez !== "undefined") shapez.StructuredModSettings = api;
    }

    patchNativeSettingsState() {
        let SettingsState = null;
        try {
            SettingsState = typeof shapez !== "undefined" ? shapez.SettingsState : null;
        } catch (error) { }

        if (!SettingsState || !SettingsState.prototype) {
            this.installDomFallback();
            return;
        }
        const prototype = SettingsState.prototype;
        const marker = "__structuredModSettingsPatched_11";
        if (prototype[marker]) {
            this.nativeSettingsPatched = true;
            return;
        }

        const registry = this;
        const originalMainContent = prototype.getMainContentHTML;
        const originalSettingsHtml = prototype.getSettingsHtml;
        const originalInitCategoryButtons = prototype.initCategoryButtons;

        if (typeof originalMainContent === "function") {
            prototype.getMainContentHTML = function() {
                let html = originalMainContent.call(this);
                const button = registry.renderNativeCategoryButtonHtml();
                // Reuse the vanilla mod-management slot, keeping the sidebar
                // order identical to the screenshot and leaving management
                // accessible from the category intro card.
                const managerButton = /<button class="styledButton categoryButton manageMods">[\s\S]*?<\/button>/;
                if (managerButton.test(html)) {
                    html = html.replace(managerButton, button);
                } else {
                    html = html.replace(/(<div class="other[^"]*">)/, button + "$1");
                }
                return html;
            };
        }

        if (typeof originalSettingsHtml === "function") {
            prototype.getSettingsHtml = function() {
                return originalSettingsHtml.call(this) + registry.renderNativeCategoryHtml();
            };
        }

        if (typeof originalInitCategoryButtons === "function") {
            prototype.initCategoryButtons = function() {
                originalInitCategoryButtons.call(this);
                const button = this.htmlElement.querySelector("[data-category-btn='" + SETTINGS_CATEGORY_ID + "']");
                if (button) {
                    registry.trackNativeClick(this, button, () => this.setActiveCategory(SETTINGS_CATEGORY_ID));
                }
                registry.bindNativeSettings(this);
            };
        }

        prototype[marker] = true;
        this.nativeSettingsPatched = true;
        this.refreshNativeSettings();
    }

    trackNativeClick(state, element, callback) {
        // State click detectors are cleaned up automatically when leaving the
        // settings state. This also preserves the game's touch/click behavior.
        if (state && typeof state.trackClicks === "function") {
            state.trackClicks(element, callback, { preventDefault: false });
        } else {
            element.addEventListener("click", callback);
        }
    }

    installDomFallback() {
        if (this.domObserver || typeof MutationObserver === "undefined" || !document.body) return;
        this.domObserver = new MutationObserver(() => this.tryInjectNativeDomFallback());
        this.domObserver.observe(document.body, { childList: true, subtree: true });
        this.tryInjectNativeDomFallback();
    }

    tryInjectNativeDomFallback() {
        const sidebar = document.querySelector("#state_SettingsState .sidebar");
        const categoryContainer = document.querySelector("#state_SettingsState .categoryContainer");
        if (!sidebar || !categoryContainer || sidebar.querySelector("[data-category-btn='" + SETTINGS_CATEGORY_ID + "']")) return;

        const oldManager = sidebar.querySelector("button.manageMods");
        const button = document.createElement("div");
        button.innerHTML = this.renderNativeCategoryButtonHtml();
        const categoryButton = button.firstElementChild;
        if (oldManager) oldManager.replaceWith(categoryButton);
        else sidebar.insertBefore(categoryButton, sidebar.querySelector(".other"));

        const category = document.createElement("div");
        category.innerHTML = this.renderNativeCategoryHtml();
        categoryContainer.appendChild(category.firstElementChild);
        categoryButton.addEventListener("click", () => this.activateFallbackCategory());
        this.bindNativeSettings({ htmlElement: document.body, trackClicks: (element, cb) => element.addEventListener("click", cb) });
    }

    activateFallbackCategory() {
        const root = document.querySelector("#state_SettingsState");
        if (!root) return;
        root.querySelectorAll(".category").forEach(element => element.classList.remove("active"));
        root.querySelectorAll(".categoryButton").forEach(element => element.classList.remove("active"));
        const category = root.querySelector("[data-category='" + SETTINGS_CATEGORY_ID + "']");
        const button = root.querySelector("[data-category-btn='" + SETTINGS_CATEGORY_ID + "']");
        if (category) category.classList.add("active");
        if (button) button.classList.add("active");
    }

    renderNativeCategoryButtonHtml() {
        return `<button class="styledButton categoryButton sms-mods-category" data-category-btn="${SETTINGS_CATEGORY_ID}">
                    ${this.escape(this.locale === "zh" ? "游戏模组（MODS）" : "Game Mods (MODS)")}
                    <span class="newBadge">${this.locale === "zh" ? "新的！" : "NEW!"}</span>
                </button>`;
    }

    renderNativeCategoryHtml() {
        const definitions = Array.from(this.definitions.values());
        const body = definitions.length
            ? definitions.map(definition => this.renderDefinition(definition)).join("")
            : `<div class="sms-empty">${this.locale === "zh" ? "当前没有模组注册设置项。" : "No mod settings have been registered yet."}</div>`;
        return `<div class="category sms-native-category" data-category="${SETTINGS_CATEGORY_ID}">
                    <div class="sms-category-intro setting cardbox">
                        <div class="sms-category-intro-copy">
                            <strong>${this.locale === "zh" ? "模组设置" : "Mod Settings"}</strong>
                            <span>${this.locale === "zh" ? "由已安装的模组提供的设置集中显示在这里。" : "Settings provided by installed mods are shown here."}</span>
                        </div>
                        <div class="sms-category-actions">
                            <button type="button" class="styledButton sms-reload-game" data-sms-reload-game="1">
                                ${this.locale === "zh" ? "重载游戏" : "Reload Game"}
                            </button>
                            <button type="button" class="styledButton sms-open-manager" data-sms-open-manager="1">
                                ${this.locale === "zh" ? "管理模组" : "Manage Mods"}
                            </button>
                        </div>
                    </div>
                    ${body}
                </div>`;
    }

    renderDefinition(definition) {
        const fields = definition.fields.map(field => {
            if (field.type === "heading") {
                return `<div class="sms-setting-heading">${this.escape(field.label)}</div>`;
            }

            const value = this.get(definition.id, field.id);
            const label = this.escape(field.label);
            const description = field.description ? `<div class="desc">${this.escape(field.description)}</div>` : "";
            const common = `data-sms-control="1" data-sms-mod="${this.escape(definition.id)}" data-sms-field="${this.escape(field.id)}"`;
            let control = "";
            if (field.type === "boolean") {
                control = `<button type="button" class="value checkbox ${value ? "checked" : ""}" ${common} aria-pressed="${value ? "true" : "false"}"><span class="knob"></span></button>`;
            } else if (field.type === "number") {
                const suffix = this.text(field.suffix);
                const suffixHtml = suffix
                    ? `<span class="sms-number-suffix">${this.escape(suffix)}</span>`
                    : "";
                control = `<div class="sms-number-control">
                    <div class="value rangeInputContainer noPressEffect">
                        <label data-sms-number-label="1">${this.escape(this.formatFieldNumber(value, field))}</label>
                        <input class="rangeInput" ${common} type="range" min="${field.min}" max="${field.max}" step="${field.step}" value="${this.escape(value)}">
                    </div>
                    <input class="sms-number-input" ${common} type="number" min="${field.min}" max="${field.max}" step="${field.step}" value="${this.escape(value)}">
                    ${suffixHtml}
                </div>`;
            } else if (field.type === "select") {
                control = `<select class="value enum sms-select" ${common}>${field.options.map((option, index) => `<option value="${index}" ${option.value === value ? "selected" : ""}>${this.escape(option.label)}</option>`).join("")}</select>`;
            } else {
                control = `<input class="sms-text-input" ${common} type="text" value="${this.escape(value)}" placeholder="${this.escape(field.placeholder)}">`;
            }
            return `<div class="row sms-field-row"><div class="sms-field-copy"><label>${label}</label>${description}</div><div class="sms-field-control">${control}</div></div>`;
        }).join("");

        const expanded = this.expandedDefinitions.has(definition.id);
        const description = definition.description ? `<span class="desc sms-definition-description">${this.escape(definition.description)}</span>` : "";
        return `<div class="setting cardbox sms-definition${expanded ? " is-expanded" : ""}" data-sms-definition="${this.escape(definition.id)}">
                    <div class="sms-definition-header row">
                        <button type="button" class="sms-definition-toggle" data-sms-toggle="${this.escape(definition.id)}" aria-expanded="${expanded ? "true" : "false"}">
                            <span class="sms-definition-chevron" aria-hidden="true">▸</span>
                            <span class="sms-definition-copy"><span class="sms-definition-title">${this.escape(definition.title)}</span>${description}</span>
                        </button>
                        <button type="button" class="styledButton sms-reset" data-sms-reset="${this.escape(definition.id)}">${this.locale === "zh" ? "恢复默认" : "Reset"}</button>
                    </div>
                    <div class="sms-definition-fields">${fields}</div>
                </div>`;
    }

    formatNumber(value) {
        const number = Number(value);
        if (!Number.isFinite(number)) return String(value);
        return String(Number(number.toFixed(4)));
    }

    formatFieldNumber(value, field) {
        const suffix = this.text(field && field.suffix);
        return this.formatNumber(value) + suffix;
    }

    bindNativeSettings(state) {
        const root = state && state.htmlElement ? state.htmlElement : document;
        const category = root.querySelector ? root.querySelector("[data-category='" + SETTINGS_CATEGORY_ID + "']") : null;
        if (!category) return;

        for (const control of category.querySelectorAll("[data-sms-control]")) {
            control.addEventListener("click", event => {
                const field = this.getFieldFromControl(control);
                if (field && field.type === "boolean") {
                    event.preventDefault();
                    control.classList.toggle("checked");
                    control.setAttribute("aria-pressed", control.classList.contains("checked") ? "true" : "false");
                    this.onControlChanged(control, true);
                }
            });
            control.addEventListener("change", () => this.onControlChanged(control, true));
            if (control.type === "range") {
                control.addEventListener("input", () => this.onControlChanged(control, false));
            }
        }
        for (const button of category.querySelectorAll("[data-sms-reset]")) {
            button.addEventListener("click", () => this.reset(button.dataset.smsReset));
        }
        for (const button of category.querySelectorAll("[data-sms-toggle]")) {
            button.addEventListener("click", () => this.toggleDefinition(button));
        }
        for (const button of category.querySelectorAll("[data-sms-reload-game]")) {
            button.addEventListener("click", event => {
                event.preventDefault();
                this.reloadGame(category, button);
            });
        }
        const manager = category.querySelector("[data-sms-open-manager]");
        if (manager) {
            manager.addEventListener("click", () => {
                if (state && typeof state.moveToStateAddGoBack === "function") state.moveToStateAddGoBack("ModsState");
            });
        }
    }

    reloadGame(category, button) {
        if (this.reloadRequested) return false;
        this.reloadRequested = true;

        // Commit every currently rendered control before the page reloads.
        // This covers range sliders which have only received an input event
        // and makes the button safe to use immediately after changing a value.
        if (category && typeof category.querySelectorAll === "function") {
            for (const control of category.querySelectorAll("[data-sms-control]")) {
                this.onControlChanged(control, true);
            }
        }
        try {
            this.mod.saveSettings();
        } catch (error) {
            console.warn("Structured Mod Settings: failed to save before reload", error);
        }

        if (button) {
            button.disabled = true;
            button.classList.add("is-reloading");
            button.textContent = this.locale === "zh" ? "重载中…" : "Reloading…";
        }

        const performReload = () => {
            try {
                // shapez itself uses window.location.reload(true) for an app
                // restart. In the desktop build this reloads the game renderer
                // and all filesystem mods while keeping the application window.
                if (typeof window !== "undefined" && window.location
                    && typeof window.location.reload === "function") {
                    window.location.reload(true);
                    return;
                }
            } catch (error) {
                console.error("Structured Mod Settings: game reload failed", error);
            }
            this.reloadRequested = false;
            if (button) {
                button.disabled = false;
                button.classList.remove("is-reloading");
                button.textContent = this.locale === "zh" ? "重载游戏" : "Reload Game";
            }
        };

        // Let click handlers and persistence settle before navigating away.
        if (typeof window !== "undefined" && typeof window.setTimeout === "function") {
            window.setTimeout(performReload, 0);
        } else {
            performReload();
        }
        return true;
    }

    getFieldFromControl(control) {
        const definition = this.getDefinition(control.dataset.smsMod);
        return definition && definition.fields.find(field => field.id === control.dataset.smsField);
    }

    toggleDefinition(button) {
        if (!button) return;
        const modId = String(button.dataset.smsToggle || "");
        if (!modId) return;

        const card = button.closest(".sms-definition");
        const willExpand = !card || !card.classList.contains("is-expanded");
        if (willExpand) this.expandedDefinitions.add(modId);
        else this.expandedDefinitions.delete(modId);

        if (card) card.classList.toggle("is-expanded", willExpand);
        button.setAttribute("aria-expanded", willExpand ? "true" : "false");
    }

    onControlChanged(control, persist) {
        const modId = control.dataset.smsMod;
        const fieldId = control.dataset.smsField;
        const field = this.getFieldFromControl(control);
        if (!field) return;

        let value;
        if (field.type === "boolean") {
            value = control.classList.contains("checked");
        } else if (field.type === "number") {
            value = control.value;
        } else if (field.type === "select") {
            const optionIndex = Number(control.value);
            value = field.options[optionIndex] && field.options[optionIndex].value;
        } else {
            value = control.value;
        }
        this.set(modId, fieldId, value, { source: "ui", persist, rerender: false });

        if (field.type === "number") {
            const normalized = String(this.get(modId, fieldId));
            const category = control.closest("[data-category='" + SETTINGS_CATEGORY_ID + "']");
            if (category) {
                for (const peer of category.querySelectorAll("[data-sms-mod='" + this.escapeAttribute(modId) + "'][data-sms-field='" + this.escapeAttribute(fieldId) + "']")) {
                    if (peer !== control) peer.value = normalized;
                }
                const label = category.querySelector("[data-sms-mod='" + this.escapeAttribute(modId) + "'][data-sms-field='" + this.escapeAttribute(fieldId) + "'][type='range']")
                    && category.querySelector("[data-sms-mod='" + this.escapeAttribute(modId) + "'][data-sms-field='" + this.escapeAttribute(fieldId) + "'][type='range']").closest(".rangeInputContainer").querySelector("[data-sms-number-label]");
                if (label) label.textContent = this.formatFieldNumber(this.get(modId, fieldId), field);
            }
        }
    }

    escapeAttribute(value) {
        return this.text(value).replace(/\\/g, "\\\\").replace(/"/g, "\\\"");
    }

    refreshNativeSettings() {
        this.locale = this.detectLocale();
        const root = document.querySelector("#state_SettingsState");
        if (!root) return;
        const category = root.querySelector("[data-category='" + SETTINGS_CATEGORY_ID + "']");
        if (!category) return;

        const active = category.classList.contains("active");
        const holder = document.createElement("div");
        holder.innerHTML = this.renderNativeCategoryHtml();
        const replacement = holder.firstElementChild;
        if (!replacement) return;
        if (active) replacement.classList.add("active");
        category.replaceWith(replacement);

        const state = this.mod.app && this.mod.app.stateMgr && this.mod.app.stateMgr.getCurrentState
            ? this.mod.app.stateMgr.getCurrentState()
            : null;
        this.bindNativeSettings(state || { htmlElement: root });
    }

    openNativeSettings() {
        const stateManager = this.mod.app && this.mod.app.stateMgr;
        if (!stateManager) return;
        const current = stateManager.getCurrentState && stateManager.getCurrentState();
        if (current && current.getKey && current.getKey() === "SettingsState") {
            this.activateNativeSettingsCategory(current);
            return;
        }
        stateManager.moveToState("SettingsState");
        setTimeout(() => {
            const next = stateManager.getCurrentState && stateManager.getCurrentState();
            this.activateNativeSettingsCategory(next);
        }, 250);
    }

    activateNativeSettingsCategory(state) {
        if (!state) return;
        const root = state.htmlElement || document.querySelector("#state_SettingsState");
        const button = root && root.querySelector("[data-category-btn='" + SETTINGS_CATEGORY_ID + "']");
        if (!button) return;
        if (typeof state.setActiveCategory === "function") state.setActiveCategory(SETTINGS_CATEGORY_ID);
        else this.activateFallbackCategory();
    }

    closeNativeSettings() {
        const stateManager = this.mod.app && this.mod.app.stateMgr;
        const state = stateManager && stateManager.getCurrentState && stateManager.getCurrentState();
        if (state && state.getKey && state.getKey() === "SettingsState" && typeof state.onBackButton === "function") {
            state.onBackButton();
        }
    }

    getCss() {
        return `
            #state_SettingsState .sidebar button.sms-mods-category {
                display: flex;
                align-items: center;
                gap: 6px;
                padding-right: 5px;
                background-color: #f8ddfb;
                color: #cf38df;
            }
            #state_SettingsState .sidebar button.sms-mods-category .newBadge {
                margin-left: auto;
                padding: 0 5px;
                border-radius: 8px;
                background: #cf38df;
                color: #fff;
                font-size: .8em;
                line-height: 1.6;
            }
            #state_SettingsState .sidebar button.sms-mods-category.active {
                background-color: #cf38df;
                color: #fff;
            }
            #state_SettingsState .sms-native-category .sms-category-intro {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 15px;
            }
            #state_SettingsState .sms-category-intro-copy {
                display: flex;
                min-width: 0;
                flex-direction: column;
            }
            #state_SettingsState .sms-category-intro-copy strong,
            #state_SettingsState .sms-definition-copy > .sms-definition-title {
                text-transform: uppercase;
                font-size: 1.1em;
            }
            #state_SettingsState .sms-category-intro-copy span {
                margin-top: 5px;
                color: #aaadb2;
                font-size: .85em;
            }
            #state_SettingsState .sms-category-actions {
                display: flex;
                flex: 0 0 auto;
                align-items: center;
                gap: 7px;
            }
            #state_SettingsState .sms-open-manager,
            #state_SettingsState .sms-reload-game,
            #state_SettingsState .sms-reset {
                flex: 0 0 auto;
                padding: 4px 9px;
                font-size: .78em;
            }
            #state_SettingsState .sms-reload-game.is-reloading {
                cursor: wait;
                opacity: .72;
            }
            #state_SettingsState .sms-definition-header {
                grid-template-columns: 1fr auto;
                margin-bottom: 5px;
            }
            #state_SettingsState .sms-definition-toggle {
                display: flex;
                min-width: 0;
                padding: 0;
                border: 0;
                background: transparent;
                color: inherit;
                font: inherit;
                text-align: left;
                cursor: pointer;
            }
            #state_SettingsState .sms-definition-toggle:focus-visible {
                outline: 2px solid rgba(84, 174, 230, .6);
                outline-offset: 3px;
                border-radius: 4px;
            }
            #state_SettingsState .sms-definition-chevron {
                flex: 0 0 auto;
                width: 17px;
                margin-top: 1px;
                color: #5b9ed5;
                transition: transform .12s ease;
            }
            #state_SettingsState .sms-definition.is-expanded .sms-definition-chevron {
                transform: rotate(90deg);
            }
            #state_SettingsState .sms-definition-copy {
                min-width: 0;
            }
            #state_SettingsState .sms-definition-description {
                display: block;
                margin-top: 5px;
            }
            #state_SettingsState .sms-definition:not(.is-expanded) .sms-definition-fields {
                display: none;
            }
            #state_SettingsState .sms-field-row {
                min-height: 34px;
                padding-top: 7px;
                padding-bottom: 7px;
                border-top: 1px solid rgba(130, 135, 145, .15);
            }
            #state_SettingsState .sms-field-copy {
                min-width: 0;
            }
            #state_SettingsState .sms-field-copy label {
                text-transform: none;
            }
            #state_SettingsState .sms-field-copy .desc {
                max-width: 680px;
            }
            #state_SettingsState .sms-field-control {
                display: flex;
                align-items: center;
                justify-content: flex-end;
                pointer-events: all;
            }
            #state_SettingsState .sms-number-control {
                display: flex;
                align-items: center;
                gap: 6px;
            }
            #state_SettingsState .sms-number-control .rangeInputContainer {
                min-width: 142px;
            }
            #state_SettingsState .sms-number-input,
            #state_SettingsState .sms-text-input,
            #state_SettingsState .sms-select {
                box-sizing: border-box;
                min-width: 110px;
                padding: 4px 7px;
                border: 0;
                border-radius: 4px;
                outline: 0;
                background: #fff;
                color: #56585d;
                font: inherit;
                pointer-events: all;
            }
            #state_SettingsState .sms-number-input {
                width: 66px;
                min-width: 66px;
            }
            #state_SettingsState .sms-number-suffix {
                min-width: 10px;
                color: #7d808a;
                font-weight: bold;
            }
            #state_SettingsState .sms-text-input {
                width: 180px;
            }
            #state_SettingsState .sms-select {
                max-width: 190px;
                cursor: pointer;
            }
            #state_SettingsState .sms-number-input:focus,
            #state_SettingsState .sms-text-input:focus,
            #state_SettingsState .sms-select:focus {
                box-shadow: 0 0 0 2px rgba(84, 174, 230, .35);
            }
            #state_SettingsState .sms-setting-heading {
                padding: 8px 0 3px;
                color: #5b9ed5;
                font-size: .82em;
                font-weight: bold;
                text-transform: uppercase;
            }
            #state_SettingsState .sms-empty {
                padding: 30px 10px;
                color: #aaadb2;
                text-align: center;
            }
            #state_SettingsState .sms-native-category .sms-definition:last-child {
                margin-bottom: 0;
            }
            #state_SettingsState.darkMode .sms-number-input,
            #state_SettingsState.darkMode .sms-text-input,
            #state_SettingsState.darkMode .sms-select {
                background: #35383d;
                color: #ddd;
            }
            [data-theme="dark"] #state_SettingsState .sms-number-input,
            [data-theme="dark"] #state_SettingsState .sms-text-input,
            [data-theme="dark"] #state_SettingsState .sms-select {
                background: #35383d;
                color: #ddd;
            }
        `;
    }
}

class Mod extends shapez.Mod {
    init() {
        this.registry = new StructuredSettingsRegistry(this);
        this.registry.init();
    }
}
