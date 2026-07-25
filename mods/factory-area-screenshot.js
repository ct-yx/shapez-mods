// @ts-nocheck
const METADATA = {
    website: "https://github.com/ct-yx/shapez-mods",
    author: "ct-yx & Codex",
    name: "Factory Area Snapshot",
    version: "1.3.0",
    id: "factory-area-snapshot",
    description: "Exports high-resolution tiled PNGs of the factory or a map-overview selection.",
    minimumGameVersion: ">=1.5.0",
    doesNotAffectSavegame: true,
    settings: {
        paddingTiles: 4,
        renderScale: 1,
        maxMegapixels: 64,
        includeMovingItems: true,
        pauseDuringCapture: true,
    },
};

const TILE_SIZE = 32;
const MAP_CHUNK_TILES = 16;
const DEFAULT_PADDING_TILES = 4;
const MIN_PADDING_TILES = 0;
const MAX_PADDING_TILES = 32;
const DEFAULT_RENDER_SCALE = 1;
const MIN_RENDER_SCALE = 0.25;
const MAX_RENDER_SCALE = 4;
const DEFAULT_MAX_MEGAPIXELS = 64;
const MIN_MAX_MEGAPIXELS = 16;
const MAX_MAX_MEGAPIXELS = 1024;
// A normal browser Canvas is kept below this edge. Larger captures are written
// as a streamed PNG, so they never need one giant final Canvas.
const MAX_CANVAS_EDGE = 16384;
const MAX_STREAMING_IMAGE_EDGE = 65535;
const TILE_CORE_TARGET_PX = 2048;
const TILE_BLEED_PX = 48;
const CAPTURE_YIELD_MS = 0;
// Above this size, a full final canvas would dominate memory even when its
// PNG output is mostly empty/repetitive and therefore compresses very well.
const STREAMING_PNG_MIN_MEGAPIXELS = 96;
const STREAMING_STRIPE_HEIGHT_PX = 512;
// Both the tile row cache and the PNG scanline buffer exist briefly. Bound the
// row itself so very wide streamed images remain responsive and memory stable.
const STREAMING_STRIPE_MAX_MEGAPIXELS = 4;

const STRINGS = {
    en: {
        launcher: "SNAPSHOT",
        open: "Open factory snapshot",
        close: "Close",
        title: "FACTORY AREA SNAPSHOT",
        subtitle: "TILED HIGH-RES PNG · REGULAR CAMERA RENDER",
        padding: "Outer padding",
        paddingHint: "tiles beyond placed machines",
        scale: "Render scale",
        budget: "Image budget",
        items: "Include belt items",
        pause: "Pause simulation while rendering",
        inspect: "FACTORY AREA",
        selectArea: "SELECT MAP AREA",
        capture: "EXPORT PNG",
        cancel: "CANCEL",
        noFactory: "No placed machines were detected in the regular layer.",
        machineArea: "Machines",
        selectedArea: "Map selection",
        exportArea: "Export area",
        output: "Output",
        scaleResult: "Effective scale",
        chunks: "Tiles",
        waiting: "Analyze the placed factory area before exporting.",
        ready: "Ready. Rendering is split into tiles to keep the UI responsive.",
        selectionArmed: "Map selection is armed. Zoom into Map Overview, then left-drag a rectangle.",
        selectionRequiresMap: "Zoom out until Map Overview is active, then left-drag a rectangle.",
        selectionReady: "Selected map area: {w} × {h} tiles. It will export exactly as selected, without outer padding.",
        selectionCancelled: "Map-area selection cancelled.",
        selectionExact: "Map selections export the exact dragged rectangle; outer padding applies to factory-area mode only.",
        rendering: "Rendering tile {current}/{total} · {percent}%",
        encoding: "Encoding PNG…",
        streamingEncode: "Streaming PNG rows to keep the working canvas small…",
        done: "PNG download started.",
        cancelled: "Capture cancelled.",
        tooLarge: "This export area needs {needed}x or lower to stay within the image limit. Lower the render scale, reduce padding, or choose a larger image budget.",
        allocationFailed: "The browser could not allocate this image. Try a smaller image budget or render scale.",
        unavailable: "Enter a running game to use the snapshot tool.",
        layerNote: "The PNG always uses the regular factory render; Map Overview is only used to choose an area.",
        settingsTitle: "Factory Area Snapshot",
        settingsDescription: "Exports the bounds of placed machines with a configurable safety margin. The export uses regular-camera rendering in tiles.",
        settingPadding: "Outer padding",
        settingScale: "Requested render scale",
        settingBudget: "Maximum image budget",
        settingItems: "Include moving belt items",
        settingPause: "Pause simulation while capturing",
    },
    zh: {
        launcher: "截图",
        open: "打开工厂区域截图",
        close: "关闭",
        title: "工厂区域截图",
        subtitle: "分块高分 PNG · 普通镜头渲染",
        padding: "外围留白",
        paddingHint: "在已放置机器外额外保留的格数",
        scale: "渲染倍率",
        budget: "图片预算",
        items: "包含传送带上的物品",
        pause: "渲染期间暂停模拟",
        inspect: "机器范围",
        selectArea: "选择地图区域",
        capture: "导出 PNG",
        cancel: "取消",
        noFactory: "未在普通层检测到已放置的机器。",
        machineArea: "机器范围",
        selectedArea: "地图选区",
        exportArea: "截图范围",
        output: "输出尺寸",
        scaleResult: "实际倍率",
        chunks: "分块数量",
        waiting: "先分析已放置机器的范围，再导出截图。",
        ready: "已就绪。截图会分块渲染与拼接，避免长时间卡住界面。",
        selectionArmed: "选区已准备：缩小进入地图总览后，用左键拖拽一个矩形范围。",
        selectionRequiresMap: "请先缩小进入地图总览，再用左键拖拽选择区域。",
        selectionReady: "已选中地图区域：{w} × {h} 格。将严格按拖拽范围导出，不添加外围留白。",
        selectionCancelled: "已取消地图区域选择。",
        selectionExact: "地图选区会严格按拖拽矩形导出；外围留白仅用于机器范围模式。",
        rendering: "正在渲染第 {current}/{total} 块 · {percent}%",
        encoding: "正在编码 PNG…",
        streamingEncode: "正在流式编码 PNG，以保持较小的工作画布…",
        done: "已开始下载 PNG。",
        cancelled: "已取消截图。",
        tooLarge: "该截图范围需要降到 {needed}x 或更低才能符合图片限制。请降低渲染倍率、减少留白，或提高图片预算。",
        allocationFailed: "浏览器无法分配这张图片所需的内存。请降低图片预算或渲染倍率。",
        unavailable: "进入正在运行的存档后才能使用截图工具。",
        layerNote: "PNG 始终按普通工厂层渲染；地图总览只用于框选截图区域。",
        settingsTitle: "工厂区域截图",
        settingsDescription: "以已放置机器的边界加上可配置留白导出 PNG；使用普通镜头渲染路径并分块拼接。",
        settingPadding: "外围留白",
        settingScale: "目标渲染倍率",
        settingBudget: "最大图片预算",
        settingItems: "包含传送带上的动态物品",
        settingPause: "截图时暂停模拟",
    },
};

class CaptureCancelledError extends Error {
    constructor() {
        super("factory-area-snapshot-cancelled");
        this.name = "CaptureCancelledError";
    }
}

