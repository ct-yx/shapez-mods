# Sandbox

> 立即解锁全部奖励，并将蓝图成本固定为零。

- **分类：**测试
- **版本：**1.0.0
- **文件：**[`sandbox.js`](../../mods/sandbox.js)

## 用途

Sandbox 用于布局验证、Mod 调试和性能压测。它把 Hub Goal 的奖励判定统一视为已解锁，同时让蓝图成本返回零，因此无需推进任务也能使用全部建筑与功能。

## 核心功能

- 所有奖励解锁判断直接返回 true。
- 任意蓝图成本固定为 0。
- 实现很轻量，不引入设置面板或额外 UI。

## 使用方法

1. 为独立测试存档启用该 Mod。
2. 配合 Factory Stress Lab 快速搭建完整工厂并运行压力测试。
3. 需要正常 progression 时，在 Mod 管理界面关闭它并重新载入对应存档。

## 兼容性与注意事项

- Sandbox 会显著改变正常流程，建议与主进度存档分开使用。

[← 返回项目 README](../../README.md) · [在线展示页](https://ct-yx.github.io/shapez-mods/mods/sandbox.html)
