// @ts-nocheck
const METADATA = {
    website: "",
    author: "Asynic",
    name: "Factory Stress Lab",
    version: "2.4.0",
    id: "factory-stress-lab",
    description: "Unlimited speed control with responsive 40 FPS stress benchmarking, low-cost visual throttling, telemetry, and PNG, web, and text reports.",
    minimumGameVersion: ">=1.5.0",
    doesNotAffectSavegame: true,
};

const STORAGE_KEY = "shapez_mod_factory_stress_lab_v3";
const VISUAL_THROTTLE_SPEED = 10;
const VISUAL_REFRESH_INTERVAL_MS = 1000;
const PERFORMANCE_CURVE_MAX_SECONDS = 600;
const BENCHMARK_ADJUSTMENT_INTERVAL_MS = 700;


const LOCALE_TEXT = {
    en: {
        miniFpsTitle: "Click to open game performance details", pause: "Play/Pause", title: "FACTORY STRESS LAB", subtitle: "SIMULATION CONTROL · LOW-COST TELEMETRY",
        performanceTitle: "Click for game performance details", telemetry: "GAME TELEMETRY", telemetryCaption: "simulation, not hardware", closeDetails: "Close details", benchmarkExpand: "Expand Benchmark", benchmarkCollapse: "Collapse Benchmark",
        gameFps: "GAME FPS", frameUnit: "ms/frame", logicRate: "LOGIC RATE", tickCost: "tick cost", simulation: "SIMULATION", ticksUnit: "ticks/s", entities: "ENTITIES", machineLoad: "machine load", display: "DISPLAY", live: "LIVE", visualRefresh: "visual refresh", benchmark: "Benchmark", idle: "IDLE", score: "score", sampled: "Sampled once per second · click FPS again to collapse", curveWindow: "Live curve: up to 10 min",
        quickSpeed: "QUICK SPEED", unlimitedInput: "unlimited input", turbo: "Turbo 100x", pressureBenchmark: "PRESSURE Benchmark", holdNear: "hold the factory near 40 FPS", noCap: "NO CAP", runBenchmark: "Run Stress Test", stopBenchmark: "Stop & Return to 3x", exportPngTitle: "Export high-resolution PNG", exportWeb: "WEB", exportWebTitle: "Export self-contained web report", exportText: "TXT", exportTextTitle: "Export plain-text report", duration: "Run", startTarget: "Start 200x · target 40 FPS", benchmarkIdle: "Benchmark idle · select a duration", liveCurves: "LIVE CURVES", perSecond: "1s samples", manualMultiplier: "MANUAL MULTIPLIER", typeAnyValue: "type any value", closePanel: "Click to close",
        collecting: "collecting…", displayCap: "1 FPS presentation cap", livePresentation: "live presentation", benchLine: "Benchmark: {elapsed} / {duration} s · avg {average}x", benchResultLine: "Benchmark: {result}", noResult: "idle", speedTarget: "Speed: {speed}x / target {target}x", gameFpsLine: "Game FPS: {fps} · {frame} ms/frame", logicTickLine: "Logic tick: {rate} · {average}", simulationLine: "Simulation: {hz} ticks/s", displayLine: "Display: {display}", logicQueueLine: "Logic queue: {queue} ticks/frame", entitiesLine: "Entities: {entities}", tickCostValue: "tick cost {value} ms", tickCostEmpty: "tick cost —", ticksValue: "{value} ticks/s", machineLoadValue: "load {value}", machineLoadEmpty: "machine load —", capDisplay: "1 Hz", capDisplayNote: "canvas refresh above 10x", liveDisplayNote: "canvas refresh live", benchRun: "RUN {elapsed}s", benchDone: "DONE", benchAvg: "avg {average}x", scoreValue: "score {value}", scoreEmpty: "score —",
        fpsLegend: "FPS", speedLegend: "SPEED", fpsTarget: "40 FPS", stoppedManual: "Stopped: manual speed selection", stoppedTurbo: "Stopped: Turbo selected", stoppedManually: "Stopped manually", completed: "Completed {duration}s stress test", waitingFps: "Waiting for FPS sample", calibrating: "Calibrating at 200x", settling: "Settling {speed}x · {count}/{minimum} samples", hardBackoff: "Hard backoff {from}x → {to}x · {fps} FPS", stabilityBackoff: "Stability backoff {from}x → {to}x · floor {fps} FPS", nearLimit: "Near limit · holding {speed}x · {min}–{median} FPS", targetStable: "Target stable · holding {speed}x · {min}–{median} FPS", confirming: "Confirming stable headroom · {count}/{required} windows", knownCeiling: "Known ceiling · holding {speed}x", fastRamp: "Fast ramp {from}x → {to}x · floor {fps} FPS", precisionProbe: "Precision probe {from}x → {to}x · floor {fps} FPS", benchmarkRunning: "RUN {elapsed}/{duration}s · {status} · avg {average}x", lastScore: "Last score {score} · avg {average}x · {status}", benchmarkIdleStatus: "Benchmark idle · starts at 200x · no speed cap", exportPngDone: "PNG report exported at 2x resolution", exportWebDone: "Web report exported", exportTextDone: "Text report exported",
        adaptiveCurves: "ADAPTIVE CURVES", machinePressureIndex: "MACHINE PRESSURE INDEX", noMachineSamples: "No machine samples available", reportAria: "Factory stress curves and machine pressure", reportTitle: "FACTORY STRESS LAB — PERFORMANCE REPORT", generated: "Generated: {value}", status: "Status: {value}", durationReport: "Duration: {value} s", summary: "SUMMARY", scoreReport: "Score: {value}", averageSpeed: "Average speed: {value}x", peakSpeed: "Peak speed: {value}x", averageGameFps: "Average game FPS: {value}", targetHold: "Target hold (38–42 FPS): {value}%", stability: "Stability: {value}%", averageTickCost: "Average tick cost: {value} ms", totalMachinePressure: "Total machine pressure: {value}", totalBaseLoad: "Total base load: {value}", machinePressure: "MACHINE PRESSURE", machineRow: "{id} ×{count} | pressure {pressure} | base {base}", sampleHeader: "SAMPLES (time_ms | game_fps | speed_x | tick_ms | entities)", scoreLabel: "SCORE", averageSpeedLabel: "AVERAGE SPEED", averageFpsLabel: "AVERAGE FPS", targetHoldLabel: "TARGET HOLD", stabilityLabel: "STABILITY", peakSpeedLabel: "PEAK SPEED", avgTickLabel: "AVG TICK", entitiesLabel: "ENTITIES", reportSubtitle: "40 FPS adaptive benchmark · generated {value}", scoreCardLabel: "FACTORY STRESS SCORE", scoreCardNote: "stability-weighted machine load", machine: "Machine", count: "Count", pressure: "Pressure", baseLoad: "Base load", rawSamples: "Raw performance samples ({count})", timeMs: "Time ms", reportGameFps: "Game FPS", speed: "Speed", tickMs: "Tick ms", visualFooter: "Visual presentation is intentionally capped to 1 Hz above 10x; simulation and benchmark logic continue running.", pressureFormula: "Pressure = component workload × average multiplier × tick cost", totalPressure: "Total pressure {value} · peak {peak}x", pngLegendSpeed: "Speed"
    },
    zh: {
        miniFpsTitle: "点击展开游戏性能详情", pause: "播放/暂停", title: "工厂压力实验室", subtitle: "模拟控制 · 低开销遥测", performanceTitle: "点击查看游戏性能详情", telemetry: "游戏遥测", telemetryCaption: "游戏模拟数据，不是硬件数据", closeDetails: "关闭详情", benchmarkExpand: "展开 Benchmark", benchmarkCollapse: "收起 Benchmark",
        gameFps: "游戏帧率", frameUnit: "毫秒/帧", logicRate: "逻辑频率", tickCost: "逻辑耗时", simulation: "模拟速度", ticksUnit: "次逻辑/秒", entities: "实体数量", machineLoad: "机器负载", display: "画面显示", live: "实时", visualRefresh: "画面刷新", benchmark: "Benchmark", idle: "空闲", score: "分数", sampled: "每秒采样一次 · 再次点击 FPS 可收起", curveWindow: "实时曲线：最长 10 分钟",
        quickSpeed: "快捷速度", unlimitedInput: "可输入任意倍率", turbo: "Turbo 100x", pressureBenchmark: "压力测试 Benchmark", holdNear: "将工厂维持在约 40 FPS", noCap: "无上限", runBenchmark: "开始压力测试", stopBenchmark: "停止并回到 3x", exportPngTitle: "导出高分辨率 PNG", exportWeb: "网页", exportWebTitle: "导出独立网页报告", exportText: "文本", exportTextTitle: "导出纯文本报告", duration: "时长", startTarget: "起步 200x · 目标 40 FPS", benchmarkIdle: "Benchmark 空闲 · 选择时长后开始", liveCurves: "实时曲线", perSecond: "每秒采样", manualMultiplier: "手动倍率", typeAnyValue: "可输入任意数值", closePanel: "点击收起",
        collecting: "采集中…", displayCap: "超过 10x 时画面 1 FPS", livePresentation: "实时画面", benchLine: "Benchmark：{elapsed} / {duration} 秒 · 平均 {average}x", benchResultLine: "Benchmark：{result}", noResult: "空闲", speedTarget: "速度：{speed}x / 目标 {target}x", gameFpsLine: "游戏帧率：{fps} · {frame} 毫秒/帧", logicTickLine: "逻辑 Tick：{rate} · {average}", simulationLine: "模拟：{hz} 次逻辑/秒", displayLine: "画面显示：{display}", logicQueueLine: "逻辑队列：{queue} 次/帧", entitiesLine: "实体：{entities}", tickCostValue: "逻辑耗时 {value} 毫秒", tickCostEmpty: "逻辑耗时 —", ticksValue: "{value} 次逻辑/秒", machineLoadValue: "负载 {value}", machineLoadEmpty: "机器负载 —", capDisplay: "1 Hz", capDisplayNote: "超过 10x 时画面每秒刷新", liveDisplayNote: "画面实时刷新", benchRun: "运行 {elapsed} 秒", benchDone: "完成", benchAvg: "平均 {average}x", scoreValue: "分数 {value}", scoreEmpty: "分数 —",
        fpsLegend: "FPS", speedLegend: "倍率", fpsTarget: "40 FPS", stoppedManual: "已停止：手动选择速度", stoppedTurbo: "已停止：选择了 Turbo", stoppedManually: "手动停止", completed: "已完成 {duration} 秒压力测试", waitingFps: "等待 FPS 采样", calibrating: "在 200x 校准中", settling: "等待稳定 {speed}x · {count}/{minimum} 个样本", hardBackoff: "紧急回退 {from}x → {to}x · {fps} FPS", stabilityBackoff: "稳定性回退 {from}x → {to}x · 最低 {fps} FPS", nearLimit: "接近上限 · 保持 {speed}x · {min}–{median} FPS", targetStable: "目标稳定 · 保持 {speed}x · {min}–{median} FPS", confirming: "确认稳定余量 · {count}/{required} 个窗口", knownCeiling: "已知上限 · 保持 {speed}x", fastRamp: "快速爬升 {from}x → {to}x · 最低 {fps} FPS", precisionProbe: "精细探测 {from}x → {to}x · 最低 {fps} FPS", benchmarkRunning: "运行 {elapsed}/{duration} 秒 · {status} · 平均 {average}x", lastScore: "上次分数 {score} · 平均 {average}x · {status}", benchmarkIdleStatus: "Benchmark 空闲 · 从 200x 开始 · 无倍率上限", exportPngDone: "已导出 2 倍分辨率 PNG 报告", exportWebDone: "已导出网页报告", exportTextDone: "已导出文本报告",
        adaptiveCurves: "自适应曲线", machinePressureIndex: "机器压力指数", noMachineSamples: "没有可用的机器样本", reportAria: "工厂压力曲线与机器压力", reportTitle: "工厂压力实验室 — 性能报告", generated: "生成时间：{value}", status: "状态：{value}", durationReport: "时长：{value} 秒", summary: "汇总", scoreReport: "分数：{value}", averageSpeed: "平均倍率：{value}x", peakSpeed: "峰值倍率：{value}x", averageGameFps: "平均游戏帧率：{value}", targetHold: "目标保持率（38–42 FPS）：{value}%", stability: "稳定性：{value}%", averageTickCost: "平均逻辑耗时：{value} 毫秒", totalMachinePressure: "总机器压力：{value}", totalBaseLoad: "总基础负载：{value}", machinePressure: "机器压力", machineRow: "{id} ×{count} | 压力 {pressure} | 基础负载 {base}", sampleHeader: "样本（时间毫秒 | 游戏 FPS | 倍率 | Tick 毫秒 | 实体）", scoreLabel: "分数", averageSpeedLabel: "平均倍率", averageFpsLabel: "平均帧率", targetHoldLabel: "目标保持", stabilityLabel: "稳定性", peakSpeedLabel: "峰值倍率", avgTickLabel: "平均 Tick", entitiesLabel: "实体数量", reportSubtitle: "40 FPS 自适应压力测试 · 生成于 {value}", scoreCardLabel: "工厂压力分数", scoreCardNote: "按稳定性加权的机器负载", machine: "机器", count: "数量", pressure: "压力", baseLoad: "基础负载", rawSamples: "原始性能样本（{count}）", timeMs: "时间毫秒", reportGameFps: "游戏 FPS", speed: "倍率", tickMs: "Tick 毫秒", visualFooter: "超过 10x 时画面会限制为每秒刷新一次；模拟和跑分逻辑继续运行。", pressureFormula: "压力 = 组件负载 × 平均倍率 × Tick 耗时", totalPressure: "总压力 {value} · 峰值 {peak}x", pngLegendSpeed: "倍率"
    }
};