class Mod extends shapez.Mod {
    init() {
        this.currentGameState = null;
        this.settingsPanel = null;
        this.pendingSettingsRegistration = false;
        this.elements = {};
        this.panelOpen = false;
        this.lastAnalysis = null;
        this.capture = null;
        this.captureMode = "factory";
        this.selectedArea = null;
        this.selection = {
            armed: false,
            dragging: false,
            root: null,
            startWorld: null,
            currentWorld: null,
        };
        this.statusMessage = "";

        this.settings.paddingTiles = this.normalizePadding(this.settings.paddingTiles);
        this.settings.renderScale = this.normalizeRenderScale(this.settings.renderScale);
        this.settings.maxMegapixels = this.normalizeMegapixels(this.settings.maxMegapixels);
        this.settings.includeMovingItems = this.settings.includeMovingItems !== false;
        this.settings.pauseDuringCapture = this.settings.pauseDuringCapture !== false;

        this.registerCss();
        this.registerSettingsWhenAvailable();
        this.signals.gameStarted.add(root => this.installMapAreaSelection(root), this);
        this.signals.stateEntered.add(state => {
            if (state && state.key === "InGameState") {
                this.currentGameState = state;
                this.registerSettingsWhenAvailable();
                this.installMapAreaSelection(this.getGameRoot());
                this.buildUI();
            } else {
                this.cancelCapture();
                this.cancelMapAreaSelection(true);
                this.currentGameState = null;
                this.destroyUI();
            }
        });
    }

    getGameRoot() {
        return this.currentGameState && this.currentGameState.core && this.currentGameState.core.root;
    }

    detectLocale() {
        try {
            const settings = this.currentGameState && this.currentGameState.app && this.currentGameState.app.settings;
            const all = settings && (typeof settings.getAllSettings === "function" ? settings.getAllSettings() : settings);
            const language = String(all && all.language || "").toLowerCase();
            if (language === "zh" || language.indexOf("zh-") === 0 || language.indexOf("zh_") === 0) return "zh";
            if (language && language !== "auto-detect") return "en";
        } catch (error) { }
        try {
            const languages = navigator.languages || [navigator.language];
            for (const language of languages) {
                if (String(language || "").toLowerCase().indexOf("zh") === 0) return "zh";
            }
        } catch (error) { }
        return "en";
    }

    t(key, variables) {
        const locale = this.detectLocale();
        let value = (STRINGS[locale] && STRINGS[locale][key]) || STRINGS.en[key] || key;
        if (variables) {
            for (const [name, replacement] of Object.entries(variables)) {
                value = value.split("{" + name + "}").join(String(replacement));
            }
        }
        return value;
    }

    normalizePadding(value) {
        const number = Math.round(Number(value));
        if (!Number.isFinite(number)) return DEFAULT_PADDING_TILES;
        return Math.max(MIN_PADDING_TILES, Math.min(MAX_PADDING_TILES, number));
    }

    normalizeRenderScale(value) {
        const number = Number(value);
        if (!Number.isFinite(number)) return DEFAULT_RENDER_SCALE;
        return Math.max(MIN_RENDER_SCALE, Math.min(MAX_RENDER_SCALE, Math.round(number * 100) / 100));
    }

    normalizeMegapixels(value) {
        const number = Math.round(Number(value));
        if (!Number.isFinite(number)) return DEFAULT_MAX_MEGAPIXELS;
        return Math.max(MIN_MAX_MEGAPIXELS, Math.min(MAX_MAX_MEGAPIXELS, number));
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
        if (this.pendingSettingsRegistration) return;
        this.pendingSettingsRegistration = true;
        const pending = globalThis.ShapezStructuredSettingsPending
            || (globalThis.ShapezStructuredSettingsPending = []);
        pending.push(nextApi => {
            this.pendingSettingsRegistration = false;
            if (nextApi && typeof nextApi.register === "function") this.registerStructuredSettings(nextApi);
        });
    }

    registerStructuredSettings(api) {
        if (this.settingsPanel) return;
        this.settingsPanel = api.register({
            id: METADATA.id,
            title: { en: STRINGS.en.settingsTitle, zh: STRINGS.zh.settingsTitle },
            description: { en: STRINGS.en.settingsDescription, zh: STRINGS.zh.settingsDescription },
            fields: [
                {
                    id: "paddingTiles",
                    type: "number",
                    label: { en: STRINGS.en.settingPadding, zh: STRINGS.zh.settingPadding },
                    description: {
                        en: "Extra empty space outside the outermost placed machines. 0–32 tiles.",
                        zh: "在最外层机器之外额外保留的空白区域。范围：0–32 格。",
                    },
                    min: MIN_PADDING_TILES,
                    max: MAX_PADDING_TILES,
                    step: 1,
                    suffix: "tiles",
                    default: this.settings.paddingTiles,
                    onChange: value => this.applySetting("paddingTiles", value),
                },
                {
                    id: "renderScale",
                    type: "number",
                    label: { en: STRINGS.en.settingScale, zh: STRINGS.zh.settingScale },
                    description: {
                        en: "Pixels per map pixel, from 0.25x to 4x. The image budget can lower this automatically.",
                        zh: "每个地图像素的输出倍率，范围 0.25x–4x；若超过图片预算会自动降低。",
                    },
                    min: MIN_RENDER_SCALE,
                    max: MAX_RENDER_SCALE,
                    step: 0.25,
                    suffix: "x",
                    default: this.settings.renderScale,
                    onChange: value => this.applySetting("renderScale", value),
                },
                {
                    id: "maxMegapixels",
                    type: "number",
                    label: { en: STRINGS.en.settingBudget, zh: STRINGS.zh.settingBudget },
                    description: {
                        en: "PNG budget, 16–1024 MP. At 96 MP and above, compatible browsers stream the PNG in strips instead of holding the final image canvas in memory.",
                        zh: "PNG 图片预算，范围 16–1024 MP。达到 96 MP 后，支持的浏览器会以条带流式编码，不常驻整张最终画布。",
                    },
                    min: MIN_MAX_MEGAPIXELS,
                    max: MAX_MAX_MEGAPIXELS,
                    step: 16,
                    suffix: "MP",
                    default: this.settings.maxMegapixels,
                    onChange: value => this.applySetting("maxMegapixels", value),
                },
                {
                    id: "includeMovingItems",
                    type: "boolean",
                    label: { en: STRINGS.en.settingItems, zh: STRINGS.zh.settingItems },
                    description: {
                        en: "Renders items currently travelling on belts.",
                        zh: "绘制当前正在传送带上运输的物品。",
                    },
                    default: this.settings.includeMovingItems,
                    onChange: value => this.applySetting("includeMovingItems", value),
                },
                {
                    id: "pauseDuringCapture",
                    type: "boolean",
                    label: { en: STRINGS.en.settingPause, zh: STRINGS.zh.settingPause },
                    description: {
                        en: "Keeps all rendered tiles at the same simulation moment, then restores the previous speed.",
                        zh: "让所有分块处于同一模拟时刻；截图结束后恢复原先速度。",
                    },
                    default: this.settings.pauseDuringCapture,
                    onChange: value => this.applySetting("pauseDuringCapture", value),
                },
            ],
        });

        this.settings.paddingTiles = this.normalizePadding(this.settingsPanel.get("paddingTiles"));
        this.settings.renderScale = this.normalizeRenderScale(this.settingsPanel.get("renderScale"));
        this.settings.maxMegapixels = this.normalizeMegapixels(this.settingsPanel.get("maxMegapixels"));
        this.settings.includeMovingItems = this.settingsPanel.get("includeMovingItems") !== false;
        this.settings.pauseDuringCapture = this.settingsPanel.get("pauseDuringCapture") !== false;
    }

    applySetting(key, value) {
        if (key === "paddingTiles") this.settings.paddingTiles = this.normalizePadding(value);
        else if (key === "renderScale") this.settings.renderScale = this.normalizeRenderScale(value);
        else if (key === "maxMegapixels") this.settings.maxMegapixels = this.normalizeMegapixels(value);
        else if (key === "includeMovingItems") this.settings.includeMovingItems = Boolean(value);
        else if (key === "pauseDuringCapture") this.settings.pauseDuringCapture = Boolean(value);
        try { this.saveSettings(); } catch (error) { }
        this.lastAnalysis = null;
        if (this.getGameRoot()) this.analyzeArea(true);
        else this.updateUI();
    }

