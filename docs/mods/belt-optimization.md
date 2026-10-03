# Belt Optimization

> 独立的传送带视觉优化：冻结高吞吐动画，并在低缩放时简化物品绘制。

- **分类：**性能 / 物流
- **版本：**1.0.0
- **文件：**[`belt-optimization.js`](../../mods/belt-optimization.js)

## 用途

这个 Mod 只改变传送带的绘制方式，不改变传送带速度、物品移动、地下带连接或存档数据。它可以单独启用，也可以和 `belt_speed_10x.js` 组合。

## 核心功能

- 传送带箭头和底纹在超过吞吐阈值后固定到静态帧。
- 低缩放时每条传送带路径只绘制首尾物品。
- 低缩放时使用无动态箭头的静态传送带底图。
- 物品逻辑、传送带吞吐和机器处理继续运行。
- 设置注册在 `structured-mod-settings.js` 提供的「游戏模组（MODS）」页面。

## 默认设置

| 设置 | 默认值 |
| --- | ---: |
| 启用传送带视觉优化 | 开启 |
| 动画冻结吞吐阈值 | 15 items/s |
| 低缩放物品简化 | 开启 |
| 简化渲染缩放阈值 | 0.5× |

关闭总开关即可恢复这个 Mod 修改过的传送带绘制路径；物流模拟始终不受影响。

## 组合关系

- 配合 `belt_speed_10x.js` 时，高倍率带的动画优化会独立生效。
- `zoomout-before-mapmode.js` 只负责进入地图总览前的缩放范围，不再负责传送带绘制。
- `factory-stress-lab.js` 的高倍率 1 Hz 画面节流属于压测工具，和本 Mod 可以同时启用。

[← 返回项目 README](../../README.md) · [在线展示站](https://ct-yx.github.io/shapez-mods/mods/belt-optimization.html)
