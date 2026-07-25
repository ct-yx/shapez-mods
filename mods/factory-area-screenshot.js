// @ts-nocheck
const METADATA = {
    website: "https://github.com/ct-yx/shapez-mods",
    author: "ct-yx & Codex",
    name: "Factory Area Snapshot",
    version: "1.8.0",
    id: "factory-area-snapshot",
    description: "Exports high-resolution factory PNGs through density-calibrated, activity-aware capture partitions.",
    minimumGameVersion: ">=1.5.0",
    doesNotAffectSavegame: true,
    settings: {
        paddingTiles: 4,
        maxMegapixels: 64,
        crispSampling: true,
        smartSparseRegions: true,
        includeMovingItems: true,
        pauseDuringCapture: true,
    },
};

const TILE_SIZE = 32;
const DEFAULT_PADDING_TILES = 4;
const MIN_PADDING_TILES = 0;
const MAX_PADDING_TILES = 32;
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
// This density was calibrated from a verified prior 256 MP export of this
// factory. Thirty regular-camera regions at that reference size keep the same
// visual workload as the older, clear 256 MP capture flow.
const BASELINE_CAPTURE_MEGAPIXELS = 256;
const BASELINE_CAPTURE_PARTITIONS = 30;
const MIN_CAPTURE_GRID_CELLS = 1;
const MAX_CAPTURE_GRID_CELLS = 1024;
// Above this zoom, shapez uses the same sprite-atlas tier and only filters it.
// Render a crisp native source, then let the GPU scale it during final composition.
const MAX_SHARP_SOURCE_SCALE = 1;
// Empty/original map regions are rendered from this lower source resolution,
// then nearest-neighbour composed into the final PNG. Constructed regions stay
// at the normal crisp source scale.
const MIN_SPARSE_SOURCE_SCALE = 0.5;
const ACTIVITY_MARGIN_TILES = 2;

