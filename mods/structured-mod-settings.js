// @ts-nocheck
const METADATA = {
    website: "https://github.com/ct-yx/shapez-mods",
    author: "ct-yx & Codex",
    name: "Structured Mod Settings UI",
    version: "1.0.0",
    id: "structured-mod-settings-ui",
    description: "A reusable settings panel for shapez.io mods with persistent structured controls.",
    minimumGameVersion: ">=1.5.0",
    doesNotAffectSavegame: true,

    // This is the library's own persistent storage. Registered mods keep their
    // values in the values object so they do not need to implement storage.
    settings: {
        panelOpen: false,
        values: {},
    },
};

const API_NAME = "ShapezStructuredSettings";
const API_VERSION = "1.0.0";

class StructuredSettingsRegistry {
    constructor(mod) {
        this.mod = mod;
        this.definitions = new Map();
        this.root = null;
        this.panel = null;
        this.locale = this.detectLocale();
        this.documentKeyHandler = event => {
            if (event.key === "Escape" && this.mod.settings.panelOpen) {
                this.setPanelOpen(false);
            }
        };
    }

    init() {
        if (!this.mod.settings || typeof this.mod.settings !== "object") {
            this.mod.settings = { panelOpen: false, values: {} };
        }
        if (!this.mod.settings.values || typeof this.mod.settings.values !== "object") {
            this.mod.settings.values = {};
        }
        if (typeof this.mod.settings.panelOpen !== "boolean") {
            this.mod.settings.panelOpen = false;
        }

        this.mod.modInterface.registerCss(this.getCss());
        document.addEventListener("keydown", this.documentKeyHandler);
        this.exposeApi();
        this.mount();

        this.mod.signals.stateEntered.add(() => {
            this.locale = this.detectLocale();
            this.mount();
        });
    }

    detectLocale() {
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
        this.mount();
        this.render();

        return {
            id: normalized.id,
            get: fieldId => this.get(normalized.id, fieldId),
            set: (fieldId, value) => this.set(normalized.id, fieldId, value),
            getAll: () => this.getAll(normalized.id),
            open: () => this.setPanelOpen(true),
            reset: () => this.reset(normalized.id),
            unregister: () => this.unregister(normalized.id),
        };
    }

    unregister(modId) {
        const removed = this.definitions.delete(String(modId));
        if (removed) this.render();
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
        const values = this.getValuesBucket(definition.id);
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
        this.mod.saveSettings();
        if (options.rerender !== false) this.render();
        return value;
    }

    reset(modId) {
        const definition = this.getDefinition(modId);
        if (!definition) return false;
        const values = this.getValuesBucket(definition.id);
        for (const field of definition.fields) {
            if (field.type === "heading") continue;
            values[field.id] = this.clone(field.default);
            if (field.onChange) field.onChange(values[field.id], { modId: definition.id, fieldId: field.id, source: "reset" });
        }
        this.mod.saveSettings();
        this.render();
        return true;
    }

