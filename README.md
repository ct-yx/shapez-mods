# shapez.io Mods

整理后的本地 mod 集合，适用于 shapez.io 一代（最低游戏版本 `1.5.0`）。

## Mods

| 文件 | 功能 |
| --- | --- |
| `mods/belt-speed-10x.js` | 所有等级的普通传送带与地下传送带速度提升 10 倍 |
| `mods/factory-stress-lab.js` | 无限倍率控制、40 FPS 压力测试、性能曲线与 PNG/网页/文本报告导出；Benchmark 面板支持展开/收起 |
| `mods/4-way-balancer.js` | 4 向平衡器 |
| `mods/8-way-balancer.js` | 8 向平衡器 |

## 安装

将需要使用的 `.js` 文件复制到游戏的 mods 目录：

```text
~/Library/Preferences/shapez.io/mods/
```

启动游戏后，在 mod 管理界面启用对应 mod。修改 mod 文件后需要重启游戏。

## 说明

- `factory-stress-lab.js` 是当前维护版本，包含 Benchmark 展开按钮修复。
- `belt-speed-10x.js` 只修改传送带基础速度，不改变存档数据。
- 4 向和 8 向平衡器保留各自原有的贴图与建筑配置。