const IMAGES = {
    pause: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzMjAgNTEyIj48cGF0aCBkPSJNMjcyIDYzLjFsLTMyIDBjLTI2LjUxIDAtNDggMjEuNDktNDggNDcuMXYyODhjMCAyNi41MSAyMS40OSA0OCA0OCA0OEwyNzIgNDQ4YzI2LjUxIDAgNDgtMjEuNDkgNDgtNDh2LTI4OEMzMjAgODUuNDkgMjk4LjUgNjMuMSAyNzIgNjMuMXpNODAgNjMuMWwtMzIgMGMtMjYuNTEgMC00OCAyMS40OS00OCA0OHYyODhDMCA0MjYuNSAyMS40OSA0NDggNDggNDQ4bDMyIDBjMjYuNTEgMCA0OC0yMS40OSA0OC00OHYtMjg4QzEyOCA4NS40OSAxMDYuNSA2My4xIDgwIDYzLjF6Ii8+PC9zdmc+",
    play: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzODQgNTEyIj48cGF0aCBkPSJNMzYxIDIxNUMzNzUuMyAyMjMuOCAzODQgMjM5LjMgMzg0IDI1NkMzODQgMjcyLjcgMzc1LjMgMjg4LjIgMzYxIDI5Ni4xTDczLjAzIDQ3Mi4xQzU4LjIxIDQ4MiAzOS42NiA0ODIuNCAyNC41MiA0NzMuOUM5LjM3NyA0NjUuNCAwIDQ0OS40IDAgNDMyVjgwQzAgNjIuNjQgOS4zNzcgNDYuNjMgMjQuNTIgMzguMTNDMzkuNjYgMjkuNjQgNTguMjEgMjkuOTkgNzMuMDMgMzkuMDRMMzYxIDIxNXoiLz48L3N2Zz4"
};

class Mod extends shapez.Mod {
    init() {
        this.state = {
            targetSpeed: 1.0,
            currentSpeed: 1.0,
            paused: false,
            turboActive: false,
            turboSpeed: 100,
            minSpeed: 0.1,
            sliderMaxSpeed: 100,
            benchmarkDuration: 120,
            uiOpen: false,
            saveUid: "default",
            performanceDetailsOpen: false,
            benchmarkPanelOpen: false,
            liveChartOpen: false
        };

        this.stats = {
            frames: 0,
            lastSecTime: performance.now(),
            fps: 0,
            loopActive: false
        };

        this.elements = {};
        this.currentGameState = null;
        this.locale = "en";
        this.performanceDetailsOpen = false;
        this.visualThrottle = {
            lastFullDrawAt: 0,
            lastDisplayInterval: 0,
            skippedFrames: 0
        };
        this.performanceHistory = [];
        this.lastPerformanceSampleAt = 0;
        this.benchmark = {
            active: false,
            targetFps: 40,
            durationSeconds: 120,
            startedAt: 0,
            endedAt: 0,
            nextAdjustmentAt: 0,
            samples: [],
            bestStableSpeed: 0,
            peakSpeed: 0,
            status: "",
            statusKey: "benchmarkIdleStatus",
            statusVars: {},
            result: null,
            fpsEma: null,
            lastAdjustmentAt: 0
        };

        this.installHooks();
        this.registerCss();
        this.registerShortcuts();

        this.signals.stateEntered.add(state => {
            if (state.key === "InGameState") {
                this.currentGameState = state;
                
                try {
                    let savegame = null;
                    if (state.app && state.app.savegameMgr) {
                        savegame = state.app.savegameMgr.currentSavegame;
                    }
                    
                    if (savegame) {
                        this.state.saveUid = savegame.uid || (savegame.metadata && savegame.metadata.name) || savegame.name || ("save_" + Date.now());
                    } else {
                        this.state.saveUid = "default";
                    }
                } catch (err) {
                    this.state.saveUid = "default";
                }
                
                this.loadSettings();
                this.clearLiveCurveHistory();
                this.syncLocale();
                this.buildUI();
                this.startStatsLoop();
            } else {
                this.currentGameState = null;
                this.destroyUI();
                this.stopStatsLoop();
            }
        });
    }

    loadSettings() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            const globalStore = raw ? JSON.parse(raw) : {};
            const saved = globalStore[this.state.saveUid] || {};
            
            this.state.targetSpeed = 1.0;
            this.state.currentSpeed = 1.0; 
            this.state.paused = false;
            this.state.turboActive = false;
            this.state.benchmarkDuration = saved.benchmarkDuration === 900 ? 900 : 120;
            this.benchmark.active = false;
            this.performanceDetailsOpen = false;
            this.state.benchmarkPanelOpen = saved.benchmarkPanelOpen === true;
            this.state.liveChartOpen = false;
            this.visualThrottle.lastFullDrawAt = 0;
            this.visualThrottle.lastDisplayInterval = 0;
            this.visualThrottle.skippedFrames = 0;
            
