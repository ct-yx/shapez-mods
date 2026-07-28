# Mod 独立说明

所有 Mod 都是可以直接复制的单文件 JavaScript；下面的页面按当前 `mods/` 源码说明功能、默认值、快捷键和组合关系。

| 分类 | Mod | 当前版本 | 页面 |
| --- | --- | ---: | --- |
| 基础设施 | Structured Mod Settings UI | 1.0.1 | [说明](structured-mod-settings.md) |
| 物流 | Belt Speed Control | 1.4.0 | [说明](belt-speed-control.md) |
| 物流 | Balancer Variants | 1.0.4 | [说明](balancer-variants.md) |
| 建造 | Key Reform | 1.1.8 | [说明](key-reform.md) |
| 视图 | Zoom out before Mapmode | 1.5.1 | [说明](zoomout-before-mapmode.md) |
| 性能 | Factory Stress Lab | 2.4.0 | [说明](factory-stress-lab.md) |
| 视图 / 工具 | Factory Area Snapshot | 2.0.0 | [说明](factory-area-snapshot.md) |
| 建造 | Auto Tunnels | 1.1.0 | [说明](auto-tunnels.md) |
| 建造 | Chainable Extractors | 1 | [说明](chainable-extractors.md) |
| 测试 | Sandbox | 1 | [说明](sandbox.md) |

## 组合建议

- 需要设置页面的 Mod：同时启用 `structured-mod-settings.js`。
- 高吞吐物流：`belt_speed_10x.js` + `balancer-variants.js` + `auto-tunnels@1.0.4.js`。
- 性能压测：`factory-stress-lab.js`；要快速搭建测试工厂时再加入 `sandbox.js`。
- 高分辨率归档：`factory-area-screenshot.js`；选区截图不加外围留白，整地图截图默认添加 10 格留白。

## 支持项目

如果这些 Mod 对你的工厂有帮助，欢迎通过以下方式支持持续维护：

- [爱发电赞助](https://www.ifdian.net/a/Ct_yx?utm_source=copylink&utm_medium=link)
- [Buy Me a Coffee](https://buymeacoffee.com/ctyx)

[← 返回项目 README](../../README.md) · [在线展示站](https://ct-yx.github.io/shapez-mods/)
