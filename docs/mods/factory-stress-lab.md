# Factory Stress Lab

> 无上限模拟倍率控制、40 FPS 自适应压力测试与 PNG / 网页 / 文本报告。

- **分类：**性能
- **版本：**2.4.0
- **文件：**[`factory-stress-lab.js`](../../mods/factory-stress-lab.js)

## 用途

Factory Stress Lab 是整合包中面向性能分析的主 Mod。它观测游戏模拟数据，而不是硬件温度或显卡功耗；其重点是帮助你在相同工厂布局下比较可持续的模拟倍率和机器压力估算。

## 核心功能

- 支持 1×、5×、20×、任意数值倍率和 Turbo 100×；快捷键为 Shift+T、[、]。
- Benchmark 从 200× 起步，依据近期 FPS 窗口自适应加速或回退，目标保持在约 40 FPS。
- 实时显示 FPS、毫秒/帧、逻辑 Tick、实体数量、模拟 Tick/s 与机器负载估算。
- 超过 10× 时限制画面展示刷新到约 1 Hz，模拟与采样继续运行。
- 可导出 2 倍分辨率 PNG、独立 HTML 和 TXT 报告，包含曲线、样本和机器压力排名。

## 使用方法

1. 点击右上角倍率按钮打开面板；可手动输入任意正倍率。
2. 展开 PRESSURE Benchmark，选择 120 秒或 900 秒后运行。
3. 运行结束后会回到 3×，再导出 PNG / WEB / TXT 报告进行布局对比。

## 实机截图

![Factory Stress Lab 压力测试报告](../assets/screenshots/factory-stress-lab-report.png)

示例 PNG 报告：自适应曲线、汇总数据与机器压力排行榜。

## 兼容性与注意事项

- 机器压力指数是按组件负载、平均倍率和 Tick 耗时计算的比较指标，不代表设备功耗。

[← 返回项目 README](../../README.md) · [在线展示页](https://ct-yx.github.io/shapez-mods/mods/factory-stress-lab.html)
