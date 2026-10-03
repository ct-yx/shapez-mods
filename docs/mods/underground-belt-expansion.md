# Underground Belt Expansion

> 增加三级、四级地下传送带，并分别设置四个等级的连接距离。

- **分类：**物流
- **版本：**1.0.0
- **文件：**[`underground-belt-expansion.js`](../../mods/underground-belt-expansion.js)

## 核心功能

- 在原版地下传送带基础上增加三级、四级变形体。
- 三级、四级复用二级地下带贴图和连接行为。
- 四个等级的连接距离可以分别设置为基础范围的 1–10×。
- 修改距离后刷新既有地下带连接缓存。
- 不修改普通传送带速度、平衡器速度或读取器行为。

基础距离为：

```text
一级：5 格
二级：9 格
三级：13 格
四级：17 格
```

启用 `belt_speed_10x.js` 时，速度倍率和地下带扩展可以叠加；两者的设置分别保存。

## 组合关系

- `auto-tunnels@1.0.4.js` 会读取当前地下带距离，并自动适配三级、四级。
- `structured-mod-settings.js` 可提供四个距离设置项。
- 不需要启用 `belt_speed_10x.js` 才能使用地下带扩展。

[← 返回项目 README](../../README.md) · [在线展示站](https://ct-yx.github.io/shapez-mods/mods/underground-belt-expansion.html)
