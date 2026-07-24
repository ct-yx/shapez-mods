# Structured Mod Settings UI

> 把多个 Mod 的参数收进游戏原生设置页，提供统一的字段渲染、持久化和中文界面。

- **分类：**基础设施
- **版本：**1.0.1
- **文件：**[`structured-mod-settings.js`](../../mods/structured-mod-settings.js)

## 用途

这是整合包的设置前置。它在游戏的设置页新增「游戏模组（MODS）」分类，其他 Mod 只需注册字段定义，就能得到统一风格的开关、滑块、下拉框和恢复默认按钮。

## 核心功能

- 按 Mod 分组的原生设置卡片，不额外占用游戏 HUD。
- 支持布尔开关、数值、下拉选项、文本、说明标题和恢复默认。
- 自动按游戏语言显示简体中文或英文，并统一保存各 Mod 的参数。
- 提供全局 API 与延迟注册队列，加载顺序靠前的 Mod 也能在前置初始化后补上设置卡片。

## 使用方法

1. 将本 Mod 与需要设置项的 Mod 一起放入游戏 Mod 目录。
2. 进入「设置 → 游戏模组（MODS）」即可查看已注册的卡片。
3. 当前 Belt Speed Control、Key Reform 和 Zoom out before Mapmode 会自动接入。

## 实机截图

![游戏模组设置总览](../assets/screenshots/structured-settings-overview.png)

游戏原生设置中新增的「游戏模组（MODS）」分类。

## 兼容性与注意事项

- 建议启用在所有带可配置参数的 Mod 之前；即使加载顺序不同，延迟注册机制仍会尝试补齐设置。

[← 返回项目 README](../../README.md) · [在线展示页](https://ct-yx.github.io/shapez-mods/mods/structured-mod-settings.html)
