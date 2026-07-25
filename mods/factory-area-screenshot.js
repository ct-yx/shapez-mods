// @ts-nocheck
const METADATA = {
    website: "https://github.com/ct-yx/shapez-mods",
    author: "ct-yx & Codex",
    name: "Factory Area Snapshot",
    version: "2.0.0",
    id: "factory-area-snapshot",
    description: "Exports factory and map-selection PNGs through three simple quality presets.",
    minimumGameVersion: ">=1.5.0",
    doesNotAffectSavegame: true,
    settings: {
        wholeMapQuality: "high",
        wholeMapPaddingTiles: 10,
        lowMegapixels: 16,
        mediumMegapixels: 48,
        highMegapixels: 256,
        crispSampling: true,
        includeMovingItems: true,
        pauseDuringCapture: true,
    },
};

const TILE_SIZE = 32;
const DEFAULT_PADDING_TILES = 10;
const MIN_PADDING_TILES = 0;
const MAX_PADDING_TILES = 32;
const DEFAULT_MAX_MEGAPIXELS = 48;
const MIN_MAX_MEGAPIXELS = 1;
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
// Above this zoom, shapez uses the same sprite-atlas tier and only filters it.
// Render a crisp native source, then let the GPU scale it during final composition.
const MAX_SHARP_SOURCE_SCALE = 1;
const QUALITY_PRESETS = {
    low: { megapixels: 16, maxTiles: 48 },
    medium: { megapixels: 48, maxTiles: 128 },
    high: { megapixels: 256, maxTiles: 1024 },
};