    setPanelOpen(open) {
        this.mod.settings.panelOpen = Boolean(open);
        this.mod.saveSettings();
        this.render();
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
            open: () => this.setPanelOpen(true),
            close: () => this.setPanelOpen(false),
        };
        globalThis[API_NAME] = api;
        if (typeof shapez !== "undefined") shapez.StructuredModSettings = api;
    }

    mount() {
        if (!document.body) return;
        if (!this.root || !document.body.contains(this.root)) {
            this.root = document.createElement("div");
            this.root.id = "sms-root";
            document.body.appendChild(this.root);
        }
        this.render();
    }

    render() {
        if (!this.root) return;
        const definitions = Array.from(this.definitions.values());
        this.root.innerHTML = `
            <button id="sms-toggle" type="button" aria-expanded="${this.mod.settings.panelOpen ? "true" : "false"}" title="${this.escape(this.locale === "zh" ? "打开模组设置" : "Open mod settings")}">
                <span class="sms-toggle-icon">⚙</span><span>${this.locale === "zh" ? "模组设置" : "Mod Settings"}</span>
            </button>
            <section id="sms-panel" class="sms-panel" ${this.mod.settings.panelOpen ? "" : "hidden"}>
                <header class="sms-header">
                    <div><strong>${this.locale === "zh" ? "模组设置" : "Mod Settings"}</strong><small>${this.locale === "zh" ? "统一管理已注册的模组设置" : "Manage settings registered by installed mods"}</small></div>
                    <button id="sms-close" type="button" aria-label="${this.locale === "zh" ? "关闭" : "Close"}">×</button>
                </header>
                <div class="sms-body">
                    ${definitions.length ? definitions.map(definition => this.renderDefinition(definition)).join("") : `<div class="sms-empty">${this.locale === "zh" ? "当前没有模组注册设置项。" : "No mod settings have been registered yet."}</div>`}
                </div>
                <footer class="sms-footer">Structured Mod Settings UI v${API_VERSION}</footer>
            </section>`;

        const toggle = this.root.querySelector("#sms-toggle");
        const close = this.root.querySelector("#sms-close");
        if (toggle) toggle.onclick = () => this.setPanelOpen(!this.mod.settings.panelOpen);
        if (close) close.onclick = () => this.setPanelOpen(false);

        for (const input of this.root.querySelectorAll("[data-sms-control]")) {
            input.onchange = event => this.onControlChanged(event.target);
            if (input.type === "range" || input.type === "number") input.oninput = event => this.onControlChanged(event.target);
        }
        for (const button of this.root.querySelectorAll("[data-sms-reset]")) {
            button.onclick = () => this.reset(button.dataset.smsReset);
        }
    }

    renderDefinition(definition) {
        const fields = definition.fields.map(field => {
            if (field.type === "heading") {
                return `<div class="sms-field-heading">${this.escape(field.label)}</div>`;
            }
            const value = this.get(definition.id, field.id);
            const label = this.escape(field.label);
            const description = field.description ? `<small>${this.escape(field.description)}</small>` : "";
            let control = "";
            if (field.type === "boolean") {
                control = `<input data-sms-control="1" data-sms-mod="${this.escape(definition.id)}" data-sms-field="${this.escape(field.id)}" type="checkbox" ${value ? "checked" : ""}>`;
            } else if (field.type === "number") {
                control = `<div class="sms-number-control"><input data-sms-control="1" data-sms-mod="${this.escape(definition.id)}" data-sms-field="${this.escape(field.id)}" type="range" min="${field.min}" max="${field.max}" step="${field.step}" value="${this.escape(value)}"><input data-sms-control="1" data-sms-mod="${this.escape(definition.id)}" data-sms-field="${this.escape(field.id)}" type="number" min="${field.min}" max="${field.max}" step="${field.step}" value="${this.escape(value)}"><span>x</span></div>`;
            } else if (field.type === "select") {
                control = `<select data-sms-control="1" data-sms-mod="${this.escape(definition.id)}" data-sms-field="${this.escape(field.id)}">${field.options.map((option, index) => `<option value="${index}" ${option.value === value ? "selected" : ""}>${this.escape(option.label)}</option>`).join("")}</select>`;
            } else {
                control = `<input data-sms-control="1" data-sms-mod="${this.escape(definition.id)}" data-sms-field="${this.escape(field.id)}" type="text" value="${this.escape(value)}" placeholder="${this.escape(field.placeholder)}">`;
            }
            return `<div class="sms-field"><div class="sms-field-copy"><label>${label}</label>${description}</div><div class="sms-field-control">${control}</div></div>`;
        }).join("");
        const description = definition.description ? `<p class="sms-definition-description">${this.escape(definition.description)}</p>` : "";
        return `<article class="sms-definition"><div class="sms-definition-header"><div><h3>${this.escape(definition.title)}</h3>${description}</div><button type="button" data-sms-reset="${this.escape(definition.id)}">${this.locale === "zh" ? "恢复默认" : "Reset"}</button></div>${fields}</article>`;
    }

    onControlChanged(control) {
        const modId = control.dataset.smsMod;
        const fieldId = control.dataset.smsField;
        const definition = this.getDefinition(modId);
        const field = definition && definition.fields.find(item => item.id === fieldId);
        if (!field) return;

        let value;
        if (field.type === "boolean") {
            value = control.checked;
        } else if (field.type === "number") {
            value = control.value;
        } else if (field.type === "select") {
            const optionIndex = Number(control.value);
            value = field.options[optionIndex] && field.options[optionIndex].value;
        } else {
            value = control.value;
        }
        this.set(modId, fieldId, value, { source: "ui", rerender: false });

        if (field.type === "number") {
            for (const peer of this.root.querySelectorAll(`[data-sms-mod="${this.escapeAttribute(modId)}"][data-sms-field="${this.escapeAttribute(fieldId)}"]`)) {
                if (peer !== control) peer.value = String(this.get(modId, fieldId));
            }
        }
    }

    escapeAttribute(value) {
        return this.text(value).replace(/\\/g, "\\\\").replace(/"/g, "\\\"");
    }

    getCss() {
        return `
            #sms-root { position: fixed; top: 14px; right: 14px; z-index: 100000; color: #edf6ff; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 12px; pointer-events: none; }
            #sms-root button, #sms-root input, #sms-root select { font: inherit; }
            #sms-toggle { pointer-events: auto; display: inline-flex; align-items: center; gap: 6px; padding: 7px 10px; border: 1px solid rgba(102,227,255,.24); border-radius: 9px; background: rgba(9,18,39,.92); color: #dceeff; cursor: pointer; box-shadow: 0 5px 18px rgba(0,0,0,.26); }
            #sms-toggle:hover { border-color: #66e3ff; color: #fff; }
            .sms-toggle-icon { color: #66e3ff; font-size: 15px; line-height: 1; }
            .sms-panel { pointer-events: auto; width: min(410px, calc(100vw - 28px)); max-height: calc(100vh - 74px); margin-top: 8px; overflow: auto; border: 1px solid rgba(102,227,255,.24); border-radius: 14px; background: linear-gradient(145deg, rgba(12,24,51,.98), rgba(26,20,55,.98)); box-shadow: 0 18px 52px rgba(0,0,0,.52), 0 0 26px rgba(102,227,255,.08); }
            .sms-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; padding: 14px 15px 11px; border-bottom: 1px solid rgba(145,208,255,.14); }
            .sms-header strong { display: block; color: #fff; font-size: 13px; letter-spacing: .04em; }
            .sms-header small, .sms-footer { color: #91a9cb; font-size: 9px; }
            #sms-close { width: 24px; height: 24px; padding: 0; border: 1px solid rgba(255,255,255,.14); border-radius: 50%; background: rgba(255,255,255,.06); color: #bcd7ff; cursor: pointer; font-size: 17px; line-height: 17px; }
            #sms-close:hover { color: #fff; background: rgba(255,255,255,.14); }
            .sms-body { display: flex; flex-direction: column; gap: 10px; padding: 12px; }
            .sms-definition { padding: 11px; border: 1px solid rgba(145,208,255,.14); border-radius: 10px; background: rgba(7,16,36,.52); }
            .sms-definition-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; margin-bottom: 10px; }
            .sms-definition h3 { margin: 0; color: #dff7ff; font-size: 12px; }
            .sms-definition-description { margin: 4px 0 0; color: #91a9cb; font-size: 9px; line-height: 1.4; }
            .sms-definition-header button { flex: 0 0 auto; padding: 4px 6px; border: 1px solid rgba(145,208,255,.16); border-radius: 6px; background: rgba(255,255,255,.06); color: #91a9cb; cursor: pointer; font-size: 9px; }
            .sms-definition-header button:hover { color: #fff; border-color: #66e3ff; }
            .sms-field { display: flex; align-items: center; justify-content: space-between; gap: 10px; min-height: 34px; padding: 7px 0; border-top: 1px solid rgba(145,208,255,.08); }
            .sms-field-copy { min-width: 0; }
            .sms-field-copy label { display: block; color: #d5e8ff; font-size: 10px; }
            .sms-field-copy small { display: block; margin-top: 3px; color: #829bc1; font-size: 8px; line-height: 1.35; }
            .sms-field-control { flex: 0 0 auto; max-width: 58%; }
            .sms-field-control > input[type="text"], .sms-field-control > select { width: 142px; padding: 5px 6px; border: 1px solid rgba(145,208,255,.20); border-radius: 6px; outline: none; background: rgba(0,0,0,.25); color: #edf6ff; font-size: 10px; }
            .sms-field-control select { max-width: 160px; }
            .sms-field-control input:focus, .sms-field-control select:focus { border-color: #66e3ff; box-shadow: 0 0 0 2px rgba(102,227,255,.12); }
            .sms-field-control input[type="checkbox"] { width: 18px; height: 18px; accent-color: #54f5aa; }
            .sms-number-control { display: flex; align-items: center; gap: 5px; }
            .sms-number-control input[type="range"] { width: 110px; accent-color: #66e3ff; }
            .sms-number-control input[type="number"] { width: 58px; padding: 4px; border: 1px solid rgba(145,208,255,.20); border-radius: 6px; background: rgba(0,0,0,.25); color: #edf6ff; font-size: 10px; }
            .sms-number-control span { color: #91a9cb; font-size: 9px; }
            .sms-field-heading { padding: 8px 0 3px; color: #66e3ff; font-size: 9px; font-weight: 800; letter-spacing: .1em; text-transform: uppercase; }
            .sms-empty { padding: 20px 8px; color: #91a9cb; text-align: center; font-size: 10px; }
            .sms-footer { padding: 0 14px 11px; text-align: right; }
            #sms-root [hidden] { display: none !important; }
        `;
    }
}

class Mod extends shapez.Mod {
    init() {
        this.registry = new StructuredSettingsRegistry(this);
        this.registry.init();
    }
}
