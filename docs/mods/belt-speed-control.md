# Belt Speed Control

> 调整传送带、地下传送带、原版二路平衡器和读取器的物流吞吐。

- **分类：**物流
- **版本：**1.5.0
- **文件：**[`belt_speed_10x.js`](../../mods/belt_speed_10x.js)

## 用途

用于快速验证大型物流网络。它只改变物流吞吐相关参数，默认倍率为 10×，也可以回到 1× 原版速度。

## 核心功能

- 每级普通传送带和地下传送带速度可设置为 1–50×。
- 原版二路平衡器的处理速度同步增加，避免成为高速带网络中的瓶颈。
- 传送带读取器改为即时透传，并解除读取器吞吐显示上限。
- 地下传送带等级和连接距离由独立的 `underground-belt-expansion.js` 负责。
- 传送带箭头和底纹动画由独立的 `belt-optimization.js` 负责。

## 使用方法

1. 启用 `structured-mod-settings.js` 后，进入「设置 → 游戏模组（MODS）→ 传送带速度控制」。
2. 设置 5× 或 10× 进行布局验证，再逐步提高倍率观察吞吐和逻辑负载。
3. 需要地下传送带三级、四级或距离设置时，另外启用 `underground-belt-expansion.js`。

## 兼容性

- 该 Mod 调整物流吞吐；`belt-optimization.js` 调整传送带绘制；`factory-stress-lab.js` 调整整体模拟倍率。
- 三者可以组合启用，设置和运行时 Hook 各自独立。

[← 返回项目 README](../../README.md) · [在线展示站](https://ct-yx.github.io/shapez-mods/mods/belt-speed-control.html)