const STRINGS = {
    en: {
        launcher: "SNAPSHOT",
        open: "Open factory snapshot",
        close: "Close",
        title: "FACTORY AREA SNAPSHOT",
        subtitle: "QUICK CAPTURE",
        quality: "Quality",
        selectedTiles: "Map selection",
        noSelection: "No selection",
        low: "LOW · {mp} MP",
        medium: "MEDIUM · {mp} MP",
        high: "HIGH · {mp} MP",
        crispSampling: "Crisp pixel sampling",
        items: "Include belt items",
        pause: "Pause simulation while rendering",
        selectArea: "REGION SCREENSHOT",
        capture: "WHOLE FACTORY",
        cancel: "CANCEL",
        noFactory: "No placed machines were detected in the regular layer.",
        waiting: "Choose a quality, then capture a region or the whole factory.",
        ready: "Ready.",
        selectionArmed: "Map selection is armed. Zoom into Map Overview, then left-drag a rectangle.",
        selectionRequiresMap: "Zoom out until Map Overview is active, then left-drag a rectangle.",
        selectionReady: "Selected map area: {w} × {h} tiles. It will export exactly as selected, without outer padding.",
        selectionCancelled: "Map-area selection cancelled.",
        selectionExact: "Map selections export the exact dragged rectangle; outer padding applies to factory-area mode only.",
        lowLocked: "Low is available up to 48 × 48 tiles; medium is selected automatically.",
        mediumLocked: "Medium is available up to 128 × 128 tiles; high is selected automatically.",
        largeSelectionWarning: "This selection is larger than 1024 × 1024 tiles. High quality may not look sharp. Continue?",
        largeSelectionHint: "Over 1024 × 1024: high quality may not look sharp.",
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
        settingsDescription: "Configure the whole-factory default and the three quick-capture quality presets. The in-game panel deliberately stays compact.",
        settingWholeQuality: "Whole factory quality",
        settingWholePadding: "Whole factory padding",
        settingLowResolution: "Low preset resolution",
        settingMediumResolution: "Medium preset resolution",
        settingHighResolution: "High preset resolution",
        settingCrispSampling: "Crisp pixel sampling",
        settingItems: "Include moving belt items",
        settingPause: "Pause simulation while capturing",
    },
    zh: {
        launcher: "截图",
        open: "打开工厂区域截图",
        close: "关闭",
        title: "工厂区域截图",
        subtitle: "快速截图",
        quality: "质量",
        selectedTiles: "地图选区",
        noSelection: "尚未选择",
        low: "低 · {mp} MP",
        medium: "中 · {mp} MP",
        high: "高 · {mp} MP",
        crispSampling: "清晰像素采样",
        items: "包含传送带上的物品",
        pause: "渲染期间暂停模拟",
        selectArea: "选区截图",
        capture: "整地图截图",
        cancel: "取消",
        noFactory: "未在普通层检测到已放置的机器。",
        waiting: "选择质量后，进行选区截图或整地图截图。",
        ready: "已就绪。",
        selectionArmed: "选区已准备：缩小进入地图总览后，用左键拖拽一个矩形范围。",
        selectionRequiresMap: "请先缩小进入地图总览，再用左键拖拽选择区域。",
        selectionReady: "已选中地图区域：{w} × {h} 格。将严格按拖拽范围导出，不添加外围留白。",
        selectionCancelled: "已取消地图区域选择。",
        selectionExact: "地图选区会严格按拖拽矩形导出；外围留白仅用于机器范围模式。",
        lowLocked: "低质量仅支持不超过 48 × 48 格的选区，已自动切换为中质量。",
        mediumLocked: "中质量仅支持不超过 128 × 128 格的选区，已自动切换为高质量。",
        largeSelectionWarning: "选区超过 1024 × 1024 格，高质量导出可能不够清晰。仍要继续吗？",
        largeSelectionHint: "选区超过 1024 × 1024 格，高质量导出可能不够清晰。",
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
        settingsDescription: "配置整地图截图默认值与低/中/高三档快速质量。游戏内面板只保留质量、选区大小和两个截图动作。",
        settingWholeQuality: "整地图默认质量",
        settingWholePadding: "整地图外围留白",
        settingLowResolution: "低质量分辨率",
        settingMediumResolution: "中质量分辨率",
        settingHighResolution: "高质量分辨率",
        settingCrispSampling: "清晰像素采样",
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
        this.regionQuality = "medium";
        this.selectedArea = null;
        this.selection = {
            armed: false,
            dragging: false,
            root: null,
            startWorld: null,
            currentWorld: null,
            captureOnComplete: false,
        };
        this.statusMessage = "";

        this.settings.wholeMapQuality = this.normalizeQuality(this.settings.wholeMapQuality || "high");
        this.settings.wholeMapPaddingTiles = this.normalizePadding(
            this.settings.wholeMapPaddingTiles === undefined ? DEFAULT_PADDING_TILES : this.settings.wholeMapPaddingTiles
        );
        this.settings.lowMegapixels = this.normalizeMegapixels(this.settings.lowMegapixels || QUALITY_PRESETS.low.megapixels);
        this.settings.mediumMegapixels = this.normalizeMegapixels(this.settings.mediumMegapixels || QUALITY_PRESETS.medium.megapixels);
        this.settings.highMegapixels = this.normalizeMegapixels(this.settings.highMegapixels || QUALITY_PRESETS.high.megapixels);
        this.settings.crispSampling = this.settings.crispSampling !== false;
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
                    id: "wholeMapQuality",
                    type: "select",
                    label: { en: STRINGS.en.settingWholeQuality, zh: STRINGS.zh.settingWholeQuality },
                    description: {
                        en: "Default quality for the Whole Factory button. High is the default.",
                        zh: "「整地图截图」按钮使用的默认质量，默认高质量。",
                    },
                    options: [
                        { value: "low", label: { en: "Low", zh: "低" } },
                        { value: "medium", label: { en: "Medium", zh: "中" } },
                        { value: "high", label: { en: "High", zh: "高" } },
                    ],
                    default: this.settings.wholeMapQuality,
                    onChange: value => this.applySetting("wholeMapQuality", value),
                },
                {
                    id: "wholeMapPaddingTiles",
                    type: "number",
                    label: { en: STRINGS.en.settingWholePadding, zh: STRINGS.zh.settingWholePadding },
                    description: {
                        en: "Empty border around the placed factory for Whole Factory captures. Default: 10 tiles.",
                        zh: "整地图截图在已放置机器外保留的空白边框，默认 10 格。",
                    },
                    min: MIN_PADDING_TILES,
                    max: MAX_PADDING_TILES,
                    step: 1,
                    suffix: " tiles",
                    default: this.settings.wholeMapPaddingTiles,
                    onChange: value => this.applySetting("wholeMapPaddingTiles", value),
                },
                {
                    id: "lowMegapixels",
                    type: "number",
                    label: { en: STRINGS.en.settingLowResolution, zh: STRINGS.zh.settingLowResolution },
                    description: {
                        en: "Quick-capture Low preset. Default: 16 MP. This custom value has no selection-size warning.",
                        zh: "快速截图的低质量档，默认 16 MP。可自由修改，修改值本身不触发选区警告。",
                    },
                    min: MIN_MAX_MEGAPIXELS,
                    max: MAX_MAX_MEGAPIXELS,
                    step: 1,
                    suffix: " MP",
                    default: this.settings.lowMegapixels,
                    onChange: value => this.applySetting("lowMegapixels", value),
                },
                {
                    id: "mediumMegapixels",
                    type: "number",
                    label: { en: STRINGS.en.settingMediumResolution, zh: STRINGS.zh.settingMediumResolution },
                    description: {
                        en: "Quick-capture Medium preset. Default: 48 MP. This custom value has no selection-size warning.",
                        zh: "快速截图的中质量档，默认 48 MP。可自由修改，修改值本身不触发选区警告。",
                    },
                    min: MIN_MAX_MEGAPIXELS,
                    max: MAX_MAX_MEGAPIXELS,
                    step: 1,
                    suffix: " MP",
                    default: this.settings.mediumMegapixels,
                    onChange: value => this.applySetting("mediumMegapixels", value),
                },
                {
                    id: "highMegapixels",
                    type: "number",
                    label: { en: STRINGS.en.settingHighResolution, zh: STRINGS.zh.settingHighResolution },
                    description: {
                        en: "Quick-capture High preset. Default: 256 MP. This custom value has no selection-size warning.",
                        zh: "快速截图的高质量档，默认 256 MP。可自由修改，修改值本身不触发选区警告。",
                    },
                    min: MIN_MAX_MEGAPIXELS,
                    max: MAX_MAX_MEGAPIXELS,
                    step: 1,
                    suffix: " MP",
                    default: this.settings.highMegapixels,
                    onChange: value => this.applySetting("highMegapixels", value),
                },
                {
                    id: "crispSampling",
                    type: "boolean",
                    label: { en: STRINGS.en.settingCrispSampling, zh: STRINGS.zh.settingCrispSampling },
                    description: {
                        en: "Forces nearest-neighbor sampling for the game's sprite and cached-map draws.",
                        zh: "对游戏精灵图与缓存地图绘制使用最近邻采样。",
                    },
                    default: this.settings.crispSampling,
                    onChange: value => this.applySetting("crispSampling", value),
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

        this.settings.wholeMapQuality = this.normalizeQuality(this.settingsPanel.get("wholeMapQuality"));
        this.settings.wholeMapPaddingTiles = this.normalizePadding(this.settingsPanel.get("wholeMapPaddingTiles"));
        this.settings.lowMegapixels = this.normalizeMegapixels(this.settingsPanel.get("lowMegapixels"));
        this.settings.mediumMegapixels = this.normalizeMegapixels(this.settingsPanel.get("mediumMegapixels"));
        this.settings.highMegapixels = this.normalizeMegapixels(this.settingsPanel.get("highMegapixels"));
        this.settings.crispSampling = this.settingsPanel.get("crispSampling") !== false;
        this.settings.includeMovingItems = this.settingsPanel.get("includeMovingItems") !== false;
        this.settings.pauseDuringCapture = this.settingsPanel.get("pauseDuringCapture") !== false;
    }

    applySetting(key, value) {
        if (key === "wholeMapQuality") this.settings.wholeMapQuality = this.normalizeQuality(value);
        else if (key === "wholeMapPaddingTiles") this.settings.wholeMapPaddingTiles = this.normalizePadding(value);
        else if (key === "lowMegapixels") this.settings.lowMegapixels = this.normalizeMegapixels(value);
        else if (key === "mediumMegapixels") this.settings.mediumMegapixels = this.normalizeMegapixels(value);
        else if (key === "highMegapixels") this.settings.highMegapixels = this.normalizeMegapixels(value);
        else if (key === "crispSampling") this.settings.crispSampling = Boolean(value);
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

    normalizeQuality(value) {
        return Object.prototype.hasOwnProperty.call(QUALITY_PRESETS, value) ? value : "medium";
    }

    getWholeMapPaddingTiles() {
        return this.normalizePadding(this.getSetting("wholeMapPaddingTiles"));
    }

    getWholeMapQuality() {
        return this.normalizeQuality(this.getSetting("wholeMapQuality") || "high");
    }

    getQualityMegapixels(quality) {
        const key = this.normalizeQuality(quality);
        return this.normalizeMegapixels(this.getSetting(key + "Megapixels"));
    }

    getCrispSampling() {
        return this.getSetting("crispSampling") !== false;
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
            <button type="button" class="fas-launcher styledButton" aria-expanded="false"></button>
            <section class="fas-panel" hidden>
                <header class="fas-header">
                    <span class="fas-mark" aria-hidden="true">▣</span>
                    <div class="fas-heading">
                        <strong class="fas-title"></strong>
                        <span class="fas-subtitle"></span>
                    </div>
                    <button type="button" class="fas-close styledButton" aria-label="close">×</button>
                </header>
                <div class="fas-quick-controls">
                    <label class="fas-quick-field"><span class="fas-label quality-label"></span><select class="fas-quality"><option value="low"></option><option value="medium"></option><option value="high"></option></select></label>
                    <div class="fas-selection-readout"><span class="fas-label selection-label"></span><strong class="fas-selection-value"></strong></div>
                </div>
                <div class="fas-warning" hidden></div>
                <div class="fas-status" hidden aria-live="polite"></div>
                <footer class="fas-actions">
                    <button type="button" class="fas-select styledButton"></button>
                    <button type="button" class="fas-capture styledButton"></button>
                    <button type="button" class="fas-cancel styledButton" hidden></button>
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
            quality: container.querySelector(".fas-quality"),
            qualityLabel: container.querySelector(".quality-label"),
            selectionLabel: container.querySelector(".selection-label"),
            selectionValue: container.querySelector(".fas-selection-value"),
            warning: container.querySelector(".fas-warning"),
            status: container.querySelector(".fas-status"),
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
        this.elements.quality.addEventListener("change", () => this.setRegionQuality(this.elements.quality.value));
        this.elements.select.addEventListener("click", () => this.beginMapAreaSelection(true));
        this.elements.capture.addEventListener("click", () => this.captureWholeFactory());
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
        this.updateUI();
    }

    getSelectionTileSize() {
        if (!this.selectedArea) return null;
        return { w: Math.max(1, Number(this.selectedArea.w) || 1), h: Math.max(1, Number(this.selectedArea.h) || 1) };
    }

    getEffectiveRegionQuality() {
        const size = this.getSelectionTileSize();
        const desired = this.normalizeQuality(this.regionQuality);
        if (!size) return desired;
        const longest = Math.max(size.w, size.h);
        if (longest > QUALITY_PRESETS.medium.maxTiles) return "high";
        if (longest > QUALITY_PRESETS.low.maxTiles && desired === "low") return "medium";
        return desired;
    }

    enforceRegionQuality(showReason) {
        const previous = this.regionQuality;
        const effective = this.getEffectiveRegionQuality();
        this.regionQuality = effective;
        if (showReason && previous !== effective) {
            this.statusMessage = effective === "medium" ? this.t("lowLocked") : this.t("mediumLocked");
        }
        return effective;
    }

    setRegionQuality(value) {
        this.regionQuality = this.normalizeQuality(value);
        this.enforceRegionQuality(true);
        this.updateUI();
    }

    isLargeSelection() {
        const size = this.getSelectionTileSize();
        return Boolean(size && Math.max(size.w, size.h) > QUALITY_PRESETS.high.maxTiles);
    }

    getQualityOptionLabel(quality) {
        return this.t(quality, { mp: this.getQualityMegapixels(quality) });
    }

    updateUI(statusOverride) {
        const e = this.elements;
        if (!e || !e.container) return;
        const active = Boolean(this.capture && this.capture.active);
        const selecting = Boolean(this.selection && this.selection.armed);
        const size = this.getSelectionTileSize();
        const effectiveQuality = this.enforceRegionQuality(false);
        e.launcher.textContent = this.t("launcher");
        e.launcher.title = this.t("open");
        e.launcher.setAttribute("aria-expanded", String(this.panelOpen));
        e.panel.hidden = !this.panelOpen;
        e.title.textContent = this.t("title");
        e.subtitle.textContent = this.t("subtitle");
        e.close.title = this.t("close");
        e.qualityLabel.textContent = this.t("quality");
        e.selectionLabel.textContent = this.t("selectedTiles");
        e.selectionValue.textContent = size ? size.w + " × " + size.h : this.t("noSelection");
        for (const quality of ["low", "medium", "high"]) {
            const option = e.quality.querySelector("option[value='" + quality + "']");
            if (!option) continue;
            option.textContent = this.getQualityOptionLabel(quality);
            option.disabled = Boolean(size && (
                (quality === "low" && Math.max(size.w, size.h) > QUALITY_PRESETS.low.maxTiles)
                || (quality === "medium" && Math.max(size.w, size.h) > QUALITY_PRESETS.medium.maxTiles)
            ));
        }
        e.quality.value = effectiveQuality;
        e.quality.disabled = active || selecting;
        const warning = this.isLargeSelection() ? this.t("largeSelectionHint") : "";
        e.warning.hidden = !warning;
        e.warning.textContent = warning;
        e.select.textContent = this.t("selectArea");
        e.capture.textContent = this.t("capture");
        e.cancel.textContent = this.t("cancel");
        e.select.disabled = active;
        e.capture.disabled = active;
        e.cancel.hidden = !active && !selecting;
        const status = statusOverride || (active ? this.capture.status : (selecting ? this.statusMessage : ""));
        e.status.hidden = !status;
        e.status.textContent = status || "";
    }

    captureWholeFactory() {
        if (this.capture && this.capture.active) return;
        this.captureMode = "factory";
        this.selectedArea = null;
        this.cancelMapAreaSelection(true);
        this.startCapture();
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
        const captureGrid = this.createCaptureGrid(widthPx, heightPx);
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
                canStreamPng,
                maxOutputEdge,
            },
        };
    }


    createCaptureGrid(widthPx, heightPx) {
        // Internal work tiles only: quality is now selected explicitly through
        // Low / Medium / High presets instead of a visible partition formula.
        const columns = Math.max(1, Math.ceil(widthPx / TILE_CORE_TARGET_PX));
        const rows = Math.max(1, Math.ceil(heightPx / TILE_CORE_TARGET_PX));
        return { columns, rows, count: columns * rows, preferred: columns * rows };
    }

    getGridBoundary(size, index, count) {
        return Math.floor(size * index / count);
    }

    needsScaleCanvas(plan) {
        const output = plan && plan.output;
        return Boolean(output && output.sourceScale < output.effectiveScale - 0.0001);
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
        const quality = useSelection ? this.enforceRegionQuality(false) : this.getWholeMapQuality();
        this.lastAnalysis = this.calculateRenderPlan(machineBounds, {
            paddingTiles: useSelection ? 0 : this.getWholeMapPaddingTiles(),
            maxMegapixels: this.getQualityMegapixels(quality),
            usePadding: !useSelection,
            source: useSelection ? "selection" : "factory",
        });
        this.lastAnalysis.quality = quality;
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

    beginMapAreaSelection(captureOnComplete) {
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
        this.selection.captureOnComplete = Boolean(captureOnComplete);
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
        this.selection.captureOnComplete = false;
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
        const captureOnComplete = this.selection.captureOnComplete;
        this.selection.armed = false;
        this.selection.dragging = false;
        this.selection.startWorld = null;
        this.selection.currentWorld = null;
        this.selection.captureOnComplete = false;
        this.updateSelectionOverlay();
        if (!bounds) {
            this.statusMessage = this.t("selectionCancelled");
            this.updateUI();
            return;
        }
        this.selectedArea = bounds;
        this.captureMode = "selection";
        this.enforceRegionQuality(true);
        this.analyzeArea(true);
        if (captureOnComplete) setTimeout(() => this.startCapture(), 0);
        else this.updateUI();
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
        const sourceScale = output.sourceScale || output.effectiveScale;
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
        if (this.captureMode === "selection" && this.isLargeSelection()) {
            let accepted = true;
            try {
                if (typeof window !== "undefined" && typeof window.confirm === "function") {
                    accepted = window.confirm(this.t("largeSelectionWarning"));
                }
            } catch (error) { }
            if (!accepted) {
                this.statusMessage = this.t("largeSelectionHint");
                this.updateUI();
                return;
            }
        }
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
        // The quick panel deliberately uses the same compact card/button language
        // as the structured settings screen instead of a telemetry dashboard.
        this.modInterface.registerCss(`
            #factory-area-snapshot-root {
                position: fixed;
                top: 12px;
                left: 12px;
                z-index: 10020;
                display: flex;
                flex-direction: column;
                align-items: flex-start;
                gap: 7px;
                color: #f4f4f4;
                font-family: Roboto, Arial, sans-serif;
                font-variant-numeric: tabular-nums;
                pointer-events: none;
            }
            #factory-area-snapshot-root button,
            #factory-area-snapshot-root select { pointer-events: auto; font: inherit; }
            #factory-area-snapshot-selection {
                position: fixed;
                z-index: 10019;
                box-sizing: border-box;
                border: 2px solid #f8b63d;
                outline: 2px solid rgba(20, 25, 31, .75);
                background: repeating-linear-gradient(-45deg, rgba(248, 182, 61, .23) 0 10px, rgba(72, 160, 225, .15) 10px 20px);
                box-shadow: inset 0 0 0 1px rgba(255, 245, 193, .45);
                pointer-events: none;
            }
            #factory-area-snapshot-root .fas-launcher {
                min-width: 116px;
                min-height: 34px;
                padding: 0 13px;
                border: 0;
                border-left: 5px solid #f8b63d;
                border-radius: 2px;
                background: #48545c;
                box-shadow: 0 2px 0 rgba(0, 0, 0, .48), inset 0 1px rgba(255, 255, 255, .16);
                color: #fff;
                cursor: pointer;
                font-size: 11px;
                font-weight: 700;
                letter-spacing: .06em;
            }
            #factory-area-snapshot-root .fas-launcher:hover,
            #factory-area-snapshot-root .fas-launcher[aria-expanded="true"] { background: #5a6a74; }
            #factory-area-snapshot-root .fas-panel {
                width: min(324px, calc(100vw - 24px));
                box-sizing: border-box;
                border: 2px solid #252d33;
                border-radius: 3px;
                background: #354149;
                box-shadow: 0 4px 0 rgba(0, 0, 0, .46), inset 0 1px rgba(255, 255, 255, .12);
                pointer-events: auto;
            }
            #factory-area-snapshot-root .fas-panel[hidden] { display: none; }
            #factory-area-snapshot-root .fas-header {
                display: flex;
                align-items: center;
                gap: 8px;
                min-height: 42px;
                padding: 0 8px;
                border-bottom: 2px solid rgba(24, 30, 35, .68);
                background: #47575f;
            }
            #factory-area-snapshot-root .fas-mark {
                display: grid;
                width: 24px;
                height: 24px;
                place-items: center;
                border-radius: 2px;
                background: #60a9d6;
                color: #fff;
                font-size: 15px;
                box-shadow: inset 0 1px rgba(255, 255, 255, .34);
            }
            #factory-area-snapshot-root .fas-heading { min-width: 0; flex: 1; }
            #factory-area-snapshot-root .fas-title { display: block; color: #fff; font-size: 12px; font-weight: 800; letter-spacing: .045em; }
            #factory-area-snapshot-root .fas-subtitle { display: block; margin-top: 1px; color: #d6e0e5; font-size: 8px; font-weight: 700; letter-spacing: .08em; }
            #factory-area-snapshot-root .fas-close {
                width: 25px;
                height: 25px;
                padding: 0 0 2px;
                border: 0;
                border-radius: 2px;
                background: #687880;
                color: #fff;
                cursor: pointer;
                font-size: 18px;
                line-height: 1;
            }
            #factory-area-snapshot-root .fas-close:hover { background: #c86659; }
            #factory-area-snapshot-root .fas-quick-controls {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 8px;
                padding: 10px;
            }
            #factory-area-snapshot-root .fas-quick-field,
            #factory-area-snapshot-root .fas-selection-readout {
                display: flex;
                min-width: 0;
                flex-direction: column;
                gap: 5px;
                padding: 8px;
                border-radius: 2px;
                background: #28333a;
                box-shadow: inset 0 1px rgba(255, 255, 255, .06);
            }
            #factory-area-snapshot-root .fas-label { color: #b9c6cb; font-size: 8px; font-weight: 800; letter-spacing: .1em; text-transform: uppercase; }
            #factory-area-snapshot-root .fas-quality {
                width: 100%;
                min-width: 0;
                height: 30px;
                padding: 0 5px;
                border: 1px solid #70818a;
                border-radius: 2px;
                outline: none;
                background: #1f292f;
                color: #fff;
                cursor: pointer;
                font-size: 10px;
                font-weight: 700;
            }
            #factory-area-snapshot-root .fas-quality:focus { border-color: #77c7ef; box-shadow: 0 0 0 2px rgba(119, 199, 239, .22); }
            #factory-area-snapshot-root .fas-selection-value { min-height: 30px; overflow: hidden; color: #fff; font: 800 13px "Roboto Mono", monospace; line-height: 30px; text-overflow: ellipsis; white-space: nowrap; }
            #factory-area-snapshot-root .fas-warning,
            #factory-area-snapshot-root .fas-status { margin: 0 10px 9px; padding: 7px 8px; border-radius: 2px; font-size: 9px; font-weight: 650; line-height: 1.35; }
            #factory-area-snapshot-root .fas-warning { border-left: 4px solid #f8b63d; background: #5a4828; color: #fff1c7; }
            #factory-area-snapshot-root .fas-status { border-left: 4px solid #67b8e2; background: #263a46; color: #d8effb; }
            #factory-area-snapshot-root .fas-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 7px; margin: 0 10px 10px; }
            #factory-area-snapshot-root .fas-actions button { min-height: 34px; border: 0; border-radius: 2px; color: #fff; cursor: pointer; font-size: 10px; font-weight: 800; letter-spacing: .035em; }
            #factory-area-snapshot-root .fas-actions button:disabled { cursor: default; opacity: .45; }
            #factory-area-snapshot-root .fas-select { background: #7e5d2b; box-shadow: inset 0 1px rgba(255, 255, 255, .16), 0 2px rgba(53, 37, 14, .7); }
            #factory-area-snapshot-root .fas-capture { background: #3c86b1; box-shadow: inset 0 1px rgba(255, 255, 255, .18), 0 2px rgba(19, 55, 77, .72); }
            #factory-area-snapshot-root .fas-actions button:hover:not(:disabled) { filter: brightness(1.12); }
            #factory-area-snapshot-root .fas-actions button:active:not(:disabled) { transform: translateY(1px); box-shadow: none; }
            #factory-area-snapshot-root .fas-cancel { grid-column: 1 / -1; background: #a95049; }
            @media (max-width: 360px) {
                #factory-area-snapshot-root .fas-panel { width: calc(100vw - 24px); }
            }
        `);
    }
}