    getSetting(key) {
        if (this.settingsPanel && typeof this.settingsPanel.get === "function") {
            const value = this.settingsPanel.get(key);
            if (value !== undefined) return value;
        }
        return this.settings[key];
    }

    setSetting(key, value) {
        if (this.settingsPanel && typeof this.settingsPanel.set === "function") {
            this.settingsPanel.set(key, value);
            return;
        }
        this.applySetting(key, value);
    }

    getPaddingTiles() {
        return this.normalizePadding(this.getSetting("paddingTiles"));
    }

    getRenderScale() {
        return this.normalizeRenderScale(this.getSetting("renderScale"));
    }

    getMaxMegapixels() {
        return this.normalizeMegapixels(this.getSetting("maxMegapixels"));
    }

    getIncludeMovingItems() {
        return this.getSetting("includeMovingItems") !== false;
    }

    getPauseDuringCapture() {
        return this.getSetting("pauseDuringCapture") !== false;
    }

    buildUI() {
        this.destroyUI();
        if (typeof document === "undefined" || !document.body) return;

        const container = document.createElement("div");
        container.id = "factory-area-snapshot-root";
        container.innerHTML = `
            <button type="button" class="fas-launcher" aria-expanded="false"></button>
            <section class="fas-panel" hidden>
                <header class="fas-header">
                    <div>
                        <strong class="fas-title"></strong>
                        <span class="fas-subtitle"></span>
                    </div>
                    <button type="button" class="fas-close" aria-label="close">×</button>
                </header>
                <div class="fas-note"></div>
                <div class="fas-controls">
                    <label class="fas-control"><span class="fas-label padding-label"></span><input class="fas-padding" type="range" min="0" max="32" step="1"><output class="fas-padding-value"></output><small class="fas-padding-hint"></small></label>
                    <label class="fas-control"><span class="fas-label scale-label"></span><select class="fas-scale"><option value="0.25">0.25x</option><option value="0.5">0.5x</option><option value="0.75">0.75x</option><option value="1">1x</option><option value="1.5">1.5x</option><option value="2">2x</option><option value="3">3x</option><option value="4">4x</option></select></label>
                    <label class="fas-control"><span class="fas-label budget-label"></span><select class="fas-budget"><option value="16">16 MP</option><option value="32">32 MP</option><option value="48">48 MP</option><option value="64">64 MP</option><option value="96">96 MP</option><option value="128">128 MP</option><option value="192">192 MP</option><option value="256">256 MP</option><option value="384">384 MP</option><option value="512">512 MP</option><option value="768">768 MP</option><option value="1024">1024 MP</option></select></label>
                    <label class="fas-check"><input class="fas-items" type="checkbox"><span class="fas-items-text"></span></label>
                    <label class="fas-check"><input class="fas-pause" type="checkbox"><span class="fas-pause-text"></span></label>
                </div>
                <div class="fas-analysis" aria-live="polite"></div>
                <div class="fas-status" aria-live="polite"></div>
                <footer class="fas-actions">
                    <button type="button" class="fas-analyze"></button>
                    <button type="button" class="fas-select"></button>
                    <button type="button" class="fas-capture" disabled></button>
                    <button type="button" class="fas-cancel" hidden></button>
                </footer>
            </section>`;
        document.body.appendChild(container);

        this.elements = {
            container,
            launcher: container.querySelector(".fas-launcher"),
            panel: container.querySelector(".fas-panel"),
            close: container.querySelector(".fas-close"),
            title: container.querySelector(".fas-title"),
            subtitle: container.querySelector(".fas-subtitle"),
            note: container.querySelector(".fas-note"),
            padding: container.querySelector(".fas-padding"),
            paddingValue: container.querySelector(".fas-padding-value"),
            paddingHint: container.querySelector(".fas-padding-hint"),
            scale: container.querySelector(".fas-scale"),
            budget: container.querySelector(".fas-budget"),
            items: container.querySelector(".fas-items"),
            pause: container.querySelector(".fas-pause"),
            analysis: container.querySelector(".fas-analysis"),
            status: container.querySelector(".fas-status"),
            analyze: container.querySelector(".fas-analyze"),
            select: container.querySelector(".fas-select"),
            capture: container.querySelector(".fas-capture"),
            cancel: container.querySelector(".fas-cancel"),
        };
        const selectionOverlay = document.createElement("div");
        selectionOverlay.id = "factory-area-snapshot-selection";
        selectionOverlay.hidden = true;
        document.body.appendChild(selectionOverlay);
        this.elements.selectionOverlay = selectionOverlay;

        this.elements.launcher.addEventListener("click", () => this.togglePanel());
        this.elements.close.addEventListener("click", () => this.setPanelOpen(false));
        this.elements.padding.addEventListener("input", () => this.setSetting("paddingTiles", this.elements.padding.value));
        this.elements.scale.addEventListener("change", () => this.setSetting("renderScale", this.elements.scale.value));
        this.elements.budget.addEventListener("change", () => this.setSetting("maxMegapixels", this.elements.budget.value));
        this.elements.items.addEventListener("change", () => this.setSetting("includeMovingItems", this.elements.items.checked));
        this.elements.pause.addEventListener("change", () => this.setSetting("pauseDuringCapture", this.elements.pause.checked));
        this.elements.analyze.addEventListener("click", () => this.analyzeFactoryArea());
        this.elements.select.addEventListener("click", () => this.beginMapAreaSelection());
        this.elements.capture.addEventListener("click", () => this.startCapture());
        this.elements.cancel.addEventListener("click", () => this.cancelOperation());

        this.updateUI();
    }

    destroyUI() {
        if (this.elements && this.elements.selectionOverlay && this.elements.selectionOverlay.remove) {
            this.elements.selectionOverlay.remove();
        }
        if (this.elements && this.elements.container && this.elements.container.remove) this.elements.container.remove();
        this.elements = {};
    }

    togglePanel() {
        this.setPanelOpen(!this.panelOpen);
    }

    setPanelOpen(open) {
        this.panelOpen = Boolean(open);
        if (this.panelOpen) this.analyzeArea(true);
        this.updateUI();
    }

    updateUI(statusOverride) {
        const e = this.elements;
        if (!e || !e.container) return;
        const active = Boolean(this.capture && this.capture.active);
        const selecting = Boolean(this.selection && this.selection.armed);
        const analysis = this.lastAnalysis;
        e.launcher.textContent = this.t("launcher");
        e.launcher.title = this.t("open");
        e.launcher.setAttribute("aria-expanded", String(this.panelOpen));
        e.panel.hidden = !this.panelOpen;
        e.title.textContent = this.t("title");
        e.subtitle.textContent = this.t("subtitle");
        e.close.title = this.t("close");
        e.note.textContent = this.t("layerNote");
        e.container.querySelector(".padding-label").textContent = this.t("padding");
        e.container.querySelector(".scale-label").textContent = this.t("scale");
        e.container.querySelector(".budget-label").textContent = this.t("budget");
        const selectedMode = Boolean((analysis && analysis.source === "selection") || this.captureMode === "selection");
        e.paddingHint.textContent = selectedMode ? this.t("selectionExact") : this.t("paddingHint");
        e.padding.value = String(this.getPaddingTiles());
        e.padding.disabled = selectedMode || active;
        e.paddingValue.textContent = this.getPaddingTiles() + " tiles";
        e.scale.value = String(this.getRenderScale());
        e.scale.disabled = active;
        e.budget.value = String(this.getMaxMegapixels());
        e.budget.disabled = active;
        e.items.checked = this.getIncludeMovingItems();
        e.items.disabled = active;
        e.pause.checked = this.getPauseDuringCapture();
        e.pause.disabled = active;
        e.container.querySelector(".fas-items-text").textContent = this.t("items");
        e.container.querySelector(".fas-pause-text").textContent = this.t("pause");
        e.analyze.textContent = this.t("inspect");
        e.select.textContent = this.t("selectArea");
        e.capture.textContent = this.t("capture");
        e.cancel.textContent = this.t("cancel");
        e.analyze.disabled = active;
        e.select.disabled = active;
        e.capture.disabled = active || !analysis || Boolean(analysis.error);
        e.cancel.hidden = !active && !selecting;
        if (active) {
            e.analysis.innerHTML = this.renderAnalysis(this.capture.plan || analysis);
            e.status.textContent = statusOverride || this.capture.status || "";
        } else {
            e.analysis.innerHTML = this.renderAnalysis(analysis);
            e.status.textContent = statusOverride || this.statusMessage || (analysis ? (analysis.error || this.t("ready")) : this.t("waiting"));
        }
    }

