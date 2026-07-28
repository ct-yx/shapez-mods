# shapez.io Mods Collection

> 面向 **shapez.io 一代** 的中文 Mod 整合包：物流扩展、快捷建造、原生设置页、地图预览、高分辨率工厂截图与性能压测。

[![GitHub Pages](https://img.shields.io/badge/展示站-GitHub%20Pages-66c4ff?style=flat-square)](https://ct-yx.github.io/shapez-mods/)
[![shapez.io](https://img.shields.io/badge/shapez.io-1.x-48edd2?style=flat-square)](https://shapez.io/)
[![Mods](https://img.shields.io/badge/Mod-10-ad7cff?style=flat-square)](docs/mods/README.md)

**[前往项目主页](https://ct-yx.github.io/shapez-mods/)** · **[全部 Mod 介绍](docs/mods/README.md)**

本仓库中的 Mod 均为单文件 JavaScript：复制所需文件到游戏的 Mod 目录即可使用，不需要构建工具或第三方依赖。除来源不同的 Auto Tunnels 外，当前维护的 Mod 元数据要求游戏版本 `>=1.5.0`。

![游戏模组设置总览](docs/assets/screenshots/structured-settings-overview.png)

## 整合包内容

| 分类 | Mod | 版本 | 一句话介绍 | 独立介绍 |
| --- | --- | --- | --- | --- |
| 基础设施 | `structured-mod-settings.js` | 1.0.1 | 原生 MODS 分类、结构化字段、持久化、语言切换和重载按钮。 | [查看](docs/mods/structured-mod-settings.md) |
| 物流 | `belt_speed_10x.js` | 1.4.0 | 传送带 1–50× 调速；地下传送带四级距离独立设置，并同步平衡器与读取器。 | [查看](docs/mods/belt-speed-control.md) |
| 物流 | `balancer-variants.js` | 1.0.4 | 原版平衡器新增 4 / 5 / 8 / 10 / 16 路变形体，修正多路贴图比例。 | [查看](docs/mods/balancer-variants.md) |
| 建造 | `key-reform.js` | 1.1.8 | 使用 T/R + 数字键或标准化滚轮快速切换变形体和朝向。 | [查看](docs/mods/key-reform.md) |
| 视图 | `zoomout-before-mapmode.js` | 1.5.1 | 扩大地图总览前缩放范围，并在低缩放时合并/简化传送带物品。 | [查看](docs/mods/zoomout-before-mapmode.md) |
| 性能 | `factory-stress-lab.js` | 2.4.0 | 无上限倍率、40 FPS 自适应 Benchmark、10 分钟普通曲线与三种报告。 | [查看](docs/mods/factory-stress-lab.md) |
| 视图 / 工具 | `factory-area-screenshot.js` | 2.0.0 | 低/中/高质量预设、清晰像素采样、普通镜头分块和流式高分辨率 PNG。 | [查看](docs/mods/factory-area-snapshot.md) |
| 建造 | `auto-tunnels@1.0.4.js` | 1.1.0 | 方向锁定铺带时按实时长度选地下传送带跨越连续障碍，兼容多路平衡器。 | [查看](docs/mods/auto-tunnels.md) |
| 建造 | `extractor_chain.js` | 1 | 拖动时连续放置链式采矿机，并按路径自动调整朝向。 | [查看](docs/mods/chainable-extractors.md) |
| 测试 | `sandbox.js` | 1 | 解锁全部奖励并将蓝图成本归零，适合验证布局与压力测试。 | [查看](docs/mods/sandbox.md) |

## 安装

1. 前往[项目主页](https://ct-yx.github.io/shapez-mods/)获取由 GitHub 自动构建的最新整合包并解压。
2. 将需要启用的 `.js` 文件复制到游戏的 Mod 目录。
   - macOS 常用目录：`~/Library/Preferences/shapez.io/mods/`
3. 重启游戏，在 Mod 管理界面启用对应 Mod。
4. 启用了 `structured-mod-settings.js` 后，进入 **设置 → 游戏模组（MODS）** 配置支持设置项的 Mod。

> 每个文件可以单独使用。想要配置传送带速度、快捷键或地图预览时，同时启用 `structured-mod-settings.js`。

## 默认值与快捷键速查

| Mod | 默认行为 |
| --- | --- |
| Belt Speed Control | 每级 10×；倍率范围 1–50×。一级至四级地下传送带范围默认保持原版，分别可调到原版的 1–10×；实际吞吐超过 15 items/s 时默认冻结动画。 |
| Key Reform | `T + 数字键` 选变形体，`R + 1/2/3/4` 设上/右/下/左方向；按住 `T/R` 滚轮可循环切换。 |
| Zoom out before Mapmode | 进入地图总览前可缩小到原版范围的 2×；实际镜头缩放 ≤ 0.5× 时默认只显示传送带首尾物品。 |
| Factory Stress Lab | 手动倍率可输入任意正数；`Shift + T` 切换 Turbo 100×，`[` / `]` 以 1× 调整。 Benchmark 从 200× 起步，目标 38–42 FPS，支持 120 s / 900 s，结束回到 3×。 |
| Factory Area Snapshot | 选区质量默认 16 / 48 / 256 MP，选区上限分别为 48×48 / 128×128 / 1024×1024 格；整地图默认高质量并添加 10 格留白。 |

## 推荐组合

| 目标 | 推荐启用 |
| --- | --- |
| 日常建造 | `balancer-variants.js` + `key-reform.js` |
| 高吞吐物流测试 | `belt_speed_10x.js` + `balancer-variants.js` + `auto-tunnels@1.0.4.js` |
| 大地图规划 | `structured-mod-settings.js` + `zoomout-before-mapmode.js` |
| 工厂布局归档 | `factory-area-screenshot.js`；可导出机器范围或地图总览框选区域，大型图片先以 16–32 MP 试导出 |
| 工厂性能压测 | `factory-stress-lab.js`；搭建测试布局时可额外启用 `sandbox.js` |
| 全套体验 | 设置前置 + 物流 + 平衡器 + 按键 + 地图预览 + 压测工具；按需启用 Sandbox |

## 实机截图

<table>
  <tr>
    <td width="50%"><img src="docs/assets/screenshots/belt-speed-settings.png" alt="传送带速度控制设置"><br><sub>传送带与地下传送带距离设置</sub></td>
    <td width="50%"><img src="docs/assets/screenshots/key-reform-settings.png" alt="按键改革设置"><br><sub>T+数字键变形体映射</sub></td>
  </tr>
  <tr>
    <td><img src="docs/assets/screenshots/balancer-variant-selector.png" alt="平衡器变形体选择"><br><sub>4x 至 16x 的平衡器变形体</sub></td>
    <td><img src="docs/assets/screenshots/zoomout-settings.png" alt="地图总览缩放设置"><br><sub>地图总览缩放和低缩放渲染配置</sub></td>
  </tr>
</table>

![Factory Stress Lab 报告](docs/assets/screenshots/factory-stress-lab-report.png)

## 兼容性与说明

- **Belt Speed Control** 调整物流吞吐；**Factory Stress Lab** 调整整体模拟倍率。二者可以叠加用于性能与吞吐对比。
- **Balancer Variants** 已包含多路平衡器，避免再与旧的独立 4-way / 8-way 平衡器 Mod 同时启用。
- **Sandbox** 会让所有奖励解锁、蓝图免费；建议使用独立测试存档，避免干扰正常进度。
- **Auto Tunnels** 和 **Chainable Extractors** 会扩展游戏建造器逻辑；若使用其他同类建造 Mod，建议先在测试存档验证组合效果。
- 低缩放时的传送带简化渲染仅影响视觉表现，不改变物流模拟。
- **Factory Area Snapshot** 支持已放置机器范围和地图总览框选两种来源：选区不添加外围留白，整地图会按普通层机器边界添加留白；默认在截图期间暂停模拟（可关闭），结束后恢复原速度与图层。
- **Factory Stress Lab** 的普通性能详情在收起时停止并清空曲线，Benchmark 样本独立保留；机器压力指数是比较指标，不是硬件功耗。

## 报告示例

`Factory Stress Lab` 可输出 PNG、独立 HTML 和 TXT 三种报告格式。仓库保留了一组完整样本：

- [网页报告](reports/factory-stress-lab-sample.html)
- [文本报告](reports/factory-stress-lab-sample.txt)
- [PNG 报告原图](reports/factory-stress-lab-sample.png)

## 仓库结构

```text
shapez-mods/
├── mods/                  # 可直接复制到游戏 Mod 目录的单文件 Mod
├── docs/                  # GitHub Pages 展示站、独立 Mod 说明和截图资源
│   ├── index.html
│   ├── mods/
│   ├── assets/screenshots/
│   └── assets/download-latest.js
├── reports/               # Factory Stress Lab 报告样本
└── .github/workflows/     # Pages 部署与动态整合包发布工作流
```

## 发布展示站

仓库包含两个自动化工作流：

- `.github/workflows/pages.yml`：推送到 `main` 后部署 `docs/` 到 GitHub Pages。
- `.github/workflows/modpack-release.yml`：每次推送都会将当前的 `mods/*.js` 实时打包，并更新 `modpack-latest` GitHub Release 资产。展示页通过 GitHub API 读取该资产的最新下载地址，因此 ZIP 不会被提交到仓库。

首次使用时需在仓库 **Settings → Pages** 中把 Source 设为 **GitHub Actions**。

展示地址：<https://ct-yx.github.io/shapez-mods/>

## 支持项目

如果这些 Mod 对你的工厂有帮助，欢迎通过以下方式支持持续维护：

- [爱发电赞助](https://ifdian.net/a/Ct_yx)
- [Buy Me a Coffee](https://buymeacoffee.com/ctyx)

## 致谢

- `Factory Stress Lab` 的速度控制原型受到 [Speed Control](https://mod.io/g/shapez/m/speed-control) 的启发；当前实现已按本项目的压测与报告需求重写。
- `Auto Tunnels` 文件保留其上游作者信息：erjiu、minimax 与 Sense_101。
- 本仓库由 ct-yx 与 Codex 共同维护。