const STRINGS = {
    en: {
        launcher: "SNAPSHOT",
        open: "Open factory snapshot",
        close: "Close",
        title: "FACTORY AREA SNAPSHOT",
        subtitle: "TILED HIGH-RES PNG · REGULAR CAMERA RENDER",
        padding: "Outer padding",
        paddingHint: "tiles beyond placed machines",
        resolution: "Target resolution",
        resolutionHint: "total output pixels · render scale is automatic",
        tileUnit: "tiles",
        crispSampling: "Crisp pixel sampling",
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
        scaleResult: "Output render scale",
        sourceScale: "Crisp source / output",
        chunks: "Capture partitions",
        partitionTarget: "target {count}",
        activity: "Built / sparse regions",
        activityValue: "{active} / {sparse}",
        waiting: "Analyze the placed factory area before exporting.",
        ready: "Ready. Rendering uses density-calibrated, aspect-aware capture partitions.",
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
        tooLarge: "This export area exceeds the available image limit.",
        allocationFailed: "The browser could not allocate this image. Try a lower target resolution.",
        unavailable: "Enter a running game to use the snapshot tool.",
        layerNote: "The PNG always uses the regular factory render; Map Overview is only used to choose an area.",
        settingsTitle: "Factory Area Snapshot",
        settingsDescription: "Exports the bounds of placed machines with a configurable safety margin. Capture partitions are calibrated from the 256 MP reference density and use a GPU-preferred canvas pipeline.",
        settingPadding: "Outer padding",
        settingResolution: "Target output resolution",
        settingCrispSampling: "Crisp pixel sampling",
        settingSmartSparseRegions: "Smart sparse regions",
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
        resolution: "目标分辨率",
        resolutionHint: "总输出像素 · 渲染倍率自动计算",
        tileUnit: "格",
        crispSampling: "清晰像素采样",
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
        scaleResult: "最终渲染倍率",
        sourceScale: "清晰源 / 最终倍率",
        chunks: "分区捕获",
        partitionTarget: "目标 {count}",
        activity: "建造 / 稀疏分区",
        activityValue: "{active} / {sparse}",
        waiting: "先分析已放置机器的范围，再导出截图。",
        ready: "已就绪。截图将按 256 MP 基准密度和长宽比划分分区进行渲染与拼接。",
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
        tooLarge: "该截图范围超过可用图片限制。",
        allocationFailed: "浏览器无法分配这张图片所需的内存。请降低目标分辨率。",
        unavailable: "进入正在运行的存档后才能使用截图工具。",
        layerNote: "PNG 始终按普通工厂层渲染；地图总览只用于框选截图区域。",
        settingsTitle: "工厂区域截图",
        settingsDescription: "以已放置机器的边界加上可配置留白导出 PNG；分区数量按 256 MP 基准密度计算，并使用 GPU 偏好的 Canvas 渲染流程。",
        settingPadding: "外围留白",
        settingResolution: "目标输出分辨率",
        settingCrispSampling: "清晰像素采样",
        settingSmartSparseRegions: "智能稀疏分区",
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
        this.settings.maxMegapixels = this.normalizeMegapixels(this.settings.maxMegapixels);
        this.settings.crispSampling = this.settings.crispSampling !== false;
        this.settings.smartSparseRegions = this.settings.smartSparseRegions !== false;
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
                    id: "maxMegapixels",
                    type: "number",
                    label: { en: STRINGS.en.settingResolution, zh: STRINGS.zh.settingResolution },
                    description: {
                        en: "Total output pixels: 16–1024 MP. Render scale is calculated from the selected resolution and current export area.",
                        zh: "总输出像素：16–1024 MP。渲染倍率会根据所选分辨率和当前截图范围自动计算。",
                    },
                    min: MIN_MAX_MEGAPIXELS,
                    max: MAX_MAX_MEGAPIXELS,
                    step: 16,
                    suffix: "MP",
                    default: this.settings.maxMegapixels,
                    onChange: value => this.applySetting("maxMegapixels", value),
                },
                {
                    id: "crispSampling",
                    type: "boolean",
                    label: { en: STRINGS.en.settingCrispSampling, zh: STRINGS.zh.settingCrispSampling },
                    description: {
                        en: "Forces nearest-neighbor sampling for the game's sprite and cached-map draws. Keeps high-resolution exports sharp instead of filtering enlarged sprites.",
                        zh: "对游戏精灵图和缓存地图绘制强制使用最近邻采样；高分辨率导出会保持清晰的像素边缘，而不是平滑放大后变糊。",
                    },
                    default: this.settings.crispSampling,
                    onChange: value => this.applySetting("crispSampling", value),
                },
                {
                    id: "smartSparseRegions",
                    type: "boolean",
                    label: { en: STRINGS.en.settingSmartSparseRegions, zh: STRINGS.zh.settingSmartSparseRegions },
                    description: {
                        en: "Prioritizes placed-machine regions. Empty or original map regions use a lower source resolution before nearest-neighbor composition, reducing render work and helping PNG compression.",
                        zh: "优先保证放置机器区域的清晰度。未放置机器的空白或原生区域会以较低源分辨率渲染后再最近邻合成，从而减少渲染工作并提高 PNG 压缩空间。",
                    },
                    default: this.settings.smartSparseRegions,
                    onChange: value => this.applySetting("smartSparseRegions", value),
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
        this.settings.maxMegapixels = this.normalizeMegapixels(this.settingsPanel.get("maxMegapixels"));
        this.settings.crispSampling = this.settingsPanel.get("crispSampling") !== false;
        this.settings.smartSparseRegions = this.settingsPanel.get("smartSparseRegions") !== false;
        this.settings.includeMovingItems = this.settingsPanel.get("includeMovingItems") !== false;
        this.settings.pauseDuringCapture = this.settingsPanel.get("pauseDuringCapture") !== false;
    }

    applySetting(key, value) {
        if (key === "paddingTiles") this.settings.paddingTiles = this.normalizePadding(value);
        else if (key === "maxMegapixels") this.settings.maxMegapixels = this.normalizeMegapixels(value);
        else if (key === "crispSampling") this.settings.crispSampling = Boolean(value);
        else if (key === "smartSparseRegions") this.settings.smartSparseRegions = Boolean(value);
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

    getMaxMegapixels() {
        return this.normalizeMegapixels(this.getSetting("maxMegapixels"));
    }

    getCrispSampling() {
        return this.getSetting("crispSampling") !== false;
    }

    getSmartSparseRegions() {
        return this.getSetting("smartSparseRegions") !== false;
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
                    <span class="fas-mark" aria-hidden="true">▣</span>
                    <div class="fas-heading">
                        <strong class="fas-title"></strong>
                        <span class="fas-subtitle"></span>
                    </div>
                    <button type="button" class="fas-close" aria-label="close">×</button>
                </header>
                <div class="fas-note"></div>
                <div class="fas-controls">
                    <label class="fas-control fas-padding-control"><span class="fas-label padding-label"></span><input class="fas-padding" type="range" min="0" max="32" step="1"><output class="fas-padding-value"></output><small class="fas-padding-hint"></small></label>
                    <label class="fas-control fas-resolution-control"><span class="fas-label resolution-label"></span><select class="fas-resolution"><option value="16">16 MP</option><option value="32">32 MP</option><option value="48">48 MP</option><option value="64">64 MP</option><option value="96">96 MP</option><option value="128">128 MP</option><option value="192">192 MP</option><option value="256">256 MP</option><option value="384">384 MP</option><option value="512">512 MP</option><option value="768">768 MP</option><option value="1024">1024 MP</option></select><small class="fas-resolution-hint"></small></label>
                    <label class="fas-check fas-crisp-check"><input class="fas-crisp" type="checkbox"><span class="fas-crisp-text"></span></label>
                    <label class="fas-check fas-sparse-check"><input class="fas-sparse" type="checkbox"><span class="fas-sparse-text"></span></label>
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
            resolution: container.querySelector(".fas-resolution"),
            resolutionHint: container.querySelector(".fas-resolution-hint"),
            crisp: container.querySelector(".fas-crisp"),
            sparse: container.querySelector(".fas-sparse"),
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
        this.elements.resolution.addEventListener("change", () => this.setSetting("maxMegapixels", this.elements.resolution.value));
        this.elements.crisp.addEventListener("change", () => this.setSetting("crispSampling", this.elements.crisp.checked));
        this.elements.sparse.addEventListener("change", () => this.setSetting("smartSparseRegions", this.elements.sparse.checked));
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
        e.container.querySelector(".resolution-label").textContent = this.t("resolution");
        e.resolutionHint.textContent = this.t("resolutionHint");
        const selectedMode = Boolean((analysis && analysis.source === "selection") || this.captureMode === "selection");
        e.paddingHint.textContent = selectedMode ? this.t("selectionExact") : this.t("paddingHint");
        e.padding.value = String(this.getPaddingTiles());
        e.padding.disabled = selectedMode || active;
        e.paddingValue.textContent = this.getPaddingTiles() + " " + this.t("tileUnit");
        e.resolution.value = String(this.getMaxMegapixels());
        e.resolution.disabled = active;
        e.crisp.checked = this.getCrispSampling();
        e.crisp.disabled = active;
        e.sparse.checked = this.getSmartSparseRegions();
        e.sparse.disabled = active || !this.getCrispSampling();
        e.items.checked = this.getIncludeMovingItems();
        e.items.disabled = active;
        e.pause.checked = this.getPauseDuringCapture();
        e.pause.disabled = active;
        e.container.querySelector(".fas-crisp-text").textContent = this.t("crispSampling");
        e.container.querySelector(".fas-sparse-text").textContent = this.t("settingSmartSparseRegions");
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
        const activity = output.activity;
        const activityRow = activity
            ? `<div><span>${this.escapeHtml(this.t("activity"))}</span><strong>${this.escapeHtml(this.t("activityValue", { active: activity.activeCount, sparse: activity.sparseCount }))}</strong></div>`
            : "";
        return `
            <div><span>${this.escapeHtml(analysis.source === "selection" ? this.t("selectedArea") : this.t("machineArea"))}</span><strong>${machine.w} × ${machine.h}</strong></div>
            <div><span>${this.escapeHtml(this.t("exportArea"))}</span><strong>${area.w} × ${area.h}</strong></div>
            <div><span>${this.escapeHtml(this.t("output"))}</span><strong>${output.widthPx.toLocaleString()} × ${output.heightPx.toLocaleString()}</strong></div>
            <div><span>${this.escapeHtml(this.t("scaleResult"))}</span><strong>${this.formatScale(output.effectiveScale)}x · ${this.formatMegapixels(output.megapixels)} MP</strong></div>
            <div><span>${this.escapeHtml(this.t("sourceScale"))}</span><strong>${this.formatScale(output.sourceScale)}x → ${this.formatScale(output.effectiveScale)}x</strong></div>
            <div><span>${this.escapeHtml(this.t("chunks"))}</span><strong>${output.captureGrid.columns} × ${output.captureGrid.rows} = ${output.captureGrid.count} · ${this.escapeHtml(this.t("partitionTarget", { count: output.captureGrid.preferred }))}</strong></div>
            ${activityRow}`;
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

    getRegularStaticEntityBounds(entity) {
        // Generated resource patches are not regular-layer StaticMapEntities;
        // this intentionally tracks the placed factory objects that need detail.
        if (entity && entity.layer && entity.layer !== "regular") return null;
        const staticMapEntity = entity && entity.components && entity.components.StaticMapEntity;
        if (!staticMapEntity || typeof staticMapEntity.getTileSpaceBounds !== "function") return null;
        let bounds;
        try { bounds = staticMapEntity.getTileSpaceBounds(); } catch (error) { return null; }
        if (!bounds) return null;
        const x = Number(bounds.x);
        const y = Number(bounds.y);
        const w = Number(bounds.w);
        const h = Number(bounds.h);
        if (![x, y, w, h].every(Number.isFinite) || w <= 0 || h <= 0) return null;
        return { x, y, w, h };
    }

    getPlacedEntityBounds(root) {
        const bounds = [];
        for (const entity of this.getStaticEntities(root)) {
            const entityBounds = this.getRegularStaticEntityBounds(entity);
            if (entityBounds) bounds.push(entityBounds);
        }
        return bounds;
    }

    computeMachineBounds(root) {
        const entities = this.getPlacedEntityBounds(root);
        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;
        let count = 0;
        for (const bounds of entities) {
            minX = Math.min(minX, bounds.x);
            minY = Math.min(minY, bounds.y);
            maxX = Math.max(maxX, bounds.x + bounds.w);
            maxY = Math.max(maxY, bounds.y + bounds.h);
            count += 1;
        }
        if (!Number.isFinite(minX) || count === 0) return null;
        return { x: minX, y: minY, w: maxX - minX, h: maxY - minY, count };
    }

    buildActivityMap(root, plan) {
        if (!root || !plan || !plan.output || !plan.output.captureGrid) return null;
        const grid = plan.output.captureGrid;
        const total = grid.columns * grid.rows;
        const active = new Uint8Array(total);
        const bounds = plan.bounds;
        if (!bounds || !bounds.w || !bounds.h) return { active, activeCount: 0, sparseCount: total };
        for (const entity of this.getPlacedEntityBounds(root)) {
            const left = entity.x - ACTIVITY_MARGIN_TILES;
            const top = entity.y - ACTIVITY_MARGIN_TILES;
            const right = entity.x + entity.w + ACTIVITY_MARGIN_TILES;
            const bottom = entity.y + entity.h + ACTIVITY_MARGIN_TILES;
            if (right <= bounds.x || bottom <= bounds.y || left >= bounds.x + bounds.w || top >= bounds.y + bounds.h) continue;
            const startX = Math.max(0, Math.floor((left - bounds.x) / bounds.w * grid.columns));
            const startY = Math.max(0, Math.floor((top - bounds.y) / bounds.h * grid.rows));
            const endX = Math.min(grid.columns - 1, Math.ceil((right - bounds.x) / bounds.w * grid.columns) - 1);
            const endY = Math.min(grid.rows - 1, Math.ceil((bottom - bounds.y) / bounds.h * grid.rows) - 1);
            for (let gridY = startY; gridY <= endY; gridY++) {
                for (let gridX = startX; gridX <= endX; gridX++) active[gridY * grid.columns + gridX] = 1;
            }
        }
        let activeCount = 0;
        for (const value of active) activeCount += value;
        return { active, activeCount, sparseCount: total - activeCount };
    }

    calculateRenderPlan(machineBounds, options) {
        const usePadding = !options || options.usePadding !== false;
        const padding = usePadding ? this.normalizePadding(options && options.paddingTiles) : 0;
        const maxMegapixels = this.normalizeMegapixels(options && options.maxMegapixels);
        const bounds = {
            x: machineBounds.x - padding,
            y: machineBounds.y - padding,
            w: machineBounds.w + padding * 2,
            h: machineBounds.h + padding * 2,
        };
        const baseWidthPx = Math.max(1, bounds.w * TILE_SIZE);
        const baseHeightPx = Math.max(1, bounds.h * TILE_SIZE);
        const maxPixels = maxMegapixels * 1000000;
        // Resolution is the only user-facing quality setting. Work out the zoom
        // that fills the chosen total pixel target for this exact export area.
        const requestedScale = Math.sqrt(maxPixels / (baseWidthPx * baseHeightPx));
        const requestedWidth = Math.ceil(baseWidthPx * requestedScale);
        const requestedHeight = Math.ceil(baseHeightPx * requestedScale);
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
        // Floor the final dimensions so the selected MP value remains a strict
        // upper bound rather than being exceeded by pixel rounding.
        const widthPx = Math.max(1, Math.floor(baseWidthPx * effectiveScale));
        const heightPx = Math.max(1, Math.floor(baseHeightPx * effectiveScale));
        // Tiles do not need to coincide with map chunks. This keeps individual
        // temporary canvases near 2048 px even for a tiny area exported at 1 GP.
        const coreWidthPx = Math.max(1, Math.min(TILE_CORE_TARGET_PX, widthPx, heightPx));
        const coreWorldTiles = coreWidthPx / Math.max(1e-9, TILE_SIZE * effectiveScale);
        const tileCountX = Math.ceil(widthPx / coreWidthPx);
        const tileCountY = Math.ceil(heightPx / coreWidthPx);
        // A high-res output must not ask shapez to smooth the same atlas pixels
        // again and again. Draw one native-quality source then use a nearest-
        // neighbour GPU canvas blit to reach the requested final pixel grid.
        // Turning crisp sampling off intentionally restores the game's original
        // direct-at-output-scale path.
        const sourceScale = this.getCrispSampling()
            ? Math.min(effectiveScale, MAX_SHARP_SOURCE_SCALE)
            : effectiveScale;
        const actualMegapixels = widthPx * heightPx / 1000000;
        const captureGrid = this.createCaptureGrid(widthPx, heightPx, actualMegapixels);
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
                megapixels: actualMegapixels,
                coreWorldTiles,
                coreWidthPx,
                tileCountX,
                tileCountY,
                tileCount: tileCountX * tileCountY,
                sourceScale,
                captureGrid,
                activity: null,
                canStreamPng,
                maxOutputEdge,
            },
        };
    }


    getCaptureGridRange(megapixels) {
        // Keep the same capture density as the old 256 MP image split into
        // about 30 regions. This makes the requested quality scale linearly:
        // 256 MP -> about 30 partitions; 1024 MP -> about 120. A small window
        // around the ideal count lets wide/tall factories choose a useful grid.
        const preferred = Math.min(
            MAX_CAPTURE_GRID_CELLS,
            Math.max(1, Math.ceil(Math.max(1, megapixels) * BASELINE_CAPTURE_PARTITIONS / BASELINE_CAPTURE_MEGAPIXELS))
        );
        const tolerance = Math.max(1, Math.ceil(preferred * 0.15));
        return {
            min: Math.max(MIN_CAPTURE_GRID_CELLS, preferred - tolerance),
            max: Math.min(MAX_CAPTURE_GRID_CELLS, preferred + tolerance),
            preferred,
        };
    }

    createCaptureGrid(widthPx, heightPx, megapixels) {
        const range = this.getCaptureGridRange(megapixels);
        const aspect = Math.max(0.01, widthPx / Math.max(1, heightPx));
        let best = null;
        const consider = (columns, rows, count) => {
            const ratioPenalty = Math.abs(Math.log((columns / rows) / aspect));
            const densityPenalty = Math.abs(count - range.preferred) / range.preferred * 2;
            const score = ratioPenalty + densityPenalty;
            if (!best || score < best.score) best = { columns, rows, count, score, preferred: range.preferred };
        };
        // Enumerate only the factor pairs instead of a 1024 × 1024 brute-force
        // scan. The hard 1024-partition cap therefore has negligible UI cost.
        for (let count = range.min; count <= range.max; count++) {
            for (let rows = 1; rows * rows <= count; rows++) {
                if (count % rows !== 0) continue;
                const columns = count / rows;
                consider(columns, rows, count);
                if (columns !== rows) consider(rows, columns, count);
            }
        }
        return best || { columns: 1, rows: 1, count: 1, score: 0, preferred: 1 };
    }

    getGridBoundary(size, index, count) {
        return Math.floor(size * index / count);
    }

    getCaptureGridCell(plan, destinationX, destinationY) {
        const output = plan && plan.output;
        const grid = output && output.captureGrid;
        if (!output || !grid || !grid.columns || !grid.rows) return -1;
        const gridX = Math.max(0, Math.min(grid.columns - 1, Math.floor(destinationX / Math.max(1, output.widthPx) * grid.columns)));
        const gridY = Math.max(0, Math.min(grid.rows - 1, Math.floor(destinationY / Math.max(1, output.heightPx) * grid.rows)));
        return gridY * grid.columns + gridX;
    }

    isSparseCaptureTile(plan, destinationX, destinationY) {
        if (!this.getSmartSparseRegions() || !this.getCrispSampling()) return false;
        const activity = plan && plan.output && plan.output.activity;
        const cell = this.getCaptureGridCell(plan, destinationX, destinationY);
        return Boolean(activity && activity.active && cell >= 0 && activity.active[cell] === 0);
    }

    getCaptureTileSourceScale(plan, destinationX, destinationY) {
        const output = plan.output;
        const regularScale = output.sourceScale || output.effectiveScale;
        if (!this.isSparseCaptureTile(plan, destinationX, destinationY)) return regularScale;
        return Math.min(regularScale, Math.max(MIN_SPARSE_SOURCE_SCALE, regularScale * 0.5));
    }

    needsScaleCanvas(plan) {
        const output = plan && plan.output;
        if (!output) return false;
        if (output.sourceScale < output.effectiveScale - 0.0001) return true;
        const activity = output.activity;
        return Boolean(
            this.getSmartSparseRegions()
            && this.getCrispSampling()
            && activity
            && activity.sparseCount > 0
            && Math.min(output.sourceScale || output.effectiveScale, Math.max(MIN_SPARSE_SOURCE_SCALE, (output.sourceScale || output.effectiveScale) * 0.5)) < output.effectiveScale - 0.0001
        );
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
            maxMegapixels: this.getMaxMegapixels(),
            usePadding: !useSelection,
            source: useSelection ? "selection" : "factory",
        });
        this.lastAnalysis.output.activity = this.buildActivityMap(root, this.lastAnalysis);
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

    withCrispSampling(context, draw) {
        if (!this.getCrispSampling() || !context) return draw();
        const previousSmoothing = context.imageSmoothingEnabled;
        const previousWebkitSmoothing = context.webkitImageSmoothingEnabled;
        const originalDrawImage = typeof context.drawImage === "function" ? context.drawImage : null;
        let patchedDrawImage = false;
        const forceNearest = () => {
            context.imageSmoothingEnabled = false;
            if ("webkitImageSmoothingEnabled" in context) context.webkitImageSmoothingEnabled = false;
        };
        forceNearest();
        // Several shapez map paths enable smoothing around cached buffers. Patch
        // only this temporary export context so every actual blit stays crisp.
        if (originalDrawImage) {
            try {
                context.drawImage = function (...args) {
                    forceNearest();
                    return originalDrawImage.apply(this, args);
                };
                patchedDrawImage = context.drawImage !== originalDrawImage;
            } catch (error) { }
        }
        try {
            return draw();
        } finally {
            if (patchedDrawImage) {
                try { context.drawImage = originalDrawImage; } catch (error) { }
            }
            context.imageSmoothingEnabled = previousSmoothing;
            if ("webkitImageSmoothingEnabled" in context) context.webkitImageSmoothingEnabled = previousWebkitSmoothing;
        }
    }

    readTilePixels(renderCanvas, readbackCanvas, readbackContext, tileWidth, tileHeight) {
        if (!readbackCanvas || !readbackContext) return null;
        if (readbackCanvas.width !== tileWidth) readbackCanvas.width = tileWidth;
        if (readbackCanvas.height !== tileHeight) readbackCanvas.height = tileHeight;
        readbackContext.setTransform(1, 0, 0, 1, 0, 0);
        readbackContext.imageSmoothingEnabled = false;
        if ("webkitImageSmoothingEnabled" in readbackContext) readbackContext.webkitImageSmoothingEnabled = false;
        readbackContext.clearRect(0, 0, tileWidth, tileHeight);
        readbackContext.drawImage(
            renderCanvas,
            TILE_BLEED_PX,
            TILE_BLEED_PX,
            tileWidth,
            tileHeight,
            0,
            0,
            tileWidth,
            tileHeight
        );
        return readbackContext.getImageData(0, 0, tileWidth, tileHeight).data;
    }

    renderTileAtScale(root, plan, tileCanvas, tileContext, destinationX, destinationY, tileWidth, tileHeight, renderScale) {
        const output = plan.output;
        const finalScale = output.effectiveScale;
        const zoom = Math.max(1e-6, renderScale);
        const worldStartX = plan.bounds.x * TILE_SIZE + destinationX / finalScale;
        const worldStartY = plan.bounds.y * TILE_SIZE + destinationY / finalScale;
        const worldWidth = tileWidth / finalScale;
        const worldHeight = tileHeight / finalScale;
        const coreWidth = Math.max(1, Math.ceil(worldWidth * zoom));
        const coreHeight = Math.max(1, Math.ceil(worldHeight * zoom));
        const bleedWorld = TILE_BLEED_PX / zoom;
        const visibleRect = this.createVisibleRect(
            worldStartX - bleedWorld,
            worldStartY - bleedWorld,
            worldWidth + bleedWorld * 2,
            worldHeight + bleedWorld * 2
        );
        const totalWidth = coreWidth + TILE_BLEED_PX * 2;
        const totalHeight = coreHeight + TILE_BLEED_PX * 2;
        if (tileCanvas.width !== totalWidth) tileCanvas.width = totalWidth;
        if (tileCanvas.height !== totalHeight) tileCanvas.height = totalHeight;
        tileContext.setTransform(1, 0, 0, 1, 0, 0);
        tileContext.clearRect(0, 0, totalWidth, totalHeight);
        tileContext.imageSmoothingEnabled = false;
        if ("webkitImageSmoothingEnabled" in tileContext) tileContext.webkitImageSmoothingEnabled = false;
        tileContext.setTransform(zoom, 0, 0, zoom, TILE_BLEED_PX - worldStartX * zoom, TILE_BLEED_PX - worldStartY * zoom);
        const parameters = this.createDrawParameters(tileContext, visibleRect, zoom, root);
        this.resetRendererDeduplication(root);
        this.withCrispSampling(tileContext, () => {
            root.map.drawBackground(parameters);
            const beltSystem = root.systemMgr && root.systemMgr.systems && root.systemMgr.systems.belt;
            if (this.getIncludeMovingItems() && beltSystem && typeof beltSystem.drawBeltItems === "function") beltSystem.drawBeltItems(parameters);
            root.map.drawForeground(parameters);
            const hubSystem = root.systemMgr && root.systemMgr.systems && root.systemMgr.systems.hub;
            if (hubSystem && typeof hubSystem.draw === "function") hubSystem.draw(parameters);
        });
        tileContext.setTransform(1, 0, 0, 1, 0, 0);
        return { coreWidth, coreHeight };
    }

    renderTile(root, plan, tileCanvas, tileContext, destinationX, destinationY, tileWidth, tileHeight) {
        return this.renderTileAtScale(
            root,
            plan,
            tileCanvas,
            tileContext,
            destinationX,
            destinationY,
            tileWidth,
            tileHeight,
            plan.output.effectiveScale
        );
    }

    renderCaptureTile(root, plan, tileCanvas, tileContext, scaleCanvas, scaleContext, destinationX, destinationY, tileWidth, tileHeight) {
        const output = plan.output;
        const sourceScale = this.getCaptureTileSourceScale(plan, destinationX, destinationY);
        const source = this.renderTileAtScale(
            root,
            plan,
            tileCanvas,
            tileContext,
            destinationX,
            destinationY,
            tileWidth,
            tileHeight,
            sourceScale
        );
        if (sourceScale >= output.effectiveScale - 0.0001 || !scaleCanvas || !scaleContext) {
            return { canvas: tileCanvas, coreWidth: source.coreWidth, coreHeight: source.coreHeight };
        }
        const totalWidth = tileWidth + TILE_BLEED_PX * 2;
        const totalHeight = tileHeight + TILE_BLEED_PX * 2;
        if (scaleCanvas.width !== totalWidth) scaleCanvas.width = totalWidth;
        if (scaleCanvas.height !== totalHeight) scaleCanvas.height = totalHeight;
        scaleContext.setTransform(1, 0, 0, 1, 0, 0);
        scaleContext.clearRect(0, 0, totalWidth, totalHeight);
        scaleContext.imageSmoothingEnabled = false;
        if ("webkitImageSmoothingEnabled" in scaleContext) scaleContext.webkitImageSmoothingEnabled = false;
        const ratio = output.effectiveScale / sourceScale;
        // Compose the low-level game draw onto the target tile using a GPU-preferred
        // Canvas 2D blit. The extra source bleed remains available on both sides.
        scaleContext.drawImage(
            tileCanvas,
            0,
            0,
            tileCanvas.width,
            tileCanvas.height,
            TILE_BLEED_PX - TILE_BLEED_PX * ratio,
            TILE_BLEED_PX - TILE_BLEED_PX * ratio,
            tileCanvas.width * ratio,
            tileCanvas.height * ratio
        );
        return { canvas: scaleCanvas, coreWidth: tileWidth, coreHeight: tileHeight };
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
        const grid = output.captureGrid || this.createCaptureGrid(output.widthPx, output.heightPx, output.megapixels);
        const stripePixelLimit = STREAMING_STRIPE_MAX_MEGAPIXELS * 1000000;
        const memoryBoundStripeHeight = Math.max(1, Math.floor(stripePixelLimit / Math.max(1, output.widthPx)));
        const stripeHeight = Math.min(STREAMING_STRIPE_HEIGHT_PX, memoryBoundStripeHeight, output.heightPx);
        let tileCount = 0;
        let stripes = 0;
        for (let gridY = 0; gridY < grid.rows; gridY++) {
            const startY = this.getGridBoundary(output.heightPx, gridY, grid.rows);
            const endY = this.getGridBoundary(output.heightPx, gridY + 1, grid.rows);
            for (let outputY = startY; outputY < endY; outputY += stripeHeight) {
                stripes += 1;
                for (let gridX = 0; gridX < grid.columns; gridX++) {
                    const startX = this.getGridBoundary(output.widthPx, gridX, grid.columns);
                    const endX = this.getGridBoundary(output.widthPx, gridX + 1, grid.columns);
                    tileCount += Math.ceil((endX - startX) / output.coreWidthPx);
                }
            }
        }
        return {
            stripeHeight,
            columns: grid.columns,
            rows: grid.rows,
            grid,
            stripes,
            tileCount,
        };
    }

    getDirectTileCount(plan) {
        const output = plan.output;
        const grid = output.captureGrid || this.createCaptureGrid(output.widthPx, output.heightPx, output.megapixels);
        let tileCount = 0;
        for (let gridY = 0; gridY < grid.rows; gridY++) {
            const startY = this.getGridBoundary(output.heightPx, gridY, grid.rows);
            const endY = this.getGridBoundary(output.heightPx, gridY + 1, grid.rows);
            const rows = Math.ceil((endY - startY) / output.coreWidthPx);
            for (let gridX = 0; gridX < grid.columns; gridX++) {
                const startX = this.getGridBoundary(output.widthPx, gridX, grid.columns);
                const endX = this.getGridBoundary(output.widthPx, gridX + 1, grid.columns);
                tileCount += rows * Math.ceil((endX - startX) / output.coreWidthPx);
            }
        }
        return tileCount;
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
    async createStreamedPngBlob(root, plan, tileCanvas, tileContext, readbackCanvas, readbackContext, capture, scaleCanvas, scaleContext) {
        // Keep the old five-argument form usable for unit tests and older hooks.
        if (!capture) {
            capture = readbackCanvas;
            readbackCanvas = null;
            readbackContext = null;
        }
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
            // PNG rows must remain top-to-bottom, while each row is composed from
            // the density-calibrated capture grid. Active and sparse cells use
            // their respective bounded GPU-preferred source pipeline first.
            for (let gridY = 0; gridY < layout.grid.rows; gridY++) {
                const gridStartY = this.getGridBoundary(output.heightPx, gridY, layout.grid.rows);
                const gridEndY = this.getGridBoundary(output.heightPx, gridY + 1, layout.grid.rows);
                for (let outputY = gridStartY; outputY < gridEndY; outputY += layout.stripeHeight) {
                    const stripeHeight = Math.min(layout.stripeHeight, gridEndY - outputY);
                    const stripTiles = [];
                    for (let gridX = 0; gridX < layout.grid.columns; gridX++) {
                        const gridStartX = this.getGridBoundary(output.widthPx, gridX, layout.grid.columns);
                        const gridEndX = this.getGridBoundary(output.widthPx, gridX + 1, layout.grid.columns);
                        for (let outputX = gridStartX; outputX < gridEndX; outputX += output.coreWidthPx) {
                            if (capture.cancelled) throw new CaptureCancelledError();
                            const tileWidth = Math.min(output.coreWidthPx, gridEndX - outputX);
                            const rendered = this.renderCaptureTile(
                                root,
                                plan,
                                tileCanvas,
                                tileContext,
                                scaleCanvas,
                                scaleContext,
                                outputX,
                                outputY,
                                tileWidth,
                                stripeHeight
                            );
                            // Render tiles stay GPU-preferred. Read pixels through a
                            // separate CPU-oriented canvas only when encoding PNG rows.
                            const pixels = this.readTilePixels(
                                rendered.canvas,
                                readbackCanvas,
                                readbackContext,
                                tileWidth,
                                stripeHeight
                            ) || (rendered.canvas === scaleCanvas && scaleContext ? scaleContext : tileContext).getImageData(
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
                total: streamingLayout ? streamingLayout.tileCount : this.getDirectTileCount(plan),
                percent: 0,
            }),
        };
        this.capture = capture;
        this.updateUI();
        let finalCanvas = null;
        let tileCanvas = null;
        let scaleCanvas = null;
        let readbackCanvas = null;
        let freezeSnapshot = null;
        try {
            freezeSnapshot = this.freezeGame(root);
            tileCanvas = document.createElement("canvas");
            // This canvas has no pixel readback, so Chromium can keep the game
            // drawing path GPU-preferred where the platform supports it.
            const tileContext = tileCanvas.getContext("2d", {
                alpha: false,
                desynchronized: true,
                willReadFrequently: false,
            });
            if (!tileContext) throw new Error("tile-canvas-context-unavailable");
            let scaleContext = null;
            if (this.needsScaleCanvas(plan)) {
                scaleCanvas = document.createElement("canvas");
                scaleContext = scaleCanvas.getContext("2d", {
                    alpha: false,
                    desynchronized: true,
                    willReadFrequently: false,
                });
                if (!scaleContext) throw new Error("scale-canvas-context-unavailable");
            }
            let blob;
            if (streamed) {
                // PNG encoding ultimately requires CPU bytes. Isolate that readback
                // from the render canvas instead of forcing each map tile software-side.
                readbackCanvas = document.createElement("canvas");
                const readbackContext = readbackCanvas.getContext("2d", {
                    alpha: false,
                    willReadFrequently: true,
                });
                if (!readbackContext) throw new Error("readback-canvas-context-unavailable");
                capture.status = this.t("streamingEncode");
                this.updateUI();
                blob = await this.createStreamedPngBlob(
                    root,
                    plan,
                    tileCanvas,
                    tileContext,
                    readbackCanvas,
                    readbackContext,
                    capture,
                    scaleCanvas,
                    scaleContext
                );
            } else {
                finalCanvas = document.createElement("canvas");
                finalCanvas.width = plan.output.widthPx;
                finalCanvas.height = plan.output.heightPx;
                const finalContext = finalCanvas.getContext("2d", {
                    alpha: false,
                    desynchronized: true,
                    willReadFrequently: false,
                });
                if (!finalContext) throw new Error("final-canvas-context-unavailable");
                finalContext.imageSmoothingEnabled = false;

                let tileIndex = 0;
                const grid = plan.output.captureGrid;
                const totalTiles = this.getDirectTileCount(plan);
                for (let gridY = 0; gridY < grid.rows; gridY++) {
                    const gridStartY = this.getGridBoundary(plan.output.heightPx, gridY, grid.rows);
                    const gridEndY = this.getGridBoundary(plan.output.heightPx, gridY + 1, grid.rows);
                    for (let outputY = gridStartY; outputY < gridEndY; outputY += plan.output.coreWidthPx) {
                        const tileHeight = Math.min(plan.output.coreWidthPx, gridEndY - outputY);
                        for (let gridX = 0; gridX < grid.columns; gridX++) {
                            const gridStartX = this.getGridBoundary(plan.output.widthPx, gridX, grid.columns);
                            const gridEndX = this.getGridBoundary(plan.output.widthPx, gridX + 1, grid.columns);
                            for (let outputX = gridStartX; outputX < gridEndX; outputX += plan.output.coreWidthPx) {
                                if (capture.cancelled) throw new CaptureCancelledError();
                                const tileWidth = Math.min(plan.output.coreWidthPx, gridEndX - outputX);
                                const rendered = this.renderCaptureTile(
                                    root,
                                    plan,
                                    tileCanvas,
                                    tileContext,
                                    scaleCanvas,
                                    scaleContext,
                                    outputX,
                                    outputY,
                                    tileWidth,
                                    tileHeight
                                );
                                finalContext.drawImage(
                                    rendered.canvas,
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
                                this.updateCaptureProgress(capture, tileIndex, totalTiles);
                                await this.yieldToBrowser();
                            }
                        }
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
            if (scaleCanvas) { scaleCanvas.width = 0; scaleCanvas.height = 0; }
            if (readbackCanvas) { readbackCanvas.width = 0; readbackCanvas.height = 0; }
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
                --fas-ink: #101820;
                --fas-panel: #1f303a;
                --fas-panel-deep: #17242d;
                --fas-line: #3c5967;
                --fas-muted: #9ab1bd;
                --fas-text: #edf6f9;
                --fas-blue: #4bb8e8;
                --fas-blue-hi: #91e0fa;
                --fas-orange: #f0a43a;
                position: fixed;
                top: 12px;
                left: 12px;
                z-index: 10020;
                display: flex;
                flex-direction: column;
                align-items: flex-start;
                gap: 7px;
                color: var(--fas-text);
                font-family: "Roboto Condensed", "Arial Narrow", "Trebuchet MS", sans-serif;
                font-variant-numeric: tabular-nums;
                text-shadow: 0 1px 0 rgba(0, 0, 0, .55);
                pointer-events: none;
            }
            #factory-area-snapshot-root button,
            #factory-area-snapshot-root input,
            #factory-area-snapshot-root select { pointer-events: auto; font: inherit; }
            #factory-area-snapshot-selection {
                position: fixed;
                z-index: 10019;
                box-sizing: border-box;
                border: 2px solid #f0a43a;
                outline: 1px solid rgba(7, 15, 20, .94);
                background: repeating-linear-gradient(-45deg, rgba(240, 164, 58, .21) 0 9px, rgba(73, 184, 232, .16) 9px 18px);
                box-shadow: 0 0 0 2px rgba(10, 17, 22, .46), inset 0 0 0 1px rgba(255, 237, 183, .34);
                pointer-events: none;
            }
            .fas-launcher {
                position: relative;
                min-width: 96px;
                height: 36px;
                padding: 0 13px 0 18px;
                border: 2px solid #0e171d;
                border-radius: 3px;
                outline: 1px solid #4d7180;
                background: linear-gradient(#31505e, #1c313c);
                box-shadow: 0 3px 0 #080e12, inset 0 1px 0 rgba(210, 245, 255, .23);
                color: #effaff;
                cursor: pointer;
                font-size: 11px;
                font-weight: 900;
                letter-spacing: .08em;
            }
            .fas-launcher::before { content: ""; position: absolute; top: -2px; bottom: -2px; left: -2px; width: 6px; background: #f0a43a; box-shadow: inset -1px 0 rgba(113, 60, 10, .52); }
            .fas-launcher:hover, .fas-launcher[aria-expanded="true"] { outline-color: var(--fas-blue-hi); background: linear-gradient(#437185, #294957); }
            .fas-launcher:active { top: 2px; box-shadow: 0 1px 0 #080e12, inset 0 1px 0 rgba(0, 0, 0, .3); }
            .fas-panel {
                width: min(410px, calc(100vw - 24px));
                max-height: calc(100vh - 68px);
                overflow-y: auto;
                box-sizing: border-box;
                border: 2px solid #0c151a;
                border-radius: 4px;
                outline: 1px solid #4b6a77;
                background: var(--fas-panel-deep);
                box-shadow: 0 5px 0 rgba(5, 9, 12, .94), 0 12px 28px rgba(0, 0, 0, .43), inset 0 0 0 1px rgba(148, 212, 237, .07);
                pointer-events: auto;
                scrollbar-width: thin;
                scrollbar-color: #4b8299 #132029;
            }
            .fas-panel[hidden] { display: none; }
            .fas-header { display: flex; align-items: center; gap: 9px; min-height: 47px; box-sizing: border-box; padding: 8px 9px; border-bottom: 2px solid #101b21; background: linear-gradient(90deg, #2d5668 0, #284a58 74%, #1d3540 74%); box-shadow: inset 0 1px 0 rgba(221, 249, 255, .18); }
            .fas-mark { display: grid; width: 27px; height: 27px; flex: 0 0 auto; place-items: center; border: 1px solid #a8eaff; border-radius: 2px; background: #24546b; box-shadow: inset 0 0 0 3px rgba(8, 21, 27, .31); color: #e7fbff; font-size: 16px; line-height: 1; }
            .fas-heading { min-width: 0; flex: 1 1 auto; }
            .fas-title { display: block; overflow: hidden; color: #f6fcff; font-size: 12px; font-weight: 900; letter-spacing: .075em; text-overflow: ellipsis; white-space: nowrap; }
            .fas-subtitle { display: block; margin-top: 2px; color: #b9d7e2; font-size: 8px; font-weight: 800; letter-spacing: .06em; }
            .fas-close { width: 27px; height: 27px; flex: 0 0 auto; padding: 0 0 2px; border: 1px solid #7892a0; border-radius: 2px; background: #293d47; box-shadow: 0 2px 0 #111b20, inset 0 1px 0 rgba(255, 255, 255, .11); color: #d5e7ec; cursor: pointer; font-size: 19px !important; line-height: 18px; }
            .fas-close:hover { border-color: #f0a43a; background: #624725; color: white; }
            .fas-note { margin: 9px 10px 0; padding: 7px 8px; border: 1px solid #35505c; border-left: 4px solid var(--fas-orange); border-radius: 2px; background: #15242c; color: #b8cbd1; font-size: 9px; line-height: 1.38; }
            .fas-controls { display: grid; grid-template-columns: 1fr 1fr; gap: 7px; padding: 9px 10px 0; }
            .fas-control, .fas-check { box-sizing: border-box; min-width: 0; border: 1px solid #37515d; border-radius: 2px; background: linear-gradient(135deg, #243842, #1b2c35); box-shadow: inset 0 1px 0 rgba(207, 241, 250, .06); }
            .fas-control { display: flex; flex-direction: column; gap: 5px; min-height: 72px; padding: 8px; }
            .fas-padding-control { grid-column: 1; }
            .fas-resolution-control { grid-column: 2; }
            .fas-label { color: #a9c1ca; font-size: 8px; font-weight: 900; letter-spacing: .085em; text-transform: uppercase; }
            .fas-control input[type="range"] { width: 100%; height: 17px; margin: 1px 0 0; accent-color: var(--fas-orange); cursor: pointer; }
            .fas-control output { color: #f4fbfd; font: 900 14px "Roboto Mono", ui-monospace, SFMono-Regular, Menlo, monospace; letter-spacing: -.02em; }
            .fas-control small { min-height: 20px; color: #8daab5; font-size: 8px; line-height: 1.26; }
            .fas-control select { width: 100%; height: 29px; padding: 0 6px; border: 1px solid #537987; border-radius: 2px; outline: none; background: #12212a; box-shadow: inset 0 1px 2px rgba(0, 0, 0, .46); color: #effaff; cursor: pointer; font-size: 11px; font-weight: 850; }
            .fas-control select:focus { border-color: var(--fas-blue-hi); box-shadow: 0 0 0 1px rgba(113, 220, 250, .26); }
            .fas-crisp-check { grid-column: 1 / -1; }
            .fas-check { display: flex; align-items: center; gap: 7px; min-height: 34px; padding: 7px 8px; color: #d1e1e6; cursor: pointer; font-size: 9px; font-weight: 750; line-height: 1.15; user-select: none; }
            .fas-check input { width: 14px; height: 14px; flex: 0 0 auto; margin: 0; accent-color: #50bce6; cursor: pointer; }
            .fas-analysis { display: grid; grid-template-columns: 1fr 1fr; gap: 5px; margin: 9px 10px 0; padding-top: 8px; border-top: 1px solid #304650; }
            .fas-analysis > div { position: relative; min-width: 0; padding: 7px 8px 7px 10px; border: 1px solid #304753; border-radius: 2px; background: #14232b; overflow: hidden; }
            .fas-analysis > div::before { content: ""; position: absolute; top: 0; bottom: 0; left: 0; width: 3px; background: #4b9fc1; }
            .fas-analysis span { display: block; color: #9bb5be; font-size: 8px; font-weight: 850; letter-spacing: .055em; }
            .fas-analysis strong { display: block; margin-top: 3px; overflow: hidden; color: #f3fbfd; font: 800 11px "Roboto Mono", ui-monospace, SFMono-Regular, Menlo, monospace; text-overflow: ellipsis; white-space: nowrap; }
            .fas-analysis .fas-error { grid-column: 1 / -1; padding: 8px; border: 1px solid #a7504e; border-left: 4px solid #e37b6d; border-radius: 2px; background: #422529; color: #ffe1db; font-size: 10px; line-height: 1.4; }
            .fas-status { min-height: 18px; margin: 8px 10px 0; color: #a9c7d1; font-size: 9px; font-weight: 650; line-height: 1.4; }
            .fas-actions { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 6px; margin: 8px 10px 10px; }
            .fas-actions button { position: relative; min-width: 0; min-height: 32px; padding: 0 6px; border: 1px solid #53717e; border-radius: 2px; background: linear-gradient(#3d5964, #2a414b); box-shadow: 0 2px 0 #0b1216, inset 0 1px 0 rgba(243, 255, 255, .12); color: #f0f9fb; cursor: pointer; font-size: 9px; font-weight: 900; letter-spacing: .035em; }
            .fas-actions button:hover:not(:disabled) { top: -1px; border-color: #9beaff; background: linear-gradient(#4b7180, #31535f); }
            .fas-actions button:active:not(:disabled) { top: 1px; box-shadow: 0 1px 0 #0b1216, inset 0 1px 0 rgba(0, 0, 0, .26); }
            .fas-actions button:disabled { cursor: default; opacity: .43; }
            .fas-select { border-color: #a97431 !important; background: linear-gradient(#7f5a2d, #5d3f20) !important; }
            .fas-capture { border-color: #69c9ec !important; background: linear-gradient(#28799e, #1e5977) !important; }
            .fas-cancel { grid-column: 1 / -1; border-color: #bd625d !important; background: linear-gradient(#84423e, #5c2d2d) !important; }
            @media (max-width: 420px) {
                .fas-panel { width: calc(100vw - 24px); }
                .fas-title { font-size: 11px; }
                .fas-subtitle { letter-spacing: .035em; }
            }
        `);
    }
}