            this.state.uiOpen = saved.uiOpen !== undefined ? saved.uiOpen : false;
        } catch (e) { }
    }

    saveSettings() {
        if (this._saveTimeout) clearTimeout(this._saveTimeout);
        this._saveTimeout = setTimeout(() => {
            try {
                const raw = localStorage.getItem(STORAGE_KEY);
                const globalStore = raw ? JSON.parse(raw) : {};
                globalStore[this.state.saveUid] = {
                    uiOpen: this.state.uiOpen,
                    benchmarkDuration: this.state.benchmarkDuration,
                    benchmarkPanelOpen: this.state.benchmarkPanelOpen
                };
                localStorage.setItem(STORAGE_KEY, JSON.stringify(globalStore));
            } catch (e) { }
        }, 300);
    }

    installHooks() {
        this.modInterface.replaceMethod(shapez.RegularGameSpeed, "getTimeMultiplier", () => {
            if (this.state.paused) {
                this.state.currentSpeed = 0;
                return 0;
            }
            const target = this.state.turboActive ? this.state.turboSpeed : this.state.targetSpeed;
            const diff = target - this.state.currentSpeed;
            
            if (Math.abs(diff) < 0.05) {
                this.state.currentSpeed = target;
            } else {
                this.state.currentSpeed += diff * 0.15;
            }
            return this.state.currentSpeed;
        });

        // Match the game's logic-tick queue to the active time multiplier.
        // Without this, RegularGameSpeed keeps its 3-tick-per-frame cap, so
        // multipliers above roughly 3x are discarded by GameTime's budget clamp.
        this.modInterface.replaceMethod(shapez.RegularGameSpeed, "getMaxLogicStepsInQueue", () => {
            if (this.state.paused) return 0;
            return Math.max(3, Math.ceil(3 * this.state.currentSpeed));
        });
        this.modInterface.replaceMethod(shapez.HUDSettingsMenu, "shouldPauseGame", () => {
            return this.state.paused;
        });

        // Above 10x, simulation continues but the canvas is presented only once
        // per second. The game's own frame counter is still ticked on skipped
        // frames, so the benchmark measures simulation capacity rather than the
        // intentionally throttled presentation rate.
        if (shapez.GameCore && shapez.GameCore.prototype && typeof shapez.GameCore.prototype.draw === "function") {
            try {
                this.modInterface.replaceMethod(shapez.GameCore, "draw", (oldDraw, args) => {
                    const speed = Number(this.state && this.state.currentSpeed);
                    if (this.state.paused || !Number.isFinite(speed) || speed <= VISUAL_THROTTLE_SPEED) {
                        this.visualThrottle.lastFullDrawAt = 0;
                        this.visualThrottle.lastDisplayInterval = 0;
                        this.visualThrottle.skippedFrames = 0;
                        return oldDraw.apply(this, args || []);
                    }

                    const now = performance.now();
                    const last = this.visualThrottle.lastFullDrawAt;
                    if (!last || now - last >= VISUAL_REFRESH_INTERVAL_MS) {
                        this.visualThrottle.lastDisplayInterval = last ? now - last : 0;
                        this.visualThrottle.lastFullDrawAt = now;
                        this.visualThrottle.skippedFrames = 0;
                        return oldDraw.apply(this, args || []);
                    }

                    this.visualThrottle.skippedFrames++;
                    const root = this.getGameRoot();
                    if (root && root.dynamicTickrate && typeof root.dynamicTickrate.onFrameRendered === "function") {
                        root.dynamicTickrate.onFrameRendered();
                    }
                    return undefined;
                });
            } catch (error) {
                // Older game builds may not expose GameCore.draw to mods.
                this.visualThrottle.hookError = true;
            }
        }
    }

    startStatsLoop() {
        this.stats.loopActive = true;
        this.stats.lastSecTime = performance.now();
        this.stats.frames = 0;

        const loop = () => {
            if (!this.stats.loopActive) return;
            this.stats.frames++;
            const now = performance.now();
            
            if (now - this.stats.lastSecTime >= 1000) {
                this.stats.fps = this.stats.frames;
                this.stats.frames = 0;
                this.stats.lastSecTime = now;
                this.updateDynamicStatsUI();
            }
            requestAnimationFrame(loop);
        };
        requestAnimationFrame(loop);
    }

    stopStatsLoop() {
        this.stats.loopActive = false;
    }

    setSpeed(value) {
        if (this.benchmark.active) this.finishBenchmark({ key: "stoppedManual", vars: {} });
        this.state.turboActive = false; 
        
        const requested = Number(value);
        if (!Number.isFinite(requested)) return;
        const numVal = Math.round(Math.max(this.state.minSpeed, requested) * 10) / 10;
        this.state.targetSpeed = numVal;
        
        if (numVal > 0 && this.state.paused) this.state.paused = false;
        if (numVal === 0) this.state.paused = true;
        
        this.updateStaticUI();
    }

    togglePause() {
        this.state.paused = !this.state.paused;
        this.updateStaticUI();
    }

    setTurbo() {
        if (this.benchmark.active) this.finishBenchmark({ key: "stoppedTurbo", vars: {} });
        this.state.turboActive = !this.state.turboActive;
        if (this.state.turboActive && this.state.paused) {
            this.state.paused = false;
        }
        this.updateStaticUI();
    }

    registerShortcuts() {
        document.addEventListener("keydown", (e) => {
            if (!this.currentGameState) return;
            const activeElem = document.activeElement;
            const activeTag = (activeElem && activeElem.tagName) ? activeElem.tagName.toLowerCase() : null;
            if (activeTag === "input" || activeTag === "textarea") return;

            if (e.shiftKey && e.code === "KeyT") { e.preventDefault(); this.setTurbo(); }
            if (e.code === "BracketRight") { e.preventDefault(); this.setSpeed(this.state.targetSpeed + 1); }
            if (e.code === "BracketLeft") { e.preventDefault(); this.setSpeed(this.state.targetSpeed - 1); }
        });
    }

    buildUI() {
        const keepDetailsOpen = this.performanceDetailsOpen;
        this.destroyUI();
        this.performanceDetailsOpen = keepDetailsOpen;

        const container = document.createElement("div");
        container.id = "st-root-container";

        container.innerHTML = `
            <div id="st-top-pill">
                <button id="st-mini-fps-badge" class="st-top-element st-performance-trigger" style="display: ${this.state.uiOpen ? 'none' : 'flex'};" title="${this.t("miniFpsTitle")}" aria-expanded="false" type="button">
                    <span id="st-mini-fps-dot" class="st-fps-dot"></span>
                    <span id="st-mini-val-fps" class="st-val-fps">-</span>
                    <span class="st-mini-fps-label">FPS</span>
                </button>

                <button id="st-launcher" class="st-top-element ${this.state.uiOpen ? 'active' : ''}" type="button">1.0x</button>

                <button id="st-mini-pause-btn" class="st-top-element" style="display: ${this.state.uiOpen ? 'none' : 'flex'};" title="${this.t("pause")}" type="button">
                    <img id="st-mini-pause-icon" src="${this.state.paused ? IMAGES.play : IMAGES.pause}" alt="">
                </button>
            </div>

            <div id="st-panel" style="display: ${this.state.uiOpen ? 'flex' : 'none'};">
                <div class="st-panel-header">
                    <div class="st-heading-stack">
                        <span class="st-panel-title">${this.t("title")}</span>
                        <span class="st-panel-subtitle">${this.t("subtitle")}</span>
                    </div>
                    <button class="st-fps-badge st-performance-trigger" title="${this.t("performanceTitle")}" aria-expanded="false" type="button">
                        <span id="st-fps-dot" class="st-fps-dot"></span>
                        <span id="st-val-fps" class="st-val-fps">-</span>
                        <span class="st-fps-unit">FPS</span>
                        <span class="st-expand-glyph">⌄</span>
                    </button>
                </div>

                <section id="st-performance-details" class="st-performance-details" hidden>
                    <div class="st-details-heading">
                        <div>
                            <span class="st-section-kicker">${this.t("telemetry")}</span>
                            <span class="st-details-caption">${this.t("telemetryCaption")}</span>
                        </div>
                        <button id="st-close-details" class="st-close-details" type="button" title="${this.t("closeDetails")}">×</button>
                    </div>
                    <div class="st-detail-grid">
                        <div class="st-detail-card"><span>${this.t("gameFps")}</span><strong id="st-detail-fps">—</strong><small id="st-detail-frame">— ${this.t("frameUnit")}</small></div>
                        <div class="st-detail-card"><span>${this.t("logicRate")}</span><strong id="st-detail-logic">—</strong><small id="st-detail-tick">${this.t("tickCost")} —</small></div>
                        <div class="st-detail-card"><span>${this.t("simulation")}</span><strong id="st-detail-speed">—</strong><small id="st-detail-steps">— ${this.t("ticksUnit")}</small></div>
                        <div class="st-detail-card"><span>${this.t("entities")}</span><strong id="st-detail-entities">—</strong><small id="st-detail-pressure">${this.t("machineLoad")} —</small></div>
                        <div class="st-detail-card"><span>${this.t("display")}</span><strong id="st-detail-display">${this.t("live")}</strong><small id="st-detail-display-note">${this.t("visualRefresh")}</small></div>
                        <div class="st-detail-card"><span>Benchmark</span><strong id="st-detail-bench">${this.t("idle")}</strong><small id="st-detail-score">${this.t("score")} —</small></div>
                    </div>
                    <canvas id="st-performance-chart" width="680" height="260"></canvas>
                    <div class="st-details-footnote">${this.t("sampled")} · ${this.t("curveWindow")}</div>
                </section>

                <div class="st-section-heading"><span class="st-section-kicker">${this.t("quickSpeed")}</span><span class="st-section-note">${this.t("unlimitedInput")}</span></div>
                <div class="st-segmented-control">
                    <button class="st-segment-btn" data-val="1" type="button">1x</button>
                    <button class="st-segment-btn" data-val="5" type="button">5x</button>
                    <button class="st-segment-btn" data-val="20" type="button">20x</button>
                    <button class="st-segment-btn st-turbo-btn" type="button">${this.t("turbo")}</button>
                </div>

                <section id="st-benchmark-details" class="st-bench-section">
                    <button id="st-benchmark-summary" class="st-bench-summary" type="button" aria-expanded="${this.state.benchmarkPanelOpen ? 'true' : 'false'}">
                        <div class="st-bench-heading">
                            <div><span class="st-section-kicker">PRESSURE Benchmark</span><span class="st-bench-subtitle">${this.t("holdNear")}</span></div>
                            <span class="st-bench-summary-right"><span class="st-bench-chip">${this.t("noCap")}</span><span class="st-bench-chevron">⌄</span></span>
                        </div>
                    </button>
                    <div id="st-benchmark-body" class="st-bench-body" ${this.state.benchmarkPanelOpen ? '' : 'hidden'}>
                    <button id="st-benchmark-btn" class="st-bench-btn" type="button">${this.t("runBenchmark")}</button>
                    <div class="st-export-row">
                        <button id="st-export-btn" class="st-export-btn" type="button" title="${this.t("exportPngTitle")}">PNG</button>
                        <button id="st-export-html-btn" class="st-export-btn" type="button" title="${this.t("exportWebTitle")}">${this.t("exportWeb")}</button>
                        <button id="st-export-txt-btn" class="st-export-btn" type="button" title="${this.t("exportTextTitle")}">${this.t("exportText")}</button>
                    </div>
                    <div class="st-bench-options">
                        <label>${this.t("duration")} <select id="st-benchmark-duration">
                            <option value="120" ${this.state.benchmarkDuration === 120 ? 'selected' : ''}>120 s</option>
                            <option value="900" ${this.state.benchmarkDuration === 900 ? 'selected' : ''}>900 s</option>
                        </select></label>
                        <span>${this.t("startTarget")}</span>
                    </div>
                    <div id="st-benchmark-status" class="st-benchmark-status">${this.t("benchmarkIdle")}</div>
                    <section id="st-live-chart-details" class="st-live-chart">
                        <button id="st-live-chart-summary" class="st-live-chart-summary" type="button" aria-expanded="${this.state.liveChartOpen ? 'true' : 'false'}"><span>${this.t("liveCurves")}</span><span class="st-summary-note">${this.t("perSecond")}</span><span class="st-live-chart-chevron">⌄</span></button>
                        <div id="st-live-chart-body" ${this.state.liveChartOpen ? '' : 'hidden'}><canvas id="st-live-chart" width="680" height="220"></canvas></div>
                    </section>
                    </div>
                </section>

                <div class="st-section-heading st-control-heading"><span class="st-section-kicker">${this.t("manualMultiplier")}</span><span class="st-section-note">${this.t("typeAnyValue")}</span></div>
                <div class="st-control-row">
                    <div class="st-slider-wrapper">
                        <input type="range" id="st-slider" min="${this.state.minSpeed}" max="${this.state.sliderMaxSpeed}" step="0.1" value="${Math.min(this.state.sliderMaxSpeed, this.state.targetSpeed)}">
                    </div>
                    <label class="st-speed-entry"><input id="st-speed-input" type="number" min="${this.state.minSpeed}" step="0.1" value="${this.state.targetSpeed}"><span>x</span></label>
                    <button id="st-pause-btn" class="st-icon-btn" type="button" title="${this.t("pause")}">
                        <img id="st-pause-icon" src="${this.state.paused ? IMAGES.play : IMAGES.pause}" alt="">
                    </button>
                </div>

                <div id="st-home-indicator-area" title="${this.t("closePanel")}">
                    <div class="st-home-indicator"></div>
                </div>
            </div>
        `;

        document.body.appendChild(container);

        const panel = container.querySelector("#st-panel");
        const launcher = container.querySelector("#st-launcher");
        const miniPauseBtn = container.querySelector("#st-mini-pause-btn");
        const miniFpsBadge = container.querySelector("#st-mini-fps-badge");
        const fpsBadge = panel.querySelector(".st-fps-badge");
        const details = panel.querySelector("#st-performance-details");
        const benchmarkDetails = panel.querySelector("#st-benchmark-details");
        const benchmarkSummary = panel.querySelector("#st-benchmark-summary");
        const benchmarkBody = panel.querySelector("#st-benchmark-body");
        const liveChartDetails = panel.querySelector("#st-live-chart-details");
        const liveChartSummary = panel.querySelector("#st-live-chart-summary");
        const liveChartBody = panel.querySelector("#st-live-chart-body");
        const homeIndicatorArea = container.querySelector("#st-home-indicator-area");

        const togglePerformanceDetails = (forceState) => {
            const nextOpen = forceState !== undefined ? Boolean(forceState) : !this.performanceDetailsOpen;
            if (nextOpen !== this.performanceDetailsOpen) {
                this.setPerformanceDetailsOpen(nextOpen);
            }
            details.hidden = !this.performanceDetailsOpen;
            details.classList.toggle("open", this.performanceDetailsOpen);
            fpsBadge.setAttribute("aria-expanded", String(this.performanceDetailsOpen));
            miniFpsBadge.setAttribute("aria-expanded", String(this.performanceDetailsOpen));
            if (this.performanceDetailsOpen) {
                this.updatePerformanceDetails(this.getGameMetrics());
            }
        };

        const togglePanel = (forceState) => {
            this.state.uiOpen = forceState !== undefined ? forceState : !this.state.uiOpen;
            panel.style.display = this.state.uiOpen ? "flex" : "none";

            if (this.state.uiOpen) {
                launcher.classList.add("active");
                miniPauseBtn.style.display = "none";
                miniFpsBadge.style.display = "none";
                this.updateDynamicStatsUI();
            } else {
                // Hiding the panel hides the curve as well. Treat it like a
                // collapse so the next expansion starts a fresh live window.
                if (this.performanceDetailsOpen) togglePerformanceDetails(false);
                launcher.classList.remove("active");
                miniPauseBtn.style.display = "flex";
                miniFpsBadge.style.display = "flex";
            }
            this.saveSettings();
        };

        const performanceClick = (event) => {
            event.preventDefault();
            event.stopPropagation();
            if (!this.state.uiOpen) togglePanel(true);
            togglePerformanceDetails();
        };
        const performanceKeydown = (event) => {
            if (event.key === "Enter" || event.key === " ") performanceClick(event);
        };

        launcher.onclick = () => togglePanel();
        homeIndicatorArea.onclick = (event) => {
            event.stopPropagation();
            togglePanel(false);
        };
        miniPauseBtn.onclick = () => this.togglePause();
        panel.querySelector("#st-pause-btn").onclick = () => this.togglePause();
        panel.querySelector("#st-slider").oninput = (event) => this.setSpeed(event.target.value);
        panel.querySelector("#st-speed-input").onchange = (event) => this.setSpeed(event.target.value);
        fpsBadge.onclick = performanceClick;
        miniFpsBadge.onclick = performanceClick;
        fpsBadge.onkeydown = performanceKeydown;
        miniFpsBadge.onkeydown = performanceKeydown;
        panel.querySelector("#st-close-details").onclick = (event) => {
            event.stopPropagation();
            togglePerformanceDetails(false);
        };

        const presetBtns = panel.querySelectorAll(".st-segment-btn:not(.st-turbo-btn)");
        for (let i = 0; i < presetBtns.length; i++) {
            presetBtns[i].onclick = () => this.setSpeed(Number(presetBtns[i].dataset.val));
        }
        panel.querySelector(".st-turbo-btn").onclick = () => this.setTurbo();
        panel.querySelector("#st-benchmark-btn").onclick = () => this.toggleBenchmark();
        panel.querySelector("#st-export-btn").onclick = () => this.exportPerformanceReport();
        panel.querySelector("#st-export-html-btn").onclick = () => this.exportHtmlReport();
        panel.querySelector("#st-export-txt-btn").onclick = () => this.exportTextReport();
        panel.querySelector("#st-benchmark-duration").onchange = (event) => {
            this.state.benchmarkDuration = Number(event.target.value) === 900 ? 900 : 120;
            this.saveSettings();
            this.updateStaticUI();
        };
        benchmarkSummary.onclick = (event) => {
            event.preventDefault();
            event.stopPropagation();
            this.toggleBenchmarkPanel();
        };
        liveChartSummary.onclick = (event) => {
            event.preventDefault();
            event.stopPropagation();
            this.toggleLiveChartPanel();
        };

        this.elements = {
            container,
            launcher,
            panel,
            miniPauseBtn,
            miniFpsBadge,
            fpsBadge,
            performanceDetails: details,
            performanceChart: panel.querySelector("#st-performance-chart"),
            benchmarkBtn: panel.querySelector("#st-benchmark-btn"),
            exportBtn: panel.querySelector("#st-export-btn"),
            exportHtmlBtn: panel.querySelector("#st-export-html-btn"),
            exportTxtBtn: panel.querySelector("#st-export-txt-btn"),
            benchmarkDetails,
            benchmarkSummary,
            benchmarkBody,
            benchmarkDuration: panel.querySelector("#st-benchmark-duration"),
            benchmarkStatus: panel.querySelector("#st-benchmark-status"),
            liveChartDetails,
            liveChartSummary,
            liveChartBody,
            liveChart: panel.querySelector("#st-live-chart"),
            miniPauseIcon: container.querySelector("#st-mini-pause-icon"),
            pauseIcon: panel.querySelector("#st-pause-icon"),
            slider: panel.querySelector("#st-slider"),
            speedInput: panel.querySelector("#st-speed-input"),
            valFps: panel.querySelector("#st-val-fps"),
            fpsDot: panel.querySelector("#st-fps-dot"),
            miniValFps: container.querySelector("#st-mini-val-fps"),
            miniFpsDot: container.querySelector("#st-mini-fps-dot"),
            presetBtns,
            turboBtn: panel.querySelector(".st-turbo-btn"),
            detailFps: panel.querySelector("#st-detail-fps"),
            detailFrame: panel.querySelector("#st-detail-frame"),
            detailLogic: panel.querySelector("#st-detail-logic"),
            detailTick: panel.querySelector("#st-detail-tick"),
            detailSpeed: panel.querySelector("#st-detail-speed"),
            detailSteps: panel.querySelector("#st-detail-steps"),
            detailEntities: panel.querySelector("#st-detail-entities"),
            detailPressure: panel.querySelector("#st-detail-pressure"),
            detailDisplay: panel.querySelector("#st-detail-display"),
            detailDisplayNote: panel.querySelector("#st-detail-display-note"),
            detailBench: panel.querySelector("#st-detail-bench"),
            detailScore: panel.querySelector("#st-detail-score")
        };

        if (this.performanceDetailsOpen) {
            details.hidden = false;
            details.classList.add("open");
            fpsBadge.setAttribute("aria-expanded", "true");
            miniFpsBadge.setAttribute("aria-expanded", "true");
        }
        this.updateStaticUI();
    }

    destroyUI() {
        if (this.elements.container) {
            this.elements.container.remove();
            this.elements = {};
        }
    }

    updateStaticUI() {
        if (!this.elements.panel) return;

        const isTurbo = this.state.turboActive;
        const targetDisplay = isTurbo ? this.state.turboSpeed : this.state.targetSpeed;
        this.elements.launcher.textContent = isTurbo ? "TURBO" : (targetDisplay.toFixed(1) + "x");
        this.elements.launcher.style.color = isTurbo ? "var(--st-hot)" : "var(--st-text)";

        const sliderSpeed = Math.min(this.state.sliderMaxSpeed, this.state.targetSpeed);
        this.elements.slider.value = sliderSpeed;
        const percent = Math.max(0, Math.min(100, ((sliderSpeed - this.state.minSpeed) * 100) / (this.state.sliderMaxSpeed - this.state.minSpeed)));
        this.elements.slider.style.backgroundSize = percent + "% 100%";
        this.elements.slider.style.opacity = (isTurbo || this.benchmark.active) ? "0.45" : "1";
        if (this.elements.speedInput) {
            this.elements.speedInput.value = this.state.targetSpeed.toFixed(1);
            this.elements.speedInput.disabled = this.benchmark.active;
        }

        this.elements.pauseIcon.src = this.state.paused ? IMAGES.play : IMAGES.pause;
        this.elements.pauseIcon.parentElement.style.background = this.state.paused ? "rgba(70, 170, 255, 0.26)" : "var(--st-control-bg)";
        this.elements.pauseIcon.style.filter = this.state.paused ? "invert(0.5) sepia(1) saturate(5) hue-rotate(180deg) brightness(1.5)" : "invert(1)";
        this.elements.miniPauseIcon.src = this.state.paused ? IMAGES.play : IMAGES.pause;
        this.elements.miniPauseBtn.style.background = this.state.paused ? "rgba(70, 170, 255, 0.20)" : "transparent";
        this.elements.miniPauseIcon.style.filter = this.state.paused ? "invert(0.5) sepia(1) saturate(5) hue-rotate(180deg) brightness(1.5)" : "invert(1)";

        for (let i = 0; i < this.elements.presetBtns.length; i++) {
            const button = this.elements.presetBtns[i];
            button.classList.toggle("active", !isTurbo && Number(button.dataset.val) === this.state.targetSpeed && !this.benchmark.active);
        }
        this.elements.turboBtn.classList.toggle("active", isTurbo);

        if (this.elements.benchmarkBtn) {
            this.elements.benchmarkBtn.textContent = this.benchmark.active ? this.t("stopBenchmark") : this.t("runBenchmark");
            this.elements.benchmarkBtn.classList.toggle("active", this.benchmark.active);
        }
        if (this.elements.benchmarkDuration) {
            this.elements.benchmarkDuration.value = String(this.state.benchmarkDuration);
            this.elements.benchmarkDuration.disabled = this.benchmark.active;
        }
        if (this.elements.benchmarkStatus) this.elements.benchmarkStatus.textContent = this.getBenchmarkStatus();
        if (this.elements.benchmarkDetails && this.elements.benchmarkSummary) {
            const open = Boolean(this.state.benchmarkPanelOpen);
            if (this.elements.benchmarkBody) this.elements.benchmarkBody.hidden = !open;
            this.elements.benchmarkDetails.classList.toggle("expanded", open);
            this.elements.benchmarkSummary.setAttribute("aria-expanded", String(open));
            this.elements.benchmarkSummary.title = this.t(open ? "benchmarkCollapse" : "benchmarkExpand");
        }
        if (this.elements.liveChartDetails && this.elements.liveChartSummary) {
            const open = Boolean(this.state.liveChartOpen);
            if (this.elements.liveChartBody) this.elements.liveChartBody.hidden = !open;
            this.elements.liveChartDetails.classList.toggle("expanded", open);
            this.elements.liveChartSummary.setAttribute("aria-expanded", String(open));
        }
        this.updateDynamicStatsUI();
    }

    toggleBenchmarkPanel(forceState) {
        this.state.benchmarkPanelOpen = forceState === undefined
            ? !this.state.benchmarkPanelOpen
            : Boolean(forceState);
        if (this.elements.benchmarkBody) this.elements.benchmarkBody.hidden = !this.state.benchmarkPanelOpen;
        if (this.elements.benchmarkDetails) this.elements.benchmarkDetails.classList.toggle("expanded", this.state.benchmarkPanelOpen);
        if (this.elements.benchmarkSummary) {
            this.elements.benchmarkSummary.setAttribute("aria-expanded", String(this.state.benchmarkPanelOpen));
            this.elements.benchmarkSummary.title = this.t(this.state.benchmarkPanelOpen ? "benchmarkCollapse" : "benchmarkExpand");
        }
        this.saveSettings();
        if (this.state.benchmarkPanelOpen) this.drawLiveChart();
    }

    toggleLiveChartPanel(forceState) {
        this.state.liveChartOpen = forceState === undefined
            ? !this.state.liveChartOpen
            : Boolean(forceState);
        if (this.elements.liveChartBody) this.elements.liveChartBody.hidden = !this.state.liveChartOpen;
        if (this.elements.liveChartDetails) this.elements.liveChartDetails.classList.toggle("expanded", this.state.liveChartOpen);
        if (this.elements.liveChartSummary) this.elements.liveChartSummary.setAttribute("aria-expanded", String(this.state.liveChartOpen));
        if (this.state.liveChartOpen) this.drawLiveChart();
    }


    clearLiveCurveHistory() {
        // This is intentionally separate from benchmark.samples: a completed
        // Benchmark report must remain available after the details panel closes.
        this.performanceHistory.length = 0;
        this.lastPerformanceSampleAt = 0;
    }

    setPerformanceDetailsOpen(open) {
        const nextOpen = Boolean(open);
        this.performanceDetailsOpen = nextOpen;
        if (!nextOpen) {
            // Collapsing details stops the non-Benchmark recorder immediately.
            // Benchmark mode keeps its independent benchmark.samples history.
            this.clearLiveCurveHistory();
        } else if (!this.benchmark.active) {
            // Each expansion starts a new live curve instead of continuing the
            // curve from the previous expansion.
            this.clearLiveCurveHistory();
        }
    }

    getGameLanguage() {
        const candidates = [];
        const add = value => {
            if (value !== undefined && value !== null && value !== "") candidates.push(value);
        };
        try {
            const app = (this.currentGameState && this.currentGameState.app) || this.app;
            const settings = app && app.settings;
            if (settings) {
                if (typeof settings.getLanguage === "function") add(settings.getLanguage());
                add(settings.language);
                if (typeof settings.getAllSettings === "function") {
                    const all = settings.getAllSettings();
                    add(all && all.language);
                }
            }
        } catch (error) { }
        try { add(document.documentElement && document.documentElement.lang); } catch (error) { }
        try { add(typeof navigator !== "undefined" ? navigator.languages || navigator.language : ""); } catch (error) { }

        const flat = [];
        for (const candidate of candidates) {
            if (Array.isArray(candidate)) flat.push(...candidate);
            else flat.push(candidate);
        }
        for (const candidate of flat) {
            const value = String(candidate).trim().toLowerCase();
            if (!value || value === "auto" || value === "auto-detect") continue;
            if (value === "zh" || value.startsWith("zh-") || value.startsWith("zh_")) return "zh";
            // The mod has a complete English fallback for every other language.
            if (/^[a-z]{2}(?:[-_][a-z0-9-]+)?$/i.test(value)) return "en";
        }
        return "en";
    }

    syncLocale() {
        const next = this.getGameLanguage();
        if (next === this.locale) return false;
        this.locale = next;
        if (this.currentGameState && this.elements && this.elements.panel) this.buildUI();
        return true;
    }

    t(key, vars = {}) {
        const table = LOCALE_TEXT[this.locale] || LOCALE_TEXT.en;
        const template = table[key] !== undefined ? table[key] : LOCALE_TEXT.en[key];
        if (template === undefined) return key;
        return String(template).replace(/\{(\w+)\}/g, (match, name) => {
            return vars[name] === undefined || vars[name] === null ? match : String(vars[name]);
        });
    }

    setBenchmarkStatus(key, vars = {}) {
        this.benchmark.statusKey = key;
        this.benchmark.statusVars = vars;
        this.benchmark.status = this.t(key, vars);
    }

    getBenchmarkStatusText() {
        return this.benchmark.statusKey
            ? this.t(this.benchmark.statusKey, this.benchmark.statusVars || {})
            : (this.benchmark.status || "");
    }

    getGameRoot() {
        return this.currentGameState && this.currentGameState.core && this.currentGameState.core.root;
    }

    getGameMetrics() {
        const root = this.getGameRoot();
        const tickrate = root && root.dynamicTickrate;
        const speed = Number.isFinite(this.state.currentSpeed) ? this.state.currentSpeed : 0;
        const targetSpeed = this.state.turboActive ? this.state.turboSpeed : this.state.targetSpeed;
        const renderFps = tickrate && Number.isFinite(tickrate.averageFps) ? tickrate.averageFps : this.stats.fps;
        const tickRate = tickrate && Number.isFinite(tickrate.currentTickRate) ? tickrate.currentTickRate : null;
        const tickMs = tickrate && Number.isFinite(tickrate.averageTickDuration) ? tickrate.averageTickDuration : null;
        const entityCount = root && root.entityMgr && Array.isArray(root.entityMgr.entities)
            ? root.entityMgr.entities.length
            : null;
        const visualThrottled = !this.state.paused && speed > VISUAL_THROTTLE_SPEED;
        const displayInterval = this.visualThrottle.lastDisplayInterval || VISUAL_REFRESH_INTERVAL_MS;
        const displayFps = visualThrottled
            ? Math.min(1, 1000 / Math.max(VISUAL_REFRESH_INTERVAL_MS, displayInterval))
            : renderFps;
        return {
            now: performance.now(),
            renderFps: Number.isFinite(renderFps) ? Math.max(0, renderFps) : 0,
            displayFps: Number.isFinite(displayFps) ? Math.max(0, displayFps) : 0,
            tickRate,
            tickMs,
            entityCount,
            speed,
            targetSpeed: Number.isFinite(targetSpeed) ? targetSpeed : speed,
            visualThrottled
        };
    }

    getPerformanceTooltip(metrics = this.getGameMetrics()) {
        const frameMs = metrics.renderFps > 0 ? (1000 / metrics.renderFps).toFixed(1) : "—";
        const averageTick = metrics.tickMs && metrics.tickMs > 0 ? metrics.tickMs.toFixed(3) + " ms" : this.t("collecting");
        const logicHz = metrics.tickRate ? (metrics.tickRate * metrics.speed).toFixed(0) : "—";
        const queueLimit = this.state.paused ? 0 : Math.max(3, Math.ceil(3 * metrics.speed));
        const display = metrics.visualThrottled ? this.t("displayCap") : this.t("livePresentation");
        const benchLine = this.benchmark.active
            ? this.t("benchLine", { elapsed: this.getBenchmarkElapsed(metrics.now), duration: this.benchmark.durationSeconds, average: this.getBenchmarkStats(this.benchmark.samples).averageSpeed.toFixed(1) })
            : this.t("benchResultLine", { result: this.benchmark.result ? this.t("scoreValue", { value: this.benchmark.result.score }) : this.t("noResult") });
        return [
            this.t("title"),
            this.t("gameFpsLine", { fps: Math.round(metrics.renderFps), frame: frameMs }),
            this.t("logicTickLine", { rate: metrics.tickRate ? metrics.tickRate + " Hz" : "—", average: averageTick }),
            this.t("simulationLine", { hz: logicHz }),
            this.t("speedTarget", { speed: metrics.speed.toFixed(1), target: metrics.targetSpeed.toFixed(1) }),
            this.t("displayLine", { display }),
            this.t("logicQueueLine", { queue: queueLimit }),
            this.t("entitiesLine", { entities: metrics.entityCount === null ? "—" : metrics.entityCount }),
            benchLine
        ].join("\n");
    }

    updatePerformanceDetails(metrics = this.getGameMetrics()) {
        if (!this.performanceDetailsOpen || !this.elements.performanceDetails || this.elements.performanceDetails.hidden) return;
        const set = (key, value) => { if (this.elements[key]) this.elements[key].textContent = String(value); };
        const frameMs = metrics.renderFps > 0 ? (1000 / metrics.renderFps).toFixed(1) : "—";
        const logicHz = metrics.tickRate ? (metrics.tickRate * metrics.speed).toFixed(0) : "—";
        const tickRateText = metrics.tickRate ? Math.round(metrics.tickRate) + " Hz" : "—";
        const benchStats = this.getBenchmarkStats(this.benchmark.samples);
        const result = this.benchmark.result;
        set("detailFps", metrics.renderFps.toFixed(1));
        set("detailFrame", frameMs + " " + this.t("frameUnit"));
        set("detailLogic", tickRateText);
        set("detailTick", metrics.tickMs && metrics.tickMs > 0 ? this.t("tickCostValue", { value: metrics.tickMs.toFixed(3) }) : this.t("tickCostEmpty"));
        set("detailSpeed", metrics.speed.toFixed(1) + "x");
        set("detailSteps", this.t("ticksValue", { value: logicHz }));
        set("detailEntities", metrics.entityCount === null ? "—" : metrics.entityCount);
        set("detailPressure", result ? this.t("machineLoadValue", { value: Math.round(result.totalPressure).toLocaleString() }) : this.t("machineLoadEmpty"));
        set("detailDisplay", metrics.visualThrottled ? this.t("capDisplay") : this.t("live"));
        set("detailDisplayNote", metrics.visualThrottled ? this.t("capDisplayNote") : this.t("liveDisplayNote"));
        set("detailBench", this.benchmark.active ? this.t("benchRun", { elapsed: this.getBenchmarkElapsed(metrics.now) }) : (result ? this.t("benchDone") : this.t("idle")));
        set("detailScore", result ? this.t("scoreValue", { value: result.score.toLocaleString() }) : (this.benchmark.active ? this.t("benchAvg", { average: benchStats.averageSpeed.toFixed(1) }) : this.t("scoreEmpty")));
        this.drawPerformanceChart();
    }

    drawPerformanceChart() {
        const canvas = this.elements.performanceChart;
        if (!canvas || !this.performanceDetailsOpen) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        const samples = this.getReportSamples().slice(-PERFORMANCE_CURVE_MAX_SECONDS);
        const chart = { x: 44, y: 22, w: canvas.width - 76, h: canvas.height - 58 };
        const maxFps = Math.max(60, ...samples.map(sample => Number(sample.fps) || 0));
        const maxSpeed = Math.max(200, ...samples.map(sample => Number(sample.speed) || 0), this.state.currentSpeed || 0);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#081225";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = "rgba(145, 208, 255, 0.13)";
        ctx.lineWidth = 1;
        for (let i = 0; i <= 4; i++) {
            const y = chart.y + chart.h * i / 4;
            ctx.beginPath(); ctx.moveTo(chart.x, y); ctx.lineTo(chart.x + chart.w, y); ctx.stroke();
        }
        const targetY = chart.y + chart.h * (1 - 40 / maxFps);
        ctx.setLineDash([5, 4]);
        ctx.strokeStyle = "#ffd166";
        ctx.beginPath(); ctx.moveTo(chart.x, targetY); ctx.lineTo(chart.x + chart.w, targetY); ctx.stroke();
        ctx.setLineDash([]);
        this.drawLineChart(ctx, chart, samples, maxFps, maxSpeed);
        ctx.font = "11px ui-monospace, SFMono-Regular, monospace";
        ctx.fillStyle = "#91a9cb";
        ctx.fillText("60", 10, chart.y + 4);
        ctx.fillText("0", 24, chart.y + chart.h + 4);
        ctx.fillStyle = "#ffd166";
        ctx.fillText(this.t("fpsTarget"), chart.x + 8, targetY - 6);
        ctx.fillStyle = "#54f5aa"; ctx.fillRect(chart.x, canvas.height - 18, 18, 3); ctx.fillText(this.t("fpsLegend"), chart.x + 25, canvas.height - 14);
        ctx.fillStyle = "#3b9cff"; ctx.fillRect(chart.x + 72, canvas.height - 18, 18, 3); ctx.fillText(this.t("speedLegend"), chart.x + 97, canvas.height - 14);
    }

    getBenchmarkElapsed(now = performance.now()) {
        return this.benchmark.active ? Math.max(0, Math.floor((now - this.benchmark.startedAt) / 1000)) : 0;
    }

    roundBenchmarkSpeed(value) {
        if (value >= 100) return Math.round(value);
        if (value >= 10) return Math.round(value * 10) / 10;
        return Math.round(value * 100) / 100;
    }

    toggleBenchmark() {
        if (this.benchmark.active) {
            this.returnToSafeSpeed({ key: "stoppedManually", vars: {} });
            return;
        }
        const now = performance.now();
        this.clearLiveCurveHistory();
        this.benchmark = {
            active: true,
            targetFps: 40,
            durationSeconds: this.state.benchmarkDuration,
            startedAt: now,
            endedAt: 0,
            nextAdjustmentAt: now + 2500,
            samples: [],
            bestStableSpeed: 0,
            peakSpeed: 200,
            status: "",
            statusKey: "calibrating",
            statusVars: {},
            result: null,
            fpsEma: null,
            lastAdjustmentAt: 0,
            lastSetAt: now,
            lastStableSpeed: 200,
            upperSpeedBound: 0,
            stableWindows: 0,
            phase: "warmup"
        };
        this.benchmark.warmupUntil = now + 2500;
        this.state.paused = false;
        this.state.turboActive = false;
        this.state.targetSpeed = 200;
        this.state.currentSpeed = 200;
        this.toggleBenchmarkPanel(true);
        this.lastPerformanceSampleAt = 0;
        this.visualThrottle.lastFullDrawAt = 0;
        this.visualThrottle.lastDisplayInterval = 0;
        this.updateStaticUI();
    }

    finishBenchmark(status) {
        if (!this.benchmark.active) return;
        this.benchmark.endedAt = performance.now();
        if (status && typeof status === "object" && status.key) this.setBenchmarkStatus(status.key, status.vars || {});
        else { this.benchmark.statusKey = null; this.benchmark.statusVars = {}; this.benchmark.status = String(status || ""); }
        this.benchmark.result = this.calculateBenchmarkResult();
        this.benchmark.active = false;
    }

    returnToSafeSpeed(status) {
        this.finishBenchmark(status);
        this.state.paused = false;
        this.state.turboActive = false;
        this.state.targetSpeed = 3;
        this.state.currentSpeed = 3;
        this.visualThrottle.lastFullDrawAt = 0;
        this.visualThrottle.lastDisplayInterval = 0;
        this.updateStaticUI();
    }

    syncBenchmarkSpeedControls() {
        if (!this.elements.panel) return;
        const sliderSpeed = Math.min(this.state.sliderMaxSpeed, this.state.targetSpeed);
        if (this.elements.slider) {
            this.elements.slider.value = sliderSpeed;
            const percent = Math.max(0, Math.min(100, ((sliderSpeed - this.state.minSpeed) * 100) / (this.state.sliderMaxSpeed - this.state.minSpeed)));
            this.elements.slider.style.backgroundSize = percent + "% 100%";
        }
        if (this.elements.speedInput) this.elements.speedInput.value = this.state.targetSpeed.toFixed(1);
    }

    setBenchmarkTarget(speed, metrics, status, waitMs, phase) {
        const benchmark = this.benchmark;
        const next = this.roundBenchmarkSpeed(Math.max(this.state.minSpeed, speed));
        this.state.targetSpeed = next;
        this.state.turboActive = false;
        if (status && typeof status === "object" && status.key) this.setBenchmarkStatus(status.key, status.vars || {});
        else { benchmark.statusKey = null; benchmark.statusVars = {}; benchmark.status = String(status || ""); }
        benchmark.lastAdjustmentAt = metrics.now;
        benchmark.lastSetAt = metrics.now;
        benchmark.nextAdjustmentAt = metrics.now + waitMs;
        benchmark.phase = phase || benchmark.phase;
        this.syncBenchmarkSpeedControls();
    }

    getBenchmarkWindow(benchmark) {
        const afterSet = (benchmark.lastSetAt || benchmark.startedAt) + 700;
        // The controller samples once per second. A short recent window makes
        // the feedback react to the current target instead of stale readings.
        return benchmark.samples.filter(sample => sample.time >= afterSet).slice(-6);
    }

    getWindowFpsStats(samples) {
        if (!samples.length) return { count: 0, min: 0, median: 0, mean: 0 };
        const fps = samples.map(sample => Number(sample.fps) || 0).sort((a, b) => a - b);
        const middle = Math.floor(fps.length / 2);
        const median = fps.length % 2 ? fps[middle] : (fps[middle - 1] + fps[middle]) / 2;
        return {
            count: fps.length,
            min: fps[0],
            median,
            mean: fps.reduce((sum, value) => sum + value, 0) / fps.length
        };
    }

    runBenchmarkController(metrics) {
        const benchmark = this.benchmark;
        if (!benchmark.active) return;
        const rawFps = Number.isFinite(metrics.renderFps) && metrics.renderFps > 0 ? metrics.renderFps : this.stats.fps;
        if (!Number.isFinite(rawFps) || rawFps <= 0) {
            this.setBenchmarkStatus("waitingFps");
            benchmark.nextAdjustmentAt = metrics.now + BENCHMARK_ADJUSTMENT_INTERVAL_MS;
            return;
        }

        const currentTarget = Math.max(this.state.minSpeed, this.state.targetSpeed);
        const window = this.getBenchmarkWindow(benchmark);
        const fps = this.getWindowFpsStats(window);
        const elapsedAtTarget = metrics.now - (benchmark.lastSetAt || benchmark.startedAt);
        const minimumSamples = 2;

        if (metrics.now < benchmark.nextAdjustmentAt) return;
        if (metrics.now < benchmark.warmupUntil) {
            this.setBenchmarkStatus("calibrating");
            benchmark.nextAdjustmentAt = benchmark.warmupUntil;
            return;
        }

        // Wait for two fresh one-second samples after every target change. This
        // filters one-frame laptop lock/unlock events without creating the old
        // multi-second late-run dead zone.
        const settlingMs = benchmark.phase === "recover" ? 1600 : 1200;
        if (elapsedAtTarget < settlingMs || fps.count < minimumSamples) {
            this.setBenchmarkStatus("settling", { speed: currentTarget.toFixed(0), count: fps.count, minimum: minimumSamples });
            benchmark.nextAdjustmentAt = metrics.now + 350;
            return;
        }

        const medianFps = fps.median;
        const meanFps = fps.mean;
        // Median is the primary signal; the mean makes a sustained drift toward
        // the target visible slightly earlier without reacting to one outlier.
        const controlFps = medianFps * 0.70 + meanFps * 0.30;

        // The controller is deliberately closed-loop: every high-FPS window
        // reopens the ramp. It never treats an old upper bound as a permanent
        // ceiling, which was the reason runs could remain near 300x at 60 FPS.
        if (controlFps < 34) {
            const retreat = Math.max(this.state.minSpeed, currentTarget * 0.88);
            benchmark.upperSpeedBound = 0;
            benchmark.stableWindows = 0;
            this.setBenchmarkTarget(
                retreat, metrics,
                { key: "hardBackoff", vars: { from: currentTarget.toFixed(0), to: this.roundBenchmarkSpeed(retreat).toFixed(0), fps: Math.round(controlFps) } },
                1700, "recover"
            );
            return;
        }

        if (controlFps < 38) {
            const retreat = Math.max(this.state.minSpeed, currentTarget * 0.95);
            benchmark.upperSpeedBound = 0;
            benchmark.stableWindows = 0;
            this.setBenchmarkTarget(
                retreat, metrics,
                { key: "stabilityBackoff", vars: { from: currentTarget.toFixed(0), to: this.roundBenchmarkSpeed(retreat).toFixed(0), fps: Math.round(controlFps) } },
                1500, "recover"
            );
            return;
        }

        // Match the report's 38–42 FPS target-hold band, not a loose 45 FPS
        // band. At 43 FPS and above, continue probing upward.
        if (controlFps >= 38 && controlFps <= 42) {
            benchmark.lastStableSpeed = Math.max(benchmark.lastStableSpeed || 0, currentTarget);
            benchmark.bestStableSpeed = Math.max(benchmark.bestStableSpeed || 0, currentTarget);
            benchmark.upperSpeedBound = 0;
            benchmark.stableWindows = Math.min(3, benchmark.stableWindows + 1);
            this.setBenchmarkStatus("targetStable", { speed: currentTarget.toFixed(0), min: Math.round(fps.min), median: Math.round(medianFps) });
            benchmark.nextAdjustmentAt = metrics.now + 1400;
            benchmark.phase = "hold";
            return;
        }

        benchmark.lastStableSpeed = Math.max(benchmark.lastStableSpeed || 0, currentTarget);
        benchmark.bestStableSpeed = Math.max(benchmark.bestStableSpeed || 0, currentTarget);
        benchmark.upperSpeedBound = 0;
        benchmark.stableWindows = 0;

        let step;
        let waitMs;
        let phase;
        if (controlFps >= 58) {
            step = Math.min(160, Math.max(32, currentTarget * 0.18));
            waitMs = 1200;
            phase = "fast-ramp";
        } else if (controlFps >= 50) {
            step = Math.min(80, Math.max(14, currentTarget * 0.10));
            waitMs = 1300;
            phase = "ramp";
        } else {
            // 43–49 FPS: small probes converge on 40 without the previous
            // oscillation between a large jump and a large recovery.
            step = Math.min(32, Math.max(4, currentTarget * 0.035));
            waitMs = 1450;
            phase = "precision";
        }
        const nextTarget = currentTarget + step;
        this.setBenchmarkTarget(
            nextTarget, metrics,
            { key: phase === "fast-ramp" ? "fastRamp" : "precisionProbe", vars: { from: currentTarget.toFixed(0), to: this.roundBenchmarkSpeed(nextTarget).toFixed(0), fps: Math.round(medianFps) } },
            waitMs, phase
        );
    }

    recordPerformance(metrics) {
        const isBenchmark = this.benchmark.active;
        const isLiveCurveOpen = this.performanceDetailsOpen && !isBenchmark;
        if (!isBenchmark && !isLiveCurveOpen) return;
        if (metrics.now - this.lastPerformanceSampleAt < 1000) return;
        this.lastPerformanceSampleAt = metrics.now;
        const sample = {
            time: metrics.now,
            fps: metrics.renderFps,
            displayFps: metrics.displayFps,
            speed: metrics.speed,
            targetSpeed: metrics.targetSpeed,
            tickRate: metrics.tickRate,
            tickMs: metrics.tickMs,
            entityCount: metrics.entityCount
        };
        if (isLiveCurveOpen) {
            this.performanceHistory.push(sample);
            const cutoff = sample.time - PERFORMANCE_CURVE_MAX_SECONDS * 1000;
            while (this.performanceHistory.length && this.performanceHistory[0].time < cutoff) {
                this.performanceHistory.shift();
            }
            if (this.performanceHistory.length > PERFORMANCE_CURVE_MAX_SECONDS) this.performanceHistory.shift();
        }
        if (isBenchmark) {
            this.benchmark.samples.push(sample);
            if (this.benchmark.samples.length > 1200) this.benchmark.samples.shift();
            this.benchmark.peakSpeed = Math.max(this.benchmark.peakSpeed, metrics.speed);
            const fps = Number.isFinite(metrics.renderFps) ? metrics.renderFps : 0;
            this.benchmark.fpsEma = this.benchmark.fpsEma == null ? fps : this.benchmark.fpsEma * 0.80 + fps * 0.20;
            if (metrics.renderFps >= this.benchmark.targetFps) {
                this.benchmark.bestStableSpeed = Math.max(this.benchmark.bestStableSpeed, metrics.speed);
            }
        }
    }

    enforceBenchmarkDuration(metrics) {
        if (!this.benchmark.active) return;
        if (metrics.now - this.benchmark.startedAt >= this.benchmark.durationSeconds * 1000) {
            this.returnToSafeSpeed({ key: "completed", vars: { duration: this.benchmark.durationSeconds } });
        }
    }

    getBenchmarkStats(samples = []) {
        if (!samples.length) return { averageSpeed: 0, averageFps: 0, averageTickMs: 0, stability: 0, targetHold: 0 };
        const target = this.benchmark.targetFps || 40;
        let speed = 0, fps = 0, tick = 0, tickCount = 0, stability = 0, targetHold = 0;
        for (const sample of samples) {
            speed += Number(sample.speed) || 0;
            fps += Number(sample.fps) || 0;
            if (Number.isFinite(sample.tickMs) && sample.tickMs > 0) { tick += sample.tickMs; tickCount++; }
            stability += Math.max(0, 1 - Math.abs((Number(sample.fps) || 0) - target) / target);
            if ((Number(sample.fps) || 0) >= target - 2 && (Number(sample.fps) || 0) <= target + 2) targetHold++;
        }
        return {
            averageSpeed: speed / samples.length,
            averageFps: fps / samples.length,
            averageTickMs: tickCount ? tick / tickCount : 0,
            stability: stability / samples.length,
            targetHold: targetHold / samples.length
        };
    }

    getMachineWeight(components) {
        let weight = 1;
        if (components.Belt) weight += 0.8;
        if (components.ItemProcessor) weight += 4;
        if (components.Miner) weight += 2.5;
        if (components.ItemEjector) weight += 1.1;
        if (components.ItemAcceptor) weight += 1;
        if (components.UndergroundBelt) weight += 1.4;
        if (components.Storage) weight += 1.2;
        if (components.Wire || components.WiredPins) weight += 0.4;
        return weight;
    }

    captureMachineStress(averageSpeed, averageTickMs) {
        const root = this.getGameRoot();
        const entities = root && root.entityMgr && Array.isArray(root.entityMgr.entities) ? root.entityMgr.entities : [];
        const groups = new Map();
        for (const entity of entities) {
            const components = entity && entity.components;
            if (!components || !components.StaticMapEntity) continue;
            let label = "unknown-machine";
            try {
                const meta = components.StaticMapEntity.getMetaBuilding();
                label = meta && (typeof meta.getId === "function" ? meta.getId() : meta.id) || label;
            } catch (error) { }
            const weight = this.getMachineWeight(components);
            const entry = groups.get(label) || { id: label, count: 0, baseLoad: 0 };
            entry.count++;
            entry.baseLoad += weight;
            groups.set(label, entry);
        }
        const tickFactor = 1 + Math.min(2, Math.max(0, averageTickMs) / 10);
        const rows = Array.from(groups.values()).map(entry => ({
            ...entry,
            pressure: entry.baseLoad * averageSpeed * tickFactor
        })).sort((a, b) => b.pressure - a.pressure);
        return {
            rows,
            totalBaseLoad: rows.reduce((sum, row) => sum + row.baseLoad, 0),
            totalPressure: rows.reduce((sum, row) => sum + row.pressure, 0)
        };
    }

    calculateBenchmarkResult() {
        const stats = this.getBenchmarkStats(this.benchmark.samples);
        const machines = this.captureMachineStress(stats.averageSpeed, stats.averageTickMs);
        const score = Math.round(
            stats.averageSpeed * machines.totalBaseLoad *
            (0.5 + stats.stability * 0.5) *
            (0.5 + stats.targetHold * 0.5)
        );
        return {
            ...stats,
            ...machines,
            score,
            peakSpeed: this.benchmark.peakSpeed || 0,
            durationSeconds: this.benchmark.durationSeconds
        };
    }

    getBenchmarkStatus() {
        const benchmark = this.benchmark;
        const status = this.getBenchmarkStatusText();
        if (benchmark.active) {
            const stats = this.getBenchmarkStats(benchmark.samples);
            return this.t("benchmarkRunning", { elapsed: this.getBenchmarkElapsed(), duration: benchmark.durationSeconds, status, average: stats.averageSpeed.toFixed(1) });
        }
        if (benchmark.result) {
            return this.t("lastScore", { score: benchmark.result.score.toLocaleString(), average: benchmark.result.averageSpeed.toFixed(1), status });
        }
        return this.t("benchmarkIdleStatus");
    }

    getReportSamples() {
        if (this.benchmark.samples.length) return this.benchmark.samples.slice(-1200);
        return this.performanceHistory.slice(-PERFORMANCE_CURVE_MAX_SECONDS);
    }

    getReportData() {
        this.syncLocale();
        const samples = this.getReportSamples();
        const metrics = this.getGameMetrics();
        const result = this.benchmark.result || this.calculateBenchmarkResult();
        const peakSpeed = Math.max(
            this.benchmark.peakSpeed || 0,
            result.peakSpeed || 0,
            ...samples.map(sample => Number(sample.speed) || 0),
            0
        );
        return { samples, metrics, result, peakSpeed, generatedAt: new Date() };
    }

    formatReportNumber(value, digits = 1) {
        return Number.isFinite(value) ? Number(value).toFixed(digits) : "—";
    }

    escapeReportHtml(value) {
        return String(value === undefined || value === null ? "" : value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    getReportFileStamp() {
        return new Date().toISOString().replace(/[:.]/g, "-");
    }

    downloadBlob(content, mimeType, filename) {
        try {
            const blob = new Blob([content], { type: mimeType });
            const urlApi = (typeof URL !== "undefined" && URL) || (typeof window !== "undefined" && window.URL);
            if (urlApi && typeof urlApi.createObjectURL === "function") {
                const url = urlApi.createObjectURL(blob);
                const link = document.createElement("a");
                link.href = url;
                link.download = filename;
                link.style.display = "none";
                document.body.appendChild(link);
                link.click();
                link.remove();
                if (typeof urlApi.revokeObjectURL === "function") setTimeout(() => urlApi.revokeObjectURL(url), 1000);
                return true;
            }
            const link = document.createElement("a");
            link.href = "data:" + mimeType + ";charset=utf-8," + encodeURIComponent(content);
            link.download = filename;
            link.style.display = "none";
            document.body.appendChild(link);
            link.click();
            link.remove();
            return true;
        } catch (error) {
            return false;
        }
    }

    buildReportSvg(data) {
        const width = 1160;
        const height = 430;
        const chart = { x: 68, y: 54, w: 730, h: 290 };
        const samples = data.samples;
        const maxFps = Math.max(60, ...samples.map(sample => Number(sample.fps) || 0));
        const maxSpeed = Math.max(200, ...samples.map(sample => Number(sample.speed) || 0), data.peakSpeed || 0);
        const esc = value => this.escapeReportHtml(value);
        const pathFor = (key, maxValue) => {
            if (!samples.length) return "";
            return samples.map((sample, index) => {
                const ratio = samples.length === 1 ? 0 : index / (samples.length - 1);
                const x = chart.x + ratio * chart.w;
                const value = Math.max(0, Math.min(1, (Number(sample[key]) || 0) / Math.max(1, maxValue)));
                const y = chart.y + chart.h * (1 - value);
                return (index ? "L" : "M") + x.toFixed(1) + " " + y.toFixed(1);
            }).join(" ");
        };
        let grid = "";
        for (let i = 0; i <= 4; i++) {
            const y = chart.y + chart.h * i / 4;
            grid += `<line x1="${chart.x}" y1="${y}" x2="${chart.x + chart.w}" y2="${y}" />`;
            grid += `<text x="12" y="${y + 4}">${Math.round(maxFps * (4 - i) / 4)} FPS</text>`;
            grid += `<text x="${chart.x + chart.w + 14}" y="${y + 4}">${Math.round(maxSpeed * (4 - i) / 4)}x</text>`;
        }
        const targetY = chart.y + chart.h * (1 - 40 / maxFps);
        let bars = "";
        const pressureRows = data.result.rows.slice(0, 8);
        const maxPressure = Math.max(1, ...pressureRows.map(row => Number(row.pressure) || 0));
        pressureRows.forEach((row, index) => {
            const y = 62 + index * 39;
            const fillWidth = 330 * (Number(row.pressure) || 0) / maxPressure;
            bars += `<text class="machine-label" x="850" y="${y}">${esc(String(row.id))} ×${row.count}</text>`;
            bars += `<rect class="bar-bg" x="850" y="${y + 7}" width="330" height="18" rx="3" />`;
            bars += `<rect class="bar-fill" x="850" y="${y + 7}" width="${fillWidth.toFixed(1)}" height="18" rx="3" />`;
            bars += `<text class="machine-value" x="1178" y="${y + 20}" text-anchor="end">${Math.round(row.pressure).toLocaleString()}</text>`;
        });
        return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="${esc(this.t("reportAria"))}">
            <defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#07111f"/><stop offset="0.55" stop-color="#12102b"/><stop offset="1" stop-color="#03151b"/></linearGradient><linearGradient id="bar" x1="0" x2="1"><stop stop-color="#923cff"/><stop offset="1" stop-color="#2fe8c1"/></linearGradient></defs>
            <rect width="${width}" height="${height}" fill="url(#bg)"/>
            <rect x="40" y="28" width="770" height="350" class="card"/>
            <text class="chart-title" x="68" y="40">${esc(this.t("adaptiveCurves"))}</text>
            <g class="grid">${grid}</g>
            <line class="target" x1="${chart.x}" y1="${targetY}" x2="${chart.x + chart.w}" y2="${targetY}"/><text class="target-label" x="${chart.x + 8}" y="${targetY - 8}">${esc(this.t("fpsTarget"))}</text>
            <path class="fps-line" d="${pathFor("fps", maxFps)}"/><path class="speed-line" d="${pathFor("speed", maxSpeed)}"/>
            <line class="legend-fps" x1="68" y1="362" x2="88" y2="362"/><text x="96" y="366">${esc(this.t("fpsLegend"))}</text><line class="legend-speed" x1="140" y1="362" x2="160" y2="362"/><text x="168" y="366">${esc(this.t("speedLegend"))}</text>
            <rect x="828" y="28" width="384" height="350" class="card"/><text class="chart-title" x="850" y="54">${esc(this.t("machinePressureIndex"))}</text>${bars}
            <text class="empty" x="850" y="88" style="display:${pressureRows.length ? "none" : "block"}">${esc(this.t("noMachineSamples"))}</text>
        </svg>`;
    }

    buildTextReport(data) {
        const result = data.result;
        const lines = [
            this.t("reportTitle"),
            this.t("generated", { value: data.generatedAt.toISOString() }),
            this.t("status", { value: this.getBenchmarkStatusText() }),
            this.t("durationReport", { value: result.durationSeconds || this.state.benchmarkDuration }),
            "", this.t("summary"),
            this.t("scoreReport", { value: result.score.toLocaleString() }),
            this.t("averageSpeed", { value: this.formatReportNumber(result.averageSpeed) }),
            this.t("peakSpeed", { value: this.formatReportNumber(data.peakSpeed) }),
            this.t("averageGameFps", { value: this.formatReportNumber(result.averageFps) }),
            this.t("targetHold", { value: this.formatReportNumber(result.targetHold * 100, 1) }),
            this.t("stability", { value: this.formatReportNumber(result.stability * 100, 1) }),
            this.t("averageTickCost", { value: result.averageTickMs ? this.formatReportNumber(result.averageTickMs, 3) : "—" }),
            this.t("totalMachinePressure", { value: Math.round(result.totalPressure).toLocaleString() }),
            this.t("totalBaseLoad", { value: this.formatReportNumber(result.totalBaseLoad, 2) }),
            "", this.t("machinePressure")
        ];
        if (result.rows.length) {
            result.rows.forEach(row => lines.push(this.t("machineRow", {
                id: row.id, count: row.count, pressure: Math.round(row.pressure).toLocaleString(), base: this.formatReportNumber(row.baseLoad, 2)
            })));
        } else lines.push(this.t("noMachineSamples"));
        lines.push("", this.t("sampleHeader"));
        data.samples.forEach(sample => lines.push([
            Math.round(sample.time), this.formatReportNumber(sample.fps, 2), this.formatReportNumber(sample.speed, 2),
            this.formatReportNumber(sample.tickMs, 3), sample.entityCount === null || sample.entityCount === undefined ? "—" : sample.entityCount
        ].join(" | ")));
        return lines.join("\n");
    }

    buildHtmlReport(data) {
        const result = data.result;
        const esc = value => this.escapeReportHtml(value);
        const summary = [
            [this.t("scoreLabel"), result.score.toLocaleString()],
            [this.t("averageSpeedLabel"), this.formatReportNumber(result.averageSpeed) + "x"],
            [this.t("averageFpsLabel"), this.formatReportNumber(result.averageFps)],
            [this.t("targetHoldLabel"), this.formatReportNumber(result.targetHold * 100, 0) + "%"],
            [this.t("stabilityLabel"), this.formatReportNumber(result.stability * 100, 0) + "%"],
            [this.t("peakSpeedLabel"), this.formatReportNumber(data.peakSpeed) + "x"]
        ].map(item => `<div class="metric"><span>${esc(item[0])}</span><strong>${esc(item[1])}</strong></div>`).join("");
        const rows = result.rows.length ? result.rows.map(row => `<tr><td>${esc(row.id)}</td><td>${row.count}</td><td>${Math.round(row.pressure).toLocaleString()}</td><td>${this.formatReportNumber(row.baseLoad, 2)}</td></tr>`).join("") : `<tr><td colspan="4">${esc(this.t("noMachineSamples"))}</td></tr>`;
        const sampleRows = data.samples.map(sample => `<tr><td>${Math.round(sample.time)}</td><td>${this.formatReportNumber(sample.fps, 2)}</td><td>${this.formatReportNumber(sample.speed, 2)}</td><td>${this.formatReportNumber(sample.tickMs, 3)}</td><td>${sample.entityCount === null || sample.entityCount === undefined ? "—" : sample.entityCount}</td></tr>`).join("");
        return `<!doctype html><html lang="${this.locale === "zh" ? "zh-CN" : "en"}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(this.t("reportTitle"))}</title><style>
            :root{color-scheme:dark;--bg:#070d1b;--card:#101b34;--line:#29466b;--text:#edf6ff;--muted:#91a9cb;--green:#54f5aa;--blue:#3b9cff;--yellow:#ffd166}*{box-sizing:border-box}body{margin:0;padding:32px;background:radial-gradient(circle at 15% 0,#18234a 0,#070d1b 55%,#03151b 100%);color:var(--text);font:14px ui-monospace,SFMono-Regular,Menlo,monospace}main{max-width:1220px;margin:auto}.top{display:flex;justify-content:space-between;gap:24px;align-items:flex-start;margin-bottom:24px}h1{font:800 34px system-ui,sans-serif;letter-spacing:.02em;margin:0 0 8px}.sub{color:#77baff}.metrics{display:grid;grid-template-columns:repeat(6,1fr);gap:10px;margin:18px 0}.metric,.card{background:rgba(16,27,52,.88);border:1px solid var(--line);padding:14px}.metric span{display:block;color:var(--muted);font-size:11px;margin-bottom:8px}.metric strong{font-size:20px}.report-card{border:1px solid var(--line);background:rgba(10,18,37,.8);padding:10px;margin:16px 0}.report-card svg{display:block;width:100%;height:auto}.report-card svg .card{fill:#0f1a31;stroke:#29466b}.report-card svg .grid line{stroke:#ffffff22}.report-card svg .grid text{fill:#8290b2;font-size:10px}.report-card svg .chart-title{fill:#c4d4f7;font-size:14px;font-weight:700}.report-card svg .target{stroke:var(--yellow);stroke-dasharray:6 5}.report-card svg .target-label{fill:var(--yellow);font-size:11px}.report-card svg .fps-line{fill:none;stroke:var(--green);stroke-width:2.5}.report-card svg .speed-line{fill:none;stroke:var(--blue);stroke-width:2.5}.report-card svg .legend-fps{stroke:var(--green);stroke-width:4}.report-card svg .legend-speed{stroke:var(--blue);stroke-width:4}.report-card svg text{fill:#c4d4f7;font-size:11px}.report-card svg .machine-label{fill:#e6efff;font-size:10px}.report-card svg .machine-value{fill:#9badcf;font-size:10px}.report-card svg .bar-bg{fill:#ffffff12}.report-card svg .bar-fill{fill:url(#bar)}h2{font-size:15px;letter-spacing:.05em}table{border-collapse:collapse;width:100%;margin-top:10px}th,td{text-align:left;border-bottom:1px solid #ffffff14;padding:8px;color:var(--muted)}th{color:var(--text);font-size:11px}details{margin-top:16px}summary{cursor:pointer;color:#bcd7ff}pre{overflow:auto;color:#bcd7ff;line-height:1.5}footer{color:var(--muted);font-size:11px;margin-top:18px}@media(max-width:850px){body{padding:16px}.metrics{grid-template-columns:repeat(2,1fr)}.top{display:block}.top .card{margin-top:16px}}
        </style></head><body><main><div class="top"><div><h1>${esc(this.t("title"))}</h1><div class="sub">${esc(this.t("reportSubtitle", { value: data.generatedAt.toLocaleString() }))}</div></div><div class="card"><div style="color:#a7d6ff;font-size:11px">${esc(this.t("scoreCardLabel"))}</div><div style="color:var(--green);font-size:36px;font-weight:800;margin-top:8px">${esc(result.score.toLocaleString())}</div></div></div><section class="metrics">${summary}</section><section class="report-card">${this.buildReportSvg(data)}</section><section class="report-card"><h2>${esc(this.t("machinePressureIndex"))}</h2><table><thead><tr><th>${esc(this.t("machine"))}</th><th>${esc(this.t("count"))}</th><th>${esc(this.t("pressure"))}</th><th>${esc(this.t("baseLoad"))}</th></tr></thead><tbody>${rows}</tbody></table></section><details class="report-card"><summary>${esc(this.t("rawSamples", { count: data.samples.length }))}</summary><table><thead><tr><th>${esc(this.t("timeMs"))}</th><th>${esc(this.t("reportGameFps"))}</th><th>${esc(this.t("speed"))}</th><th>${esc(this.t("tickMs"))}</th><th>${esc(this.t("entities"))}</th></tr></thead><tbody>${sampleRows || `<tr><td colspan="5">${esc(this.t("noMachineSamples"))}</td></tr>`}</tbody></table></details><footer>${esc(this.t("visualFooter"))}</footer></main></body></html>`;
    }

    exportPerformanceReport() {
        const data = this.getReportData();
        const W = 1280;
        const H = 820;
        const canvas = document.createElement("canvas");
        // Render at 2x physical resolution while keeping the existing logical layout.
        canvas.width = W * 2;
        canvas.height = H * 2;
        const ctx = canvas.getContext("2d");
        if (!ctx) return null;
        ctx.scale(2, 2);

        const result = data.result;
        const samples = data.samples;
        const background = ctx.createLinearGradient(0, 0, W, H);
        background.addColorStop(0, "#07111f");
        background.addColorStop(0.55, "#12102b");
        background.addColorStop(1, "#03151b");
        ctx.fillStyle = background;
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = "rgba(80,210,255,0.08)";
        for (let x = -300; x < W; x += 90) ctx.fillRect(x, 0, 1, H);

        const card = (x, y, w, h) => {
            ctx.fillStyle = "rgba(14, 24, 48, 0.90)";
            ctx.fillRect(x, y, w, h);
            ctx.strokeStyle = "rgba(125, 207, 255, 0.30)";
            ctx.lineWidth = 1;
            ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
        };
        ctx.fillStyle = "#ffffff";
        ctx.font = "700 34px -apple-system, BlinkMacSystemFont, sans-serif";
        ctx.fillText(this.t("title"), 56, 66);
        ctx.fillStyle = "#77baff";
        ctx.font = "13px ui-monospace, SFMono-Regular, monospace";
        ctx.fillText(this.t("reportSubtitle", { value: data.generatedAt.toLocaleString() }), 58, 92);

        card(925, 34, 298, 112);
        ctx.fillStyle = "#a7d6ff";
        ctx.font = "12px ui-monospace, monospace";
        ctx.fillText(this.t("scoreCardLabel"), 946, 62);
        ctx.fillStyle = "#54f5aa";
        ctx.font = "700 42px ui-monospace, monospace";
        ctx.fillText(result.score.toLocaleString(), 946, 110);
        ctx.fillStyle = "#a1a1aa";
        ctx.font = "11px ui-monospace, monospace";
        ctx.fillText(this.t("scoreCardNote"), 946, 130);

        const summary = [
            [this.t("averageSpeedLabel"), this.formatReportNumber(result.averageSpeed) + "x"],
            [this.t("averageFpsLabel"), this.formatReportNumber(result.averageFps)],
            [this.t("targetHoldLabel"), this.formatReportNumber(result.targetHold * 100, 0) + "%"],
            [this.t("stabilityLabel"), this.formatReportNumber(result.stability * 100, 0) + "%"],
            [this.t("avgTickLabel"), result.averageTickMs ? this.formatReportNumber(result.averageTickMs, 3) + " ms" : "—"],
            [this.t("entitiesLabel"), data.metrics.entityCount === null ? "—" : String(data.metrics.entityCount)]
        ];
        for (let i = 0; i < summary.length; i++) {
            const x = 56 + (i % 3) * 278;
            const y = 170 + Math.floor(i / 3) * 92;
            card(x, y, 250, 70);
            ctx.fillStyle = "#9ba9c9";
            ctx.font = "11px ui-monospace, monospace";
            ctx.fillText(summary[i][0], x + 15, y + 22);
            ctx.fillStyle = "#ffffff";
            ctx.font = "700 23px ui-monospace, monospace";
            ctx.fillText(summary[i][1], x + 15, y + 50);
        }

        // Main cards start below the second summary row, leaving a visible gap.
        const chart = { x: 56, y: 410, w: 720, h: 280 };
        card(40, 368, 752, 350);
        ctx.fillStyle = "#c4d4f7";
        ctx.font = "600 14px ui-monospace, monospace";
        ctx.fillText(this.t("adaptiveCurves"), chart.x, chart.y - 16);
        const maxFps = Math.max(60, ...samples.map(sample => Number(sample.fps) || 0));
        const maxSpeed = Math.max(200, ...samples.map(sample => Number(sample.speed) || 0), data.peakSpeed || 0);
        ctx.strokeStyle = "rgba(255,255,255,0.12)";
        ctx.lineWidth = 1;
        for (let i = 0; i <= 4; i++) {
            const y = chart.y + chart.h * i / 4;
            ctx.beginPath(); ctx.moveTo(chart.x, y); ctx.lineTo(chart.x + chart.w, y); ctx.stroke();
            ctx.fillStyle = "#8290b2";
            ctx.font = "10px ui-monospace, monospace";
            ctx.fillText(Math.round(maxFps * (4 - i) / 4) + " FPS", chart.x - 44, y + 4);
            ctx.fillText((maxSpeed * (4 - i) / 4).toFixed(0) + "x", chart.x + chart.w + 10, y + 4);
        }
        const targetY = chart.y + chart.h * (1 - 40 / maxFps);
        ctx.setLineDash([6, 5]);
        ctx.strokeStyle = "#ffd60a";
        ctx.beginPath(); ctx.moveTo(chart.x, targetY); ctx.lineTo(chart.x + chart.w, targetY); ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = "#ffd60a";
        ctx.fillText(this.t("fpsTarget"), chart.x + 8, targetY - 8);
        this.drawLineChart(ctx, chart, samples, maxFps, maxSpeed);
        ctx.fillStyle = "#54f5aa"; ctx.fillRect(chart.x, chart.y + chart.h + 22, 18, 4); ctx.fillStyle = "#c4d4f7"; ctx.fillText(this.t("fpsLegend"), chart.x + 26, chart.y + chart.h + 26);
        ctx.fillStyle = "#3b9cff"; ctx.fillRect(chart.x + 90, chart.y + chart.h + 22, 18, 4); ctx.fillStyle = "#c4d4f7"; ctx.fillText(this.t("pngLegendSpeed"), chart.x + 116, chart.y + chart.h + 26);

        const bars = result.rows.slice(0, 8);
        const pressureCard = { x: 825, y: 368, w: 398, h: 350 };
        card(pressureCard.x, pressureCard.y, pressureCard.w, pressureCard.h);
        ctx.fillStyle = "#c4d4f7";
        ctx.font = "600 14px ui-monospace, monospace";
        ctx.fillText(this.t("machinePressureIndex"), 846, 397);
        const barX = 860, barY = 430, barW = 350, barH = 18;
        const maxPressure = Math.max(1, ...bars.map(row => Number(row.pressure) || 0));
        for (let i = 0; i < bars.length; i++) {
            const row = bars[i];
            const y = barY + i * 37;
            const gradient = ctx.createLinearGradient(barX, 0, barX + barW, 0);
            gradient.addColorStop(0, "#923cff");
            gradient.addColorStop(1, "#2fe8c1");
            ctx.fillStyle = "rgba(255,255,255,0.08)";
            ctx.fillRect(barX, y, barW, barH);
            ctx.fillStyle = gradient;
            ctx.fillRect(barX, y, barW * (Number(row.pressure) || 0) / maxPressure, barH);
            ctx.fillStyle = "#e6efff";
            ctx.font = "10px ui-monospace, monospace";
            const name = String(row.id).length > 23 ? String(row.id).slice(0, 22) + "…" : String(row.id);
            ctx.fillText(name + " ×" + row.count, 846, y - 5);
            ctx.fillStyle = "#9badcf";
            ctx.fillText(Math.round(row.pressure).toLocaleString(), 1135, y + 13);
        }
        if (!bars.length) {
            ctx.fillStyle = "#8290b2";
            ctx.font = "11px ui-monospace, monospace";
            ctx.fillText(this.t("noMachineSamples"), 846, 438);
        }
        ctx.fillStyle = "#88a3cf";
        ctx.font = "11px ui-monospace, monospace";
        ctx.fillText(this.t("pressureFormula"), 56, 778);
        ctx.fillText(this.t("totalPressure", { value: Math.round(result.totalPressure).toLocaleString(), peak: this.formatReportNumber(data.peakSpeed) }), 744, 778);

        const filename = "factory-stress-lab-" + this.getReportFileStamp() + ".png";
        const dataUrl = canvas.toDataURL("image/png");
        const link = document.createElement("a");
        link.href = dataUrl;
        link.download = filename;
        link.style.display = "none";
        document.body.appendChild(link);
        link.click();
        link.remove();
        this.setBenchmarkStatus("exportPngDone");
        this.updateStaticUI();
        return dataUrl;
    }

    exportHtmlReport() {
        const data = this.getReportData();
        const html = this.buildHtmlReport(data);
        this.downloadBlob(html, "text/html;charset=utf-8", "factory-stress-lab-" + this.getReportFileStamp() + ".html");
        this.setBenchmarkStatus("exportWebDone");
        this.updateStaticUI();
        return html;
    }

    exportTextReport() {
        const data = this.getReportData();
        const report = this.buildTextReport(data);
        this.downloadBlob(report, "text/plain;charset=utf-8", "factory-stress-lab-" + this.getReportFileStamp() + ".txt");
        this.setBenchmarkStatus("exportTextDone");
        this.updateStaticUI();
        return report;
    }

    drawLineChart(ctx, chart, samples, maxFps, maxSpeed) {
        const draw = (key, maxValue, color) => {
            if (!samples.length) return;
            ctx.strokeStyle = color;
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            for (let i = 0; i < samples.length; i++) {
                const ratio = samples.length === 1 ? 0 : i / (samples.length - 1);
                const x = chart.x + ratio * chart.w;
                const value = Math.max(0, Math.min(1, (Number(samples[i][key]) || 0) / Math.max(1, maxValue)));
                const y = chart.y + chart.h * (1 - value);
                if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
            }
            ctx.stroke();
        };
        draw("fps", maxFps, "#54f5aa");
        draw("speed", maxSpeed, "#3b9cff");
    }

    drawLiveChart() {
        const details = this.elements.liveChartDetails;
        const canvas = this.elements.liveChart;
        if (!details || !this.state.liveChartOpen || !canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        const samples = this.getReportSamples().slice(-Math.min(90, PERFORMANCE_CURVE_MAX_SECONDS));
        const chart = { x: 44, y: 24, w: canvas.width - 76, h: canvas.height - 60 };
        const maxFps = Math.max(60, ...samples.map(sample => Number(sample.fps) || 0));
        const maxSpeed = Math.max(200, ...samples.map(sample => Number(sample.speed) || 0), this.state.currentSpeed || 0);
        ctx.fillStyle = "#081225";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = "rgba(145, 208, 255, 0.13)";
        ctx.lineWidth = 1;
        for (let i = 0; i <= 4; i++) {
            const y = chart.y + chart.h * i / 4;
            ctx.beginPath(); ctx.moveTo(chart.x, y); ctx.lineTo(chart.x + chart.w, y); ctx.stroke();
        }
        const targetY = chart.y + chart.h * (1 - 40 / maxFps);
        ctx.setLineDash([5, 4]);
        ctx.strokeStyle = "#ffd166";
        ctx.beginPath(); ctx.moveTo(chart.x, targetY); ctx.lineTo(chart.x + chart.w, targetY); ctx.stroke();
        ctx.setLineDash([]);
        this.drawLineChart(ctx, chart, samples, maxFps, maxSpeed);
        ctx.font = "11px ui-monospace, monospace";
        ctx.fillStyle = "#54f5aa"; ctx.fillText(this.t("fpsLegend"), 8, 14);
        ctx.fillStyle = "#3b9cff"; ctx.fillText(this.t("speedLegend"), canvas.width - 48, 14);
    }

    updateDynamicStatsUI() {
        if (!this.elements.panel) return;
        if (this.syncLocale()) return;
        const metrics = this.getGameMetrics();
        this.recordPerformance(metrics);
        this.runBenchmarkController(metrics);
        this.enforceBenchmarkDuration(metrics);
        const displayMetrics = this.getGameMetrics();
        if (this.elements.benchmarkStatus) this.elements.benchmarkStatus.textContent = this.getBenchmarkStatus();

        const fpsValue = displayMetrics.renderFps > 0 ? displayMetrics.renderFps : this.stats.fps;
        this.elements.valFps.textContent = Math.round(fpsValue);
        if (this.elements.miniValFps) this.elements.miniValFps.textContent = Math.round(fpsValue);
        let dotColor = "var(--st-green)";
        if (fpsValue < 30) dotColor = "var(--st-hot)";
        else if (fpsValue < 50) dotColor = "var(--st-warm)";
        this.elements.fpsDot.style.backgroundColor = dotColor;
        this.elements.fpsDot.style.boxShadow = "0 0 8px " + dotColor;
        if (this.elements.miniFpsDot) {
            this.elements.miniFpsDot.style.backgroundColor = dotColor;
            this.elements.miniFpsDot.style.boxShadow = "0 0 8px " + dotColor;
        }
        if (this.elements.fpsBadge) this.elements.fpsBadge.setAttribute("aria-label", this.getPerformanceTooltip(displayMetrics));
        if (this.elements.miniFpsBadge) this.elements.miniFpsBadge.setAttribute("aria-label", this.getPerformanceTooltip(displayMetrics));
        this.updatePerformanceDetails(displayMetrics);
        this.drawLiveChart();
    }

    registerCss() {
        this.modInterface.registerCss(`
            :root {
                --st-cyan: #66e3ff;
                --st-blue: #3b9cff;
                --st-purple: #9b5cff;
                --st-hot: #ff5b70;
                --st-warm: #ffd166;
                --st-green: #54f5aa;
                --st-text: #f2f7ff;
                --st-muted: #91a9cb;
                --st-panel: rgba(9, 17, 35, 0.97);
                --st-panel-2: rgba(16, 28, 55, 0.92);
                --st-control-bg: rgba(117, 145, 190, 0.17);
                --st-border: rgba(132, 194, 255, 0.24);
            }

            #st-root-container {
                position: fixed;
                top: 14px;
                left: 50%;
                transform: translateX(-50%);
                z-index: 9999;
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 8px;
                pointer-events: none;
                font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", sans-serif;
                -webkit-font-smoothing: antialiased;
            }

            #st-top-pill, #st-panel { pointer-events: auto; }

            #st-top-pill {
                display: flex;
                align-items: center;
                gap: 4px;
                padding: 4px 6px;
                border: 1px solid var(--st-border);
                border-radius: 999px;
                background: var(--st-panel);
                box-shadow: 0 7px 24px rgba(0, 0, 0, 0.34), 0 0 18px rgba(59, 156, 255, 0.08);
            }

            .st-top-element {
                height: 30px;
                display: flex;
                align-items: center;
                justify-content: center;
                box-sizing: border-box;
            }

            #st-mini-fps-badge {
                gap: 6px;
                padding: 0 10px;
                border: 0;
                border-radius: 999px;
                background: rgba(0, 0, 0, 0.22);
                color: var(--st-muted);
                font-size: 11px;
                font-weight: 750;
                cursor: pointer;
            }
            #st-mini-fps-badge:hover { background: rgba(102, 227, 255, 0.12); color: var(--st-text); }
            .st-mini-fps-label { font-size: 9px; letter-spacing: 0.08em; opacity: 0.72; }

            #st-launcher {
                min-width: 76px;
                padding: 0 14px;
                border: 0;
                border-radius: 999px;
                background: transparent;
                color: var(--st-text);
                font-size: 14px;
                font-weight: 800;
                letter-spacing: 0.04em;
                font-variant-numeric: tabular-nums;
                cursor: pointer;
            }
            #st-launcher:hover { background: rgba(102, 227, 255, 0.10); }
            #st-launcher.active { background: rgba(59, 156, 255, 0.18); color: var(--st-cyan) !important; }

            #st-mini-pause-btn {
                width: 30px;
                border: 0;
                border-radius: 50%;
                background: transparent;
                cursor: pointer;
            }
            #st-mini-pause-btn:hover { background: rgba(255, 255, 255, 0.10); }
            #st-mini-pause-btn img { width: 10px; height: 10px; filter: invert(1); }

            #st-panel {
                display: flex;
                flex-direction: column;
                gap: 12px;
                width: min(390px, calc(100vw - 24px));
                max-height: calc(100vh - 68px);
                box-sizing: border-box;
                overflow-y: auto;
                padding: 16px 16px 9px;
                border: 1px solid var(--st-border);
                border-radius: 20px;
                background: var(--st-panel);
                box-shadow: 0 18px 56px rgba(0, 0, 0, 0.48), 0 0 32px rgba(59, 156, 255, 0.08);
                scrollbar-width: thin;
                scrollbar-color: rgba(102, 227, 255, 0.35) transparent;
            }
            #st-panel::-webkit-scrollbar { width: 5px; }
            #st-panel::-webkit-scrollbar-thumb { background: rgba(102, 227, 255, 0.35); border-radius: 5px; }

            .st-panel-header, .st-section-heading, .st-bench-heading, .st-details-heading {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 10px;
            }
            .st-heading-stack { min-width: 0; display: flex; flex-direction: column; gap: 3px; }
            .st-panel-title, .st-section-kicker {
                color: var(--st-text);
                font-size: 11px;
                font-weight: 800;
                letter-spacing: 0.10em;
            }
            .st-panel-subtitle, .st-details-caption, .st-bench-subtitle {
                color: var(--st-muted);
                font-size: 9px;
                letter-spacing: 0.03em;
            }
            .st-section-kicker { color: #bcd7ff; font-size: 10px; }
            .st-section-note { color: var(--st-muted); font-size: 9px; }
            .st-control-heading { margin-top: 1px; }

            .st-fps-badge {
                display: flex;
                align-items: center;
                gap: 5px;
                flex-shrink: 0;
                padding: 6px 8px;
                border: 1px solid rgba(102, 227, 255, 0.17);
                border-radius: 9px;
                background: rgba(0, 0, 0, 0.24);
                color: var(--st-muted);
                font-size: 10px;
                font-weight: 800;
                cursor: pointer;
            }
            .st-fps-badge:hover { border-color: rgba(102, 227, 255, 0.52); background: rgba(59, 156, 255, 0.13); }
            .st-fps-unit { color: var(--st-muted); font-size: 9px; letter-spacing: 0.06em; }
            .st-expand-glyph { color: var(--st-cyan); font-size: 14px; line-height: 8px; transition: transform 0.18s ease; }
            .st-fps-badge[aria-expanded="true"] .st-expand-glyph { transform: rotate(180deg); }
            .st-fps-dot { width: 7px; height: 7px; flex: 0 0 auto; border-radius: 50%; background: var(--st-green); box-shadow: 0 0 8px var(--st-green); }
            .st-val-fps { color: var(--st-text); font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-variant-numeric: tabular-nums; }

            .st-performance-details {
                padding: 11px;
                border: 1px solid rgba(102, 227, 255, 0.24);
                border-radius: 13px;
                background: linear-gradient(145deg, rgba(14, 34, 66, 0.94), rgba(25, 17, 58, 0.90));
                animation: st-details-in 0.16s ease-out;
            }
            @keyframes st-details-in { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
            .st-details-heading { margin-bottom: 9px; }
            .st-close-details { width: 23px; height: 23px; padding: 0; border: 1px solid rgba(255,255,255,0.12); border-radius: 50%; background: rgba(255,255,255,0.06); color: var(--st-muted); font-size: 17px; line-height: 19px; cursor: pointer; }
            .st-close-details:hover { color: var(--st-text); background: rgba(255,255,255,0.14); }
            .st-detail-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 6px; }
            .st-detail-card { min-width: 0; padding: 7px 8px; border: 1px solid rgba(145, 208, 255, 0.12); border-radius: 8px; background: rgba(4, 11, 27, 0.38); }
            .st-detail-card span { display: block; overflow: hidden; color: var(--st-muted); font-size: 8px; font-weight: 750; letter-spacing: 0.06em; text-overflow: ellipsis; white-space: nowrap; }
            .st-detail-card strong { display: block; margin-top: 4px; overflow: hidden; color: var(--st-text); font: 750 14px ui-monospace, SFMono-Regular, Menlo, monospace; text-overflow: ellipsis; white-space: nowrap; }
            .st-detail-card small { display: block; margin-top: 3px; overflow: hidden; color: #91b6df; font-size: 8px; text-overflow: ellipsis; white-space: nowrap; }
            #st-performance-chart { display: block; width: 100%; height: 135px; margin-top: 9px; border: 1px solid rgba(145, 208, 255, 0.14); border-radius: 8px; background: #081225; }
            .st-details-footnote { margin-top: 6px; color: var(--st-muted); font-size: 8px; text-align: right; }

            .st-segmented-control { display: flex; gap: 3px; padding: 3px; border: 1px solid rgba(145, 208, 255, 0.12); border-radius: 10px; background: var(--st-control-bg); }
            .st-segment-btn { flex: 1; min-width: 0; padding: 7px 3px; border: 0; border-radius: 7px; background: transparent; color: var(--st-text); font-size: 11px; font-weight: 700; cursor: pointer; transition: background 0.16s ease, transform 0.16s ease; }
            .st-segment-btn:hover { background: rgba(255,255,255,0.08); }
            .st-segment-btn:active { transform: scale(0.97); }
            .st-segment-btn.active { background: linear-gradient(135deg, rgba(59,156,255,0.64), rgba(155,92,255,0.68)); box-shadow: 0 3px 10px rgba(59,156,255,0.18); }
            .st-turbo-btn.active { background: linear-gradient(135deg, #f04e75, #9b3cff); }

            .st-bench-section { display: flex; flex-direction: column; gap: 8px; padding: 11px; border: 1px solid rgba(155, 92, 255, 0.32); border-radius: 13px; background: linear-gradient(145deg, rgba(18, 27, 61, 0.95), rgba(39, 17, 67, 0.72)); }
            .st-bench-summary { display: block; width: 100%; padding: 0; border: 0; background: transparent; color: inherit; text-align: left; cursor: pointer; outline: none; }
            .st-bench-summary > .st-bench-heading { align-items: flex-start; }
            .st-bench-heading { align-items: flex-start; }
            .st-bench-heading > div { display: flex; flex-direction: column; gap: 3px; }
            .st-bench-summary-right { display: flex; align-items: center; gap: 6px; }
            .st-bench-chevron { color: var(--st-cyan); font-size: 16px; line-height: 10px; transition: transform 0.18s ease; }
            .st-bench-section.expanded .st-bench-chevron { transform: rotate(180deg); }
            .st-bench-body { display: flex; flex-direction: column; gap: 8px; }
            .st-bench-chip { padding: 3px 6px; border: 1px solid rgba(84,245,170,0.30); border-radius: 5px; color: var(--st-green); font: 800 8px ui-monospace, monospace; letter-spacing: .08em; }
            .st-bench-btn, .st-export-btn { border: 0; border-radius: 8px; color: var(--st-text); font-size: 10px; font-weight: 800; cursor: pointer; transition: filter 0.16s ease, transform 0.16s ease; }
            .st-bench-btn { width: 100%; padding: 9px 8px; background: linear-gradient(100deg, #176bdc, #8050e7); box-shadow: 0 5px 14px rgba(59, 156, 255, 0.18); }
            .st-bench-btn.active { background: linear-gradient(100deg, #d33d68, #ff724a); }
            .st-bench-btn:hover, .st-export-btn:hover { filter: brightness(1.18); }
            .st-bench-btn:active, .st-export-btn:active { transform: translateY(1px); }
            .st-export-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; }
            .st-export-btn { padding: 7px 4px; border: 1px solid rgba(145,208,255,0.16); background: rgba(118, 145, 190, 0.20); }
            .st-bench-options { display: flex; align-items: center; justify-content: space-between; gap: 8px; color: var(--st-muted); font-size: 9px; }
            .st-bench-options label { display: flex; align-items: center; gap: 5px; white-space: nowrap; }
            .st-bench-options select { padding: 3px 5px; border: 1px solid rgba(145,208,255,0.22); border-radius: 6px; outline: none; background: rgba(0,0,0,0.28); color: var(--st-text); font-size: 10px; }
            .st-bench-options select:disabled { opacity: 0.5; }
            .st-benchmark-status { min-height: 14px; color: #bcd7ff; font: 9px/1.4 ui-monospace, SFMono-Regular, Menlo, monospace; }
            .st-live-chart { color: var(--st-muted); font-size: 9px; }
            .st-live-chart-summary { display: flex; align-items: center; justify-content: space-between; width: 100%; padding: 0; border: 0; background: transparent; cursor: pointer; outline: none; user-select: none; color: #c7dcff; font: inherit; font-weight: 750; letter-spacing: .06em; text-align: left; }
            .st-live-chart-summary:hover { color: var(--st-text); }
            .st-live-chart-chevron { color: var(--st-cyan); font-size: 14px; line-height: 10px; transition: transform 0.18s ease; }
            .st-live-chart.expanded .st-live-chart-chevron { transform: rotate(180deg); }
            .st-summary-note { color: var(--st-muted); font-weight: 500; letter-spacing: 0; }
            #st-live-chart { display: block; width: 100%; height: 124px; margin-top: 7px; border: 1px solid rgba(145,208,255,0.14); border-radius: 8px; background: #081225; }

            .st-control-row { display: flex; align-items: center; gap: 9px; width: 100%; }
            .st-slider-wrapper { flex: 1; display: flex; align-items: center; min-width: 0; }
            #st-slider { width: 100%; height: 6px; border-radius: 4px; outline: none; background-color: var(--st-control-bg); background-image: linear-gradient(90deg, var(--st-cyan), var(--st-blue)); background-repeat: no-repeat; -webkit-appearance: none; }
            #st-slider::-webkit-slider-thumb { width: 19px; height: 19px; border: 2px solid #dff8ff; border-radius: 50%; background: #ffffff; box-shadow: 0 2px 8px rgba(0,0,0,0.34), 0 0 8px rgba(102,227,255,0.35); cursor: pointer; -webkit-appearance: none; }
            .st-speed-entry { display: flex; align-items: center; gap: 3px; color: var(--st-muted); font: 11px ui-monospace, SFMono-Regular, Menlo, monospace; }
            #st-speed-input { width: 61px; padding: 5px 4px; border: 1px solid rgba(145,208,255,0.20); border-radius: 6px; outline: none; background: rgba(0,0,0,0.28); color: var(--st-text); font: inherit; }
            #st-speed-input:focus { border-color: var(--st-cyan); box-shadow: 0 0 0 2px rgba(102,227,255,0.12); }
            #st-speed-input:disabled { opacity: 0.45; }
            #st-pause-btn { display: flex; align-items: center; justify-content: center; flex: 0 0 auto; width: 38px; height: 38px; border: 1px solid rgba(145,208,255,0.18); border-radius: 50%; background: var(--st-control-bg); cursor: pointer; transition: background 0.16s ease, transform 0.16s ease; }
            #st-pause-btn:hover { background: rgba(102,227,255,0.20); transform: scale(1.04); }
            #st-pause-btn:active { transform: scale(0.96); }
            #st-pause-btn img { width: 13px; height: 13px; filter: invert(1); }

            #st-home-indicator-area { display: flex; align-items: center; justify-content: center; width: 100%; height: 18px; margin: 0 0 -5px; cursor: pointer; }
            .st-home-indicator { width: 74px; height: 4px; border-radius: 4px; background: rgba(255,255,255,0.24); transition: background 0.16s ease, width 0.16s ease; }
            #st-home-indicator-area:hover .st-home-indicator { width: 96px; background: rgba(102,227,255,0.68); }
            button:focus-visible, select:focus-visible, input:focus-visible { outline: 2px solid rgba(102,227,255,0.85); outline-offset: 2px; }
            [hidden] { display: none !important; }
        `);
    }
}