    renderAnalysis(analysis) {
        if (!analysis) return "";
        if (analysis.error) return `<span class="fas-error">${this.escapeHtml(analysis.error)}</span>`;
        const machine = analysis.machineBounds;
        const output = analysis.output;
        const area = analysis.bounds;
        return `
            <div><span>${this.escapeHtml(analysis.source === "selection" ? this.t("selectedArea") : this.t("machineArea"))}</span><strong>${machine.w} × ${machine.h}</strong></div>
            <div><span>${this.escapeHtml(this.t("exportArea"))}</span><strong>${area.w} × ${area.h}</strong></div>
            <div><span>${this.escapeHtml(this.t("output"))}</span><strong>${output.widthPx.toLocaleString()} × ${output.heightPx.toLocaleString()}</strong></div>
            <div><span>${this.escapeHtml(this.t("scaleResult"))}</span><strong>${this.formatScale(output.effectiveScale)}x · ${this.formatMegapixels(output.megapixels)} MP</strong></div>
            <div><span>${this.escapeHtml(this.t("chunks"))}</span><strong>${output.tileCountX} × ${output.tileCountY} = ${output.tileCount}</strong></div>`;
    }

    escapeHtml(value) {
        return String(value === undefined || value === null ? "" : value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    formatScale(value) {
        return Math.round(Number(value || 0) * 100) / 100;
    }

    formatMegapixels(value) {
        return Math.round(Number(value || 0) * 10) / 10;
    }

    getStaticEntities(root) {
        if (!root || !root.entityMgr) return [];
        const component = shapez.StaticMapEntityComponent;
        try {
            if (component && typeof root.entityMgr.getAllWithComponent === "function") {
                return root.entityMgr.getAllWithComponent(component) || [];
            }
        } catch (error) { }
        const entities = root.entityMgr.entities || [];
        return entities.filter(entity => entity && entity.components && entity.components.StaticMapEntity);
    }

    computeMachineBounds(root) {
        const entities = this.getStaticEntities(root);
        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;
        let count = 0;
        for (const entity of entities) {
            // Wires have a StaticMapEntity component as well, but the export
            // deliberately mirrors the ordinary factory camera layer.
            if (entity && entity.layer && entity.layer !== "regular") continue;
            const staticMapEntity = entity && entity.components && entity.components.StaticMapEntity;
            if (!staticMapEntity || typeof staticMapEntity.getTileSpaceBounds !== "function") continue;
            let bounds;
            try { bounds = staticMapEntity.getTileSpaceBounds(); } catch (error) { continue; }
            if (!bounds) continue;
            const x = Number(bounds.x);
            const y = Number(bounds.y);
            const w = Number(bounds.w);
            const h = Number(bounds.h);
            if (![x, y, w, h].every(Number.isFinite) || w <= 0 || h <= 0) continue;
            minX = Math.min(minX, x);
            minY = Math.min(minY, y);
            maxX = Math.max(maxX, x + w);
            maxY = Math.max(maxY, y + h);
            count += 1;
        }
        if (!Number.isFinite(minX) || count === 0) return null;
        return { x: minX, y: minY, w: maxX - minX, h: maxY - minY, count };
    }

    calculateRenderPlan(machineBounds, options) {
        const usePadding = !options || options.usePadding !== false;
        const padding = usePadding ? this.normalizePadding(options && options.paddingTiles) : 0;
        const requestedScale = this.normalizeRenderScale(options && options.renderScale);
        const maxMegapixels = this.normalizeMegapixels(options && options.maxMegapixels);
        const bounds = {
            x: machineBounds.x - padding,
            y: machineBounds.y - padding,
            w: machineBounds.w + padding * 2,
            h: machineBounds.h + padding * 2,
        };
        const requestedWidth = Math.ceil(bounds.w * TILE_SIZE * requestedScale);
        const requestedHeight = Math.ceil(bounds.h * TILE_SIZE * requestedScale);
        const maxPixels = maxMegapixels * 1000000;
        // Streamed encoding renders into small tiles and writes PNG rows directly,
        // so its final image is not constrained by a browser Canvas edge. Keep the
        // legacy edge for the direct Canvas fallback only.
        const canStreamPng = typeof CompressionStream === "function";
        const maxOutputEdge = canStreamPng ? MAX_STREAMING_IMAGE_EDGE : MAX_CANVAS_EDGE;
        const reduction = Math.min(
            1,
            maxOutputEdge / Math.max(1, requestedWidth),
            maxOutputEdge / Math.max(1, requestedHeight),
            Math.sqrt(maxPixels / Math.max(1, requestedWidth * requestedHeight))
        );
        const effectiveScale = requestedScale * reduction;
        if (effectiveScale < MIN_RENDER_SCALE - 0.0001) {
            return {
                error: this.t("tooLarge", { needed: this.formatScale(effectiveScale) }),
                machineBounds,
                bounds,
                source: options && options.source === "selection" ? "selection" : "factory",
                output: null,
            };
        }
        const widthPx = Math.max(1, Math.ceil(bounds.w * TILE_SIZE * effectiveScale));
        const heightPx = Math.max(1, Math.ceil(bounds.h * TILE_SIZE * effectiveScale));
        const coreWorldTiles = Math.max(
            MAP_CHUNK_TILES,
            Math.floor(TILE_CORE_TARGET_PX / Math.max(1, TILE_SIZE * effectiveScale * MAP_CHUNK_TILES)) * MAP_CHUNK_TILES
        );
        const coreWidthPx = Math.max(1, Math.round(coreWorldTiles * TILE_SIZE * effectiveScale));
        const tileCountX = Math.ceil(widthPx / coreWidthPx);
        const tileCountY = Math.ceil(heightPx / coreWidthPx);
        return {
            machineBounds,
            bounds,
            padding,
            source: options && options.source === "selection" ? "selection" : "factory",
            requestedScale,
            output: {
                effectiveScale,
                widthPx,
                heightPx,
                megapixels: widthPx * heightPx / 1000000,
                coreWorldTiles,
                coreWidthPx,
                tileCountX,
                tileCountY,
                tileCount: tileCountX * tileCountY,
                canStreamPng,
                maxOutputEdge,
            },
        };
    }

    analyzeArea(silent) {
        const root = this.getGameRoot();
        if (!root) {
            this.lastAnalysis = { error: this.t("unavailable") };
            this.statusMessage = this.lastAnalysis.error;
            this.updateUI();
            return this.lastAnalysis;
        }
        const useSelection = this.captureMode === "selection" && this.selectedArea;
        const machineBounds = useSelection ? this.selectedArea : this.computeMachineBounds(root);
        if (!machineBounds) {
            this.lastAnalysis = { error: this.t("noFactory") };
            this.statusMessage = this.lastAnalysis.error;
            this.updateUI();
            return this.lastAnalysis;
        }
        this.lastAnalysis = this.calculateRenderPlan(machineBounds, {
            paddingTiles: this.getPaddingTiles(),
            renderScale: this.getRenderScale(),
            maxMegapixels: this.getMaxMegapixels(),
            usePadding: !useSelection,
            source: useSelection ? "selection" : "factory",
        });
        if (!this.lastAnalysis.error) {
            this.statusMessage = useSelection
                ? this.t("selectionReady", { w: machineBounds.w, h: machineBounds.h })
                : this.t("ready");
        }
        if (!silent || this.panelOpen) this.updateUI();
        return this.lastAnalysis;
    }

    analyzeFactoryArea() {
        this.captureMode = "factory";
        this.selectedArea = null;
        this.cancelMapAreaSelection(true);
        return this.analyzeArea();
    }

    installMapAreaSelection(root) {
        if (!root || !root.camera || root.__factoryAreaSnapshotSelector) return;
        const selector = {
            down: (position, button) => this.onMapSelectionDown(root, position, button),
            move: position => this.onMapSelectionMove(root, position),
            up: position => this.onMapSelectionUp(root, position),
        };
        root.__factoryAreaSnapshotSelector = selector;
        try {
            root.camera.downPreHandler.add(selector.down, this);
            root.camera.movePreHandler.add(selector.move, this);
            root.camera.upPostHandler.add(selector.up, this);
        } catch (error) {
            console.warn("Factory Area Snapshot: map-area selector could not be attached", error);
        }
        if (root.signals && root.signals.aboutToDestruct) {
            root.signals.aboutToDestruct.add(() => {
                if (this.selection && this.selection.root === root) this.cancelMapAreaSelection(true);
            }, this);
        }
    }

    beginMapAreaSelection() {
        if (this.capture && this.capture.active) return;
        const root = this.getGameRoot();
        if (!root || !root.camera) {
            this.statusMessage = this.t("unavailable");
            this.updateUI();
            return;
        }
        this.installMapAreaSelection(root);
        this.selection.armed = true;
        this.selection.dragging = false;
        this.selection.root = root;
        this.selection.startWorld = null;
        this.selection.currentWorld = null;
        this.statusMessage = this.t("selectionArmed");
        this.updateSelectionOverlay();
        this.updateUI();
    }

    cancelMapAreaSelection(silent) {
        if (!this.selection) return;
        const wasSelecting = this.selection.armed || this.selection.dragging;
        this.selection.armed = false;
        this.selection.dragging = false;
        this.selection.root = null;
        this.selection.startWorld = null;
        this.selection.currentWorld = null;
        this.updateSelectionOverlay();
        if (wasSelecting && !silent) this.statusMessage = this.t("selectionCancelled");
        if (!silent) this.updateUI();
    }

    cancelOperation() {
        if (this.capture && this.capture.active) this.cancelCapture();
        else this.cancelMapAreaSelection();
    }

    getScreenWorldPosition(root, position) {
        if (!root || !root.camera || !position) return null;
        try {
            const world = root.camera.screenToWorld(position);
            if (world && Number.isFinite(world.x) && Number.isFinite(world.y)) return { x: world.x, y: world.y };
        } catch (error) { }
        const camera = root.camera;
        const zoom = Number(camera.zoomLevel) || 1;
        const center = camera.center || { x: 0, y: 0 };
        return {
            x: (Number(position.x) - Number(root.gameWidth || 0) / 2) / zoom + Number(center.x || 0),
            y: (Number(position.y) - Number(root.gameHeight || 0) / 2) / zoom + Number(center.y || 0),
        };
    }

    getSelectedTileBounds(startWorld, endWorld) {
        if (!startWorld || !endWorld) return null;
        const startX = Math.floor(startWorld.x / TILE_SIZE);
        const startY = Math.floor(startWorld.y / TILE_SIZE);
        const endX = Math.floor(endWorld.x / TILE_SIZE);
        const endY = Math.floor(endWorld.y / TILE_SIZE);
        const x = Math.min(startX, endX);
        const y = Math.min(startY, endY);
        return {
            x,
            y,
            w: Math.abs(endX - startX) + 1,
            h: Math.abs(endY - startY) + 1,
            count: 0,
        };
    }

    onMapSelectionDown(root, position, button) {
        if (!this.selection || !this.selection.armed || this.selection.root !== root || button !== "left") return;
        if (!root.camera || !root.camera.getIsMapOverlayActive || !root.camera.getIsMapOverlayActive()) {
            this.statusMessage = this.t("selectionRequiresMap");
            this.updateUI();
            return shapez.STOP_PROPAGATION;
        }
        const world = this.getScreenWorldPosition(root, position);
        if (!world) return shapez.STOP_PROPAGATION;
        this.selection.dragging = true;
        this.selection.startWorld = world;
        this.selection.currentWorld = world;
        this.updateSelectionOverlay();
        return shapez.STOP_PROPAGATION;
    }

    onMapSelectionMove(root, position) {
        if (!this.selection || !this.selection.dragging || this.selection.root !== root) return;
        const world = this.getScreenWorldPosition(root, position);
        if (world) {
            this.selection.currentWorld = world;
            this.updateSelectionOverlay();
        }
        return shapez.STOP_PROPAGATION;
    }

    onMapSelectionUp(root, position) {
        if (!this.selection || !this.selection.dragging || this.selection.root !== root) return;
        const world = this.getScreenWorldPosition(root, position);
        if (world) this.selection.currentWorld = world;
        const bounds = this.getSelectedTileBounds(this.selection.startWorld, this.selection.currentWorld);
        this.selection.armed = false;
        this.selection.dragging = false;
        this.selection.startWorld = null;
        this.selection.currentWorld = null;
        this.updateSelectionOverlay();
        if (!bounds) {
            this.statusMessage = this.t("selectionCancelled");
            this.updateUI();
            return;
        }
        this.selectedArea = bounds;
        this.captureMode = "selection";
        this.analyzeArea();
    }

    getWorldScreenPosition(root, world) {
        if (!root || !root.camera || !world) return null;
        const camera = root.camera;
        try {
            if (shapez.Vector && typeof camera.worldToScreen === "function") {
                const screen = camera.worldToScreen(new shapez.Vector(world.x, world.y));
                if (screen && Number.isFinite(screen.x) && Number.isFinite(screen.y)) return { x: screen.x, y: screen.y };
            }
        } catch (error) { }
        const zoom = Number(camera.zoomLevel) || 1;
        const center = camera.center || { x: 0, y: 0 };
        return {
            x: (world.x - Number(center.x || 0)) * zoom + Number(root.gameWidth || 0) / 2,
            y: (world.y - Number(center.y || 0)) * zoom + Number(root.gameHeight || 0) / 2,
        };
    }

    updateSelectionOverlay() {
        const overlay = this.elements && this.elements.selectionOverlay;
        const selection = this.selection;
        if (!overlay || !selection || !selection.dragging || !selection.root || !selection.startWorld || !selection.currentWorld) {
            if (overlay) overlay.hidden = true;
            return;
        }
        const start = this.getWorldScreenPosition(selection.root, selection.startWorld);
        const current = this.getWorldScreenPosition(selection.root, selection.currentWorld);
        if (!start || !current) {
            overlay.hidden = true;
            return;
        }
        overlay.hidden = false;
        overlay.style.left = Math.min(start.x, current.x) + "px";
        overlay.style.top = Math.min(start.y, current.y) + "px";
        overlay.style.width = Math.max(1, Math.abs(current.x - start.x)) + "px";
        overlay.style.height = Math.max(1, Math.abs(current.y - start.y)) + "px";
    }

    createVisibleRect(x, y, w, h) {
        try {
            if (shapez.Rectangle) return new shapez.Rectangle(x, y, w, h);
        } catch (error) { }
        const rectangle = {
            x, y, w, h,
            left() { return this.x; },
            right() { return this.x + this.w; },
            top() { return this.y; },
            bottom() { return this.y + this.h; },
            allScaled(scale) { return Mod.createFallbackRect(this.x * scale, this.y * scale, this.w * scale, this.h * scale); },
            containsRect(other) {
                if (!other) return false;
                return this.containsRect4Params(other.x, other.y, other.w, other.h);
            },
            containsRect4Params(otherX, otherY, otherW, otherH) {
                return otherX + otherW >= this.x && otherX <= this.x + this.w
                    && otherY + otherH >= this.y && otherY <= this.y + this.h;
            },
            containsPoint(pointX, pointY) {
                return pointX >= this.x && pointX <= this.x + this.w && pointY >= this.y && pointY <= this.y + this.h;
            },
            containsCircle(centerX, centerY, radius) {
                return centerX + radius >= this.x && centerX - radius <= this.x + this.w
                    && centerY + radius >= this.y && centerY - radius <= this.y + this.h;
            },
        };
        return rectangle;
    }

    static createFallbackRect(x, y, w, h) {
        return {
            x, y, w, h,
            left() { return this.x; }, right() { return this.x + this.w; },
            top() { return this.y; }, bottom() { return this.y + this.h; },
            allScaled(scale) { return Mod.createFallbackRect(this.x * scale, this.y * scale, this.w * scale, this.h * scale); },
            containsRect(other) { return this.containsRect4Params(other.x, other.y, other.w, other.h); },
            containsRect4Params(otherX, otherY, otherW, otherH) {
                return otherX + otherW >= this.x && otherX <= this.x + this.w && otherY + otherH >= this.y && otherY <= this.y + this.h;
            },
            containsPoint(pointX, pointY) { return pointX >= this.x && pointX <= this.x + this.w && pointY >= this.y && pointY <= this.y + this.h; },
            containsCircle(centerX, centerY, radius) {
                return centerX + radius >= this.x && centerX - radius <= this.x + this.w && centerY + radius >= this.y && centerY - radius <= this.y + this.h;
            },
        };
    }

    getDesiredAtlasScale(zoom) {
        // shapez 1.x exposes atlas tiers 0.25 / 0.5 / 0.75. The last one is
        // its ORIGINAL_SPRITE_SCALE, not 1.0.
        if (zoom > 0.5) return "0.75";
        if (zoom > 0.35) return "0.5";
        return "0.25";
    }

    createDrawParameters(context, visibleRect, zoom, root) {
        return {
            context,
            visibleRect,
            desiredAtlasScale: this.getDesiredAtlasScale(zoom),
            zoomLevel: zoom,
            root,
        };
    }

    resetRendererDeduplication(root) {
        const systems = root && root.systemMgr && root.systemMgr.systems;
        if (!systems) return;
        for (const system of Object.values(systems)) {
            try {
                if (system && system.drawnUids && typeof system.drawnUids.clear === "function") system.drawnUids.clear();
            } catch (error) { }
        }
    }

    freezeGame(root) {
        const snapshot = { root, speed: null, applied: false, layer: null, layerApplied: false };
        if (!root) return snapshot;
        // The tile renderer follows the normal factory layer even if the user
        // opened the wires layer immediately before exporting. This also keeps
        // belt-item rendering on its regular-camera code path.
        try {
            snapshot.layer = root.currentLayer;
            root.currentLayer = "regular";
            snapshot.layerApplied = true;
        } catch (error) { }
        if (!this.getPauseDuringCapture() || !root.time) return snapshot;
        try {
            const time = root.time;
            snapshot.speed = typeof time.getSpeed === "function" ? time.getSpeed() : time.speed;
            if (shapez.PausedGameSpeed && typeof time.setSpeed === "function") {
                time.setSpeed(new shapez.PausedGameSpeed(root));
                snapshot.applied = true;
            }
        } catch (error) {
            console.warn("Factory Area Snapshot: could not pause simulation", error);
        }
        return snapshot;
    }

    restoreGame(snapshot) {
        if (!snapshot || !snapshot.root) return;
        try {
            if (snapshot.applied && snapshot.root.time && snapshot.speed) {
                snapshot.root.time.setSpeed(snapshot.speed);
            }
        } catch (error) {
            console.warn("Factory Area Snapshot: could not restore simulation speed", error);
        }
        try {
            if (snapshot.layerApplied) snapshot.root.currentLayer = snapshot.layer;
        } catch (error) { }
    }

    async yieldToBrowser() {
        await new Promise(resolve => setTimeout(resolve, CAPTURE_YIELD_MS));
    }

    renderTile(root, plan, tileCanvas, tileContext, destinationX, destinationY, tileWidth, tileHeight) {
        const output = plan.output;
        const zoom = output.effectiveScale;
        const worldStartX = plan.bounds.x * TILE_SIZE + destinationX / zoom;
        const worldStartY = plan.bounds.y * TILE_SIZE + destinationY / zoom;
        const bleedWorld = TILE_BLEED_PX / zoom;
        const visibleRect = this.createVisibleRect(
            worldStartX - bleedWorld,
            worldStartY - bleedWorld,
            tileWidth / zoom + bleedWorld * 2,
            tileHeight / zoom + bleedWorld * 2
        );
        const totalWidth = tileWidth + TILE_BLEED_PX * 2;
        const totalHeight = tileHeight + TILE_BLEED_PX * 2;
        if (tileCanvas.width !== totalWidth) tileCanvas.width = totalWidth;
        if (tileCanvas.height !== totalHeight) tileCanvas.height = totalHeight;
        tileContext.setTransform(1, 0, 0, 1, 0, 0);
        tileContext.clearRect(0, 0, totalWidth, totalHeight);
        tileContext.imageSmoothingEnabled = false;
        tileContext.setTransform(zoom, 0, 0, zoom, TILE_BLEED_PX - worldStartX * zoom, TILE_BLEED_PX - worldStartY * zoom);
        const parameters = this.createDrawParameters(tileContext, visibleRect, zoom, root);
        this.resetRendererDeduplication(root);
        root.map.drawBackground(parameters);
        const beltSystem = root.systemMgr && root.systemMgr.systems && root.systemMgr.systems.belt;
        if (this.getIncludeMovingItems() && beltSystem && typeof beltSystem.drawBeltItems === "function") beltSystem.drawBeltItems(parameters);
        root.map.drawForeground(parameters);
        const hubSystem = root.systemMgr && root.systemMgr.systems && root.systemMgr.systems.hub;
        if (hubSystem && typeof hubSystem.draw === "function") hubSystem.draw(parameters);
        tileContext.setTransform(1, 0, 0, 1, 0, 0);
    }

    async createPngBlob(canvas) {
        if (canvas && typeof canvas.toBlob === "function") {
            const blob = await new Promise(resolve => canvas.toBlob(resolve, "image/png"));
            if (blob) return blob;
        }
        const dataUrl = canvas.toDataURL("image/png");
        const binary = atob(dataUrl.split(",")[1]);
        const bytes = new Uint8Array(binary.length);
        for (let index = 0; index < binary.length; index++) bytes[index] = binary.charCodeAt(index);
        return new Blob([bytes], { type: "image/png" });
    }

    shouldUseStreamingPng(plan) {
        return Boolean(
            plan && plan.output
            && plan.output.canStreamPng
            && (
                plan.output.megapixels >= STREAMING_PNG_MIN_MEGAPIXELS
                || plan.output.widthPx > MAX_CANVAS_EDGE
                || plan.output.heightPx > MAX_CANVAS_EDGE
            )
        );
    }

    getStreamingLayout(plan) {
        const output = plan.output;
        const stripePixelLimit = STREAMING_STRIPE_MAX_MEGAPIXELS * 1000000;
        const memoryBoundStripeHeight = Math.max(1, Math.floor(stripePixelLimit / Math.max(1, output.widthPx)));
        const stripeHeight = Math.min(STREAMING_STRIPE_HEIGHT_PX, memoryBoundStripeHeight, output.heightPx);
        const columns = Math.ceil(output.widthPx / output.coreWidthPx);
        const rows = Math.ceil(output.heightPx / stripeHeight);
        return {
            stripeHeight,
            columns,
            rows,
            tileCount: columns * rows,
        };
    }

    updateCaptureProgress(capture, current, total) {
        const percent = Math.min(100, Math.round(current / Math.max(1, total) * 100));
        capture.status = this.t("rendering", { current, total, percent });
        this.updateUI();
    }

    getPngCrcTable() {
        if (this.pngCrcTable) return this.pngCrcTable;
        const table = new Uint32Array(256);
        for (let index = 0; index < 256; index++) {
            let value = index;
            for (let bit = 0; bit < 8; bit++) value = (value & 1) ? (0xedb88320 ^ (value >>> 1)) : (value >>> 1);
            table[index] = value >>> 0;
        }
        this.pngCrcTable = table;
        return table;
    }

    updatePngCrc(crc, bytes) {
        const table = this.getPngCrcTable();
        let value = crc >>> 0;
        for (let index = 0; index < bytes.length; index++) value = table[(value ^ bytes[index]) & 0xff] ^ (value >>> 8);
        return value >>> 0;
    }

    createPngChunk(type, data) {
        const payload = data instanceof Uint8Array ? data : new Uint8Array(data || 0);
        const typeBytes = new Uint8Array(4);
        for (let index = 0; index < 4; index++) typeBytes[index] = String(type || "").charCodeAt(index) || 0;
        const chunk = new Uint8Array(12 + payload.length);
        const view = new DataView(chunk.buffer);
        view.setUint32(0, payload.length);
        chunk.set(typeBytes, 4);
        chunk.set(payload, 8);
        let crc = this.updatePngCrc(0xffffffff, typeBytes);
        crc = this.updatePngCrc(crc, payload) ^ 0xffffffff;
        view.setUint32(8 + payload.length, crc >>> 0);
        return chunk;
    }

    createPngHeader(width, height) {
        const payload = new Uint8Array(13);
        const view = new DataView(payload.buffer);
        view.setUint32(0, width);
        view.setUint32(4, height);
        payload[8] = 8; // 8-bit channels
        payload[9] = 6; // RGBA
        payload[10] = 0;
        payload[11] = 0;
        payload[12] = 0;
        return this.createPngChunk("IHDR", payload);
    }

    // Builds a valid PNG without ever allocating a full-width × full-height
    // canvas. Only a 512px-tall image strip and one render tile are alive at
    // any time; this is especially valuable for sparse, very wide factories.
    async createStreamedPngBlob(root, plan, tileCanvas, tileContext, capture) {
        const output = plan.output;
        const layout = this.getStreamingLayout(plan);
        const compression = new CompressionStream("deflate");
        const writer = compression.writable.getWriter();
        const reader = compression.readable.getReader();
        const parts = [
            new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]),
            this.createPngHeader(output.widthPx, output.heightPx),
        ];
        const drain = (async () => {
            for (;;) {
                const packet = await reader.read();
                if (packet.done) break;
                if (packet.value && packet.value.length) parts.push(this.createPngChunk("IDAT", packet.value));
            }
        })();
        let tileIndex = 0;
        try {
            for (let outputY = 0; outputY < output.heightPx; outputY += layout.stripeHeight) {
                const stripeHeight = Math.min(layout.stripeHeight, output.heightPx - outputY);
                const stripTiles = [];
                for (let outputX = 0; outputX < output.widthPx; outputX += output.coreWidthPx) {
                    if (capture.cancelled) throw new CaptureCancelledError();
                    const tileWidth = Math.min(output.coreWidthPx, output.widthPx - outputX);
                    this.renderTile(root, plan, tileCanvas, tileContext, outputX, outputY, tileWidth, stripeHeight);
                    const pixels = tileContext.getImageData(
                        TILE_BLEED_PX,
                        TILE_BLEED_PX,
                        tileWidth,
                        stripeHeight
                    ).data;
                    stripTiles.push({ width: tileWidth, pixels });
                    tileIndex += 1;
                    this.updateCaptureProgress(capture, tileIndex, layout.tileCount);
                    await this.yieldToBrowser();
                }

                const rowByteLength = output.widthPx * 4 + 1;
                const scanlines = new Uint8Array(rowByteLength * stripeHeight);
                for (let line = 0; line < stripeHeight; line++) {
                    let destination = line * rowByteLength;
                    scanlines[destination] = 0; // PNG filter: None
                    destination += 1;
                    for (const tile of stripTiles) {
                        const start = line * tile.width * 4;
                        const end = start + tile.width * 4;
                        scanlines.set(tile.pixels.subarray(start, end), destination);
                        destination += tile.width * 4;
                    }
                }
                if (capture.cancelled) throw new CaptureCancelledError();
                await writer.write(scanlines);
            }
            await writer.close();
            await drain;
            parts.push(this.createPngChunk("IEND", new Uint8Array(0)));
            return new Blob(parts, { type: "image/png" });
        } catch (error) {
            try { await writer.abort(error); } catch (abortError) { }
            try { await drain; } catch (drainError) { }
            throw error;
        }
    }

    downloadBlob(blob, filename) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = filename;
        link.style.display = "none";
        document.body.appendChild(link);
        link.click();
        link.remove();
        setTimeout(() => URL.revokeObjectURL(url), 60000);
    }

    getFileStamp() {
        const now = new Date();
        const number = value => String(value).padStart(2, "0");
        return now.getFullYear() + "-" + number(now.getMonth() + 1) + "-" + number(now.getDate())
            + "T" + number(now.getHours()) + "-" + number(now.getMinutes()) + "-" + number(now.getSeconds());
    }

    async startCapture() {
        if (this.capture && this.capture.active) return;
        const root = this.getGameRoot();
        const plan = this.analyzeArea(true);
        if (!root || !plan || plan.error) {
            this.updateUI(plan && plan.error);
            return;
        }

        const streamed = this.shouldUseStreamingPng(plan);
        const streamingLayout = streamed ? this.getStreamingLayout(plan) : null;
        const capture = {
            active: true,
            cancelled: false,
            plan,
            streamed,
            status: this.t("rendering", {
                current: 0,
                total: streamingLayout ? streamingLayout.tileCount : plan.output.tileCount,
                percent: 0,
            }),
        };
        this.capture = capture;
        this.updateUI();
        let finalCanvas = null;
        let tileCanvas = null;
        let freezeSnapshot = null;
        try {
            freezeSnapshot = this.freezeGame(root);
            tileCanvas = document.createElement("canvas");
            const tileContext = tileCanvas.getContext("2d", { alpha: false });
            if (!tileContext) throw new Error("tile-canvas-context-unavailable");
            let blob;
            if (streamed) {
                capture.status = this.t("streamingEncode");
                this.updateUI();
                blob = await this.createStreamedPngBlob(root, plan, tileCanvas, tileContext, capture);
            } else {
                finalCanvas = document.createElement("canvas");
                finalCanvas.width = plan.output.widthPx;
                finalCanvas.height = plan.output.heightPx;
                const finalContext = finalCanvas.getContext("2d", { alpha: false });
                if (!finalContext) throw new Error("final-canvas-context-unavailable");
                finalContext.imageSmoothingEnabled = false;

                let tileIndex = 0;
                for (let outputY = 0; outputY < plan.output.heightPx; outputY += plan.output.coreWidthPx) {
                    const tileHeight = Math.min(plan.output.coreWidthPx, plan.output.heightPx - outputY);
                    for (let outputX = 0; outputX < plan.output.widthPx; outputX += plan.output.coreWidthPx) {
                        if (capture.cancelled) throw new CaptureCancelledError();
                        const tileWidth = Math.min(plan.output.coreWidthPx, plan.output.widthPx - outputX);
                        this.renderTile(root, plan, tileCanvas, tileContext, outputX, outputY, tileWidth, tileHeight);
                        finalContext.drawImage(
                            tileCanvas,
                            TILE_BLEED_PX,
                            TILE_BLEED_PX,
                            tileWidth,
                            tileHeight,
                            outputX,
                            outputY,
                            tileWidth,
                            tileHeight
                        );
                        tileIndex += 1;
                        this.updateCaptureProgress(capture, tileIndex, plan.output.tileCount);
                        await this.yieldToBrowser();
                    }
                }
                if (capture.cancelled) throw new CaptureCancelledError();
                capture.status = this.t("encoding");
                this.updateUI();
                blob = await this.createPngBlob(finalCanvas);
            }
            if (capture.cancelled) throw new CaptureCancelledError();
            this.downloadBlob(
                blob,
                "factory-area-snapshot-" + (plan.source === "selection" ? "region-" : "factory-") + this.getFileStamp() + ".png"
            );
            capture.status = this.t("done");
            this.updateUI(capture.status);
        } catch (error) {
            if (error instanceof CaptureCancelledError || (error && error.name === "CaptureCancelledError")) {
                capture.status = this.t("cancelled");
            } else {
                console.error("Factory Area Snapshot: capture failed", error);
                capture.status = this.t("allocationFailed");
            }
            this.updateUI(capture.status);
        } finally {
            this.restoreGame(freezeSnapshot);
            if (tileCanvas) { tileCanvas.width = 0; tileCanvas.height = 0; }
            if (finalCanvas) { finalCanvas.width = 0; finalCanvas.height = 0; }
            capture.active = false;
            if (this.capture === capture) this.capture = null;
            this.resetRendererDeduplication(root);
            this.updateUI(capture.status);
        }
    }

    cancelCapture() {
        if (this.capture && this.capture.active) this.capture.cancelled = true;
    }

    registerCss() {
        this.modInterface.registerCss(`
            #factory-area-snapshot-root {
                position: fixed;
                top: 12px;
                left: 12px;
                z-index: 10020;
                display: flex;
                flex-direction: column;
                align-items: flex-start;
                gap: 8px;
                pointer-events: none;
                color: #f2f7ff;
                font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", Arial, sans-serif;
                -webkit-font-smoothing: antialiased;
            }
            #factory-area-snapshot-root button,
            #factory-area-snapshot-root input,
            #factory-area-snapshot-root select { pointer-events: auto; font: inherit; }
            #factory-area-snapshot-selection {
                position: fixed;
                z-index: 10019;
                box-sizing: border-box;
                border: 2px solid rgba(110, 231, 255, .96);
                border-radius: 2px;
                background: rgba(55, 177, 255, .17);
                box-shadow: 0 0 0 1px rgba(10, 30, 70, .72), 0 0 22px rgba(87, 218, 255, .48), inset 0 0 18px rgba(82, 218, 255, .13);
                pointer-events: none;
            }
            .fas-launcher {
                min-width: 80px;
                height: 32px;
                padding: 0 12px;
                border: 1px solid rgba(121, 229, 255, 0.52);
                border-radius: 9px;
                background: linear-gradient(135deg, rgba(13, 32, 65, 0.96), rgba(29, 19, 73, 0.96));
                box-shadow: 0 8px 22px rgba(0, 0, 0, 0.33), inset 0 1px 0 rgba(255, 255, 255, 0.12), 0 0 18px rgba(60, 202, 255, 0.18);
                color: #eafbff;
                cursor: pointer;
                font-size: 10px;
                font-weight: 850;
                letter-spacing: .09em;
            }
            .fas-launcher:hover, .fas-launcher[aria-expanded="true"] { border-color: #7ce9ff; background: linear-gradient(135deg, #1b4b81, #4a2d92); }
            .fas-panel {
                width: min(356px, calc(100vw - 24px));
                max-height: calc(100vh - 68px);
                overflow-y: auto;
                box-sizing: border-box;
                padding: 13px;
                border: 1px solid rgba(131, 217, 255, .33);
                border-radius: 15px;
                background: linear-gradient(150deg, rgba(8, 20, 42, .985), rgba(20, 13, 50, .975));
                box-shadow: 0 20px 50px rgba(0, 0, 0, .52), 0 0 34px rgba(77, 159, 255, .14);
                pointer-events: auto;
                scrollbar-width: thin;
                scrollbar-color: rgba(121, 229, 255, .45) transparent;
            }
            .fas-panel[hidden] { display: none; }
            .fas-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; }
            .fas-title { display: block; color: #f4f9ff; font-size: 11px; font-weight: 850; letter-spacing: .105em; }
            .fas-subtitle { display: block; margin-top: 3px; color: #9fb7db; font-size: 8px; font-weight: 700; letter-spacing: .055em; }
            .fas-close { width: 24px; height: 24px; flex: 0 0 auto; padding: 0; border: 1px solid rgba(255,255,255,.14); border-radius: 7px; background: rgba(255,255,255,.06); color: #b9cbeb; cursor: pointer; font-size: 18px !important; line-height: 18px; }
            .fas-close:hover { color: white; background: rgba(255,255,255,.14); }
            .fas-note { margin: 10px 0; padding: 7px 8px; border-left: 2px solid #68d8ff; border-radius: 4px; background: rgba(68, 148, 216, .11); color: #acd1ee; font-size: 9px; line-height: 1.35; }
            .fas-controls { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
            .fas-control { display: flex; min-width: 0; flex-direction: column; gap: 4px; padding: 8px; border: 1px solid rgba(144, 200, 255, .14); border-radius: 9px; background: rgba(5, 13, 31, .36); }
            .fas-control:first-child { grid-column: 1 / -1; }
            .fas-label { color: #adc3e3; font-size: 8px; font-weight: 800; letter-spacing: .07em; }
            .fas-control input[type="range"] { width: 100%; accent-color: #62dfff; cursor: pointer; }
            .fas-control output { color: #f3f8ff; font: 800 13px ui-monospace, SFMono-Regular, Menlo, monospace; }
            .fas-control small { color: #7f9fc5; font-size: 8px; line-height: 1.25; }
            .fas-control select { width: 100%; height: 26px; padding: 0 6px; border: 1px solid rgba(125, 205, 255, .28); border-radius: 6px; background: rgba(21, 38, 74, .82); color: #eef8ff; font-size: 11px; cursor: pointer; }
            .fas-check { grid-column: 1 / -1; display: flex; align-items: center; gap: 7px; color: #c8d8ee; font-size: 10px; cursor: pointer; user-select: none; }
            .fas-check input { width: 14px; height: 14px; margin: 0; accent-color: #60dfff; cursor: pointer; }
            .fas-analysis { display: grid; grid-template-columns: 1fr 1fr; gap: 5px; margin-top: 10px; }
            .fas-analysis > div { min-width: 0; padding: 7px 8px; border: 1px solid rgba(140, 210, 255, .13); border-radius: 7px; background: rgba(4, 10, 25, .45); }
            .fas-analysis span { display: block; color: #90afd2; font-size: 8px; font-weight: 750; letter-spacing: .05em; }
            .fas-analysis strong { display: block; margin-top: 3px; overflow: hidden; color: #f0f8ff; font: 750 11px ui-monospace, SFMono-Regular, Menlo, monospace; text-overflow: ellipsis; white-space: nowrap; }
            .fas-analysis .fas-error { grid-column: 1 / -1; padding: 8px; border: 1px solid rgba(255, 111, 130, .35); border-radius: 8px; background: rgba(125, 22, 49, .23); color: #ffd3dc; font-size: 10px; line-height: 1.4; }
            .fas-status { min-height: 16px; margin-top: 8px; color: #9bc8ee; font-size: 9px; line-height: 1.35; }
            .fas-actions { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 6px; margin-top: 8px; }
            .fas-actions button { min-width: 0; min-height: 29px; padding: 0 7px; border: 1px solid rgba(131, 215, 255, .29); border-radius: 7px; background: rgba(72, 118, 187, .2); color: #e9f7ff; cursor: pointer; font-size: 9px; font-weight: 850; letter-spacing: .04em; }
            .fas-actions button:hover:not(:disabled) { border-color: #75e0ff; background: rgba(57, 146, 213, .46); }
            .fas-actions button:disabled { cursor: default; opacity: .43; }
            .fas-capture { background: linear-gradient(135deg, rgba(31, 152, 185, .72), rgba(75, 73, 190, .72)) !important; }
            .fas-cancel { grid-column: 1 / -1; border-color: rgba(255, 140, 158, .4) !important; background: rgba(155, 36, 71, .36) !important; }
        `);
    }
}
