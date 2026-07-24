# shapez.io Mods

这是 ct-yx 与 Codex 共同整理和维护的 shapez.io 一代 mod 集合，集中整理了传送带加速、工厂压力测试、多向平衡器和快捷键工具。它们主要用于提升工厂搭建效率、测试工厂在高模拟倍率下的表现，以及扩展基础物流布局能力。

项目中的 mod 都采用单文件形式，复制到游戏的 mods 目录即可使用，不需要额外的构建工具或依赖。最低游戏版本为 `1.5.0`。其中 `Factory Stress Lab` 是当前持续维护和迭代的主 mod，其余文件是独立的小型功能 mod，可以按需启用。

## 致谢

`Factory Stress Lab` 的速度控制原型受到 [Speed Control](https://mod.io/g/shapez/m/speed-control) 的启发。当前实现已针对本项目需求重新设计并重写，加入了无限倍率、40 FPS 自适应 Benchmark、性能曲线、机器压力分析和多格式报告导出等功能；这里感谢原 mod 带来的思路。

## 项目特色

- **物流加速**：所有等级传送带、地下传送带和原版 2-way 平衡器可统一调速。
- **性能测试**：Factory Stress Lab 以约 40 FPS 为目标自动调节模拟倍率，并记录 FPS、逻辑耗时、实体数量、倍率和机器压力。
- **报告导出**：压力测试结果可以导出为 PNG、独立网页或纯文本报告。
- **布局扩展**：将 4/5/8/10/16-way 平衡器挂入原版 balancer 的变形体列表。
- **快捷切换**：按住 `T` 或 `R` 后配合数字键、滚轮快速选择变形体或方向。

## Mods

| 文件 | 功能 |
| --- | --- |
| `mods/belt-speed-10x.js` | 可在 MODS 设置中以 1x–50x 滑块调节普通/地下传送带和原版 2-way 平衡器 |
| `mods/factory-stress-lab.js` | 无限倍率控制、40 FPS 压力测试、性能曲线与 PNG/网页/文本报告导出；Benchmark 面板支持展开/收起 |
| `mods/structured-mod-settings.js` | 为其他 mod 提供可复用的结构化设置面板与持久化 API |
| `mods/zoomout-before-mapmode.js` | 地图总览缩放阈值与低缩放传送带物品简化显示 |
| `mods/mapmode-preview-zoom.js` | 只扩展地图总览预览的最小缩放，不改变普通建造模式镜头范围 |
| `mods/balancer-variants.js` | 原版 balancer 的 4/5/8/10/16-way 变形体；不额外占用 toolbar 格子 |
| `mods/key-reform.js` | `T`/`R` + 数字键和按住 `T`/`R` 滚轮快捷切换 |

## 功能介绍

### Belt Speed Control

`belt-speed-10x.js` 修改游戏中传送带和处理器速度的基础计算逻辑，并在安装 `Structured Mod Settings UI` 时显示在“设置 → 游戏模组（MODS）”中：

- “Enable belt acceleration” 开关控制功能是否启用。
- “Speed per tier” 滑块范围为 `1x–50x`，默认 `10x`；`1x` 直接使用原版速度，相当于禁用加速。
- 普通传送带和地下传送带的每个升级等级都按同一倍率提升。
- 原版 balancer 的处理速度单独同步提升，避免传送带很快但 2-way balancer 仍然慢。
- 保留原有的等级和升级关系，不额外添加建筑或改变存档结构。
- 适合快速测试大型物流网络，或减少早期工厂的等待时间。

如果 `Structured Mod Settings UI` 的加载顺序晚于本 mod，传送带 mod 会先排队，待设置前置初始化后自动注册设置卡片。

### Factory Stress Lab

`factory-stress-lab.js` 是一个集模拟倍率控制和工厂性能分析于一体的工具，重点观察游戏模拟本身，而不是硬件温度或显卡参数。

#### 模拟倍率控制

- 支持 `1x`、`5x`、`20x` 快捷倍率。
- 支持直接输入任意正数倍率，不把 100x 作为最高限制。
- `Turbo` 是独立的高速模式，使用固定的 100x 目标倍率。
- 支持暂停、恢复，以及快捷键调整倍率：`Shift + T` 切换 Turbo，`[`/`]` 调低或调高倍率。

#### 游戏性能详情

点击面板顶部的 FPS 数字，可以展开游戏性能详情，查看：

- 游戏 FPS 与毫秒/帧。
- 逻辑 Tick 频率与平均 Tick 耗时。
- 当前模拟倍率和每秒逻辑步数。
- 实体数量和机器负载估算。
- 画面显示状态，以及高倍率时的画面刷新频率。
- FPS 与倍率曲线。

普通详情曲线只在详情面板展开时记录，收起后会清空；Benchmark 运行期间则保留独立的跑分数据。普通曲线最多保留 10 分钟，并以每秒一个样本的频率记录，以减少额外性能开销。

#### Benchmark 压力测试

Benchmark 页面默认收起，点击 `PRESSURE Benchmark` 标题即可展开或收起：

1. 选择 `120 s` 或 `900 s` 测试时长。
2. 点击 `Run Stress Test` 开始测试。
3. 测试从 `200x` 起步，根据游戏 FPS 自动调整倍率。
4. 控制器会在 FPS 偏低时回退倍率，在 FPS 高于目标时继续提高倍率，目标范围约为 40 FPS。
5. 测试完成后自动回到 `3x`，并计算平均倍率、峰值倍率、平均 FPS、目标保持率、稳定性、Tick 耗时和机器压力综合分数。

当倍率超过 `10x` 时，游戏画面显示限制为每秒刷新一次，但模拟逻辑和 Benchmark 采样继续运行。这样可以减少高倍率下重复绘制画面的开销，让测试更集中地反映工厂模拟能力。

#### 报告导出

测试结果支持三种导出格式：

- **PNG**：高分辨率视觉报告，包含参数卡片、FPS/倍率曲线和机器压力排行。
- **WEB**：独立 HTML 网页报告，可在浏览器中打开并查看曲线与原始样本。
- **TXT**：适合保存、比较和复制的纯文本报告。

机器压力指数会根据场上机器数量、组件类型、平均倍率和 Tick 耗时进行综合估算，用于比较不同工厂布局的压力，不代表硬件功耗测量值。

#### 报告示例

仓库中的 `reports/` 目录包含一次实际压力测试的完整导出结果：

- [网页报告](reports/factory-stress-lab-sample.html)
- [文本报告](reports/factory-stress-lab-sample.txt)
- [PNG 报告原图](reports/factory-stress-lab-sample.png)

示例 PNG 使用 2560×1640 分辨率，展示了平均倍率、平均帧率、目标保持率、稳定性、平均 Tick、实体数量、综合分数、自适应曲线和机器压力排行。

![Factory Stress Lab 示例报告](reports/factory-stress-lab-sample.png)

## 项目开发统计

以下是本项目在开发阶段的 token 使用统计截图，共计 4 个相关对话、`106,207,029` tokens：

![项目 token 使用统计](reports/project-token-usage.png)

统计组成：

- 输入：`105,455,118`
- 输出：`751,911`
- 其中缓存输入：`79,750,912`
- 推理输出：`364,875`

### Balancer Variants

`balancer-variants.js` 使用官方 `addVariantToExistingBuilding` API，将多向平衡器挂到原版 `balancer` 的变形体列表中：

- 保留原版 2-way、merger 和 splitter 变形体。
- 增加 `4-way`、`5-way`、`8-way`、`10-way`、`16-way`。
- 每个变形体使用独立的横向 PNG 条带，按实际宽度占用 `N×1` 格。
- 每个输入槽都会轮流输出到可用槽；总吞吐以原版 2-way 平衡器为基准，按 `N / 2` 线性扩展（默认 4-way 为 8/s、8-way 为 16/s），并直接读取原版 `balancer` 处理器速度。因此传送带升级和 Belt Speed Control 的倍率会自动同步到全部多向变形体。
- 不调用 `addNewBuildingToToolbar`，因此不会在物品栏增加独立格子；选择原版 balancer 后按 `T` 即可切换。
- 变形体选择条使用轻量文字标签 `4x`、`5x`、`8x`、`10x`、`16x`，不再加载多格大型预览图；实际建造和地图中的贴图保持不变。

旧版 `4-way-balancer.js` 和 `8-way-balancer.js` 已移到 `legacy/` 并改为 `.disabled`，仅用于兼容参考，不会被游戏自动加载。

### Key Reform

`key-reform.js` 只在建造模式中接管组合输入：

- 按住 `T` 后按数字键选择变形体；默认 `T+4`/`T+5`/`T+8`/`T+0`/`T+6` 分别优先选择 4/5/8/10/16-way，其他建筑则回退为按变形体序号选择。
- 按住 `R` 后按 `1`/`2`/`3`/`4`，分别设置上/右/下/左方向。
- 按住 `T` 滚轮会读取当前建筑检测到的全部可用变形体，对其他 mod 增加的变形体也生效；按住 `R` 滚轮每格旋转 90°。
- 设置卡片会自动检测已注册建筑的**全部变形体**，包括原版 `default` 变形体和其他 Mod 添加的变形体，生成可编辑的 `T+0`–`T+9` 绑定下拉框；选择 `Auto` 可恢复上下文匹配。
- 组合滚轮会阻止镜头缩放；普通滚轮仍保持原版地图缩放行为。

### Structured Mod Settings UI

`structured-mod-settings.js` 是一个可作为前置 mod 使用的设置 UI 库。它会把原本分散在各个 mod 中的设置集中到游戏原生“设置 → 游戏模组（MODS）”分类，顶层按 mod 分组，每个 mod 卡片下面显示其子设置；不再在游戏右上角额外放置悬浮面板。

设置页面支持跟随游戏语言：简体/繁体中文显示中文，其他已安装语言默认显示英语。界面使用游戏原生的分类按钮、卡片、滑块和开关样式；每个模组卡片默认折叠，点击卡片标题即可展开其设置。

其他 mod 可以注册结构化字段：

- 布尔开关
- 数值滑块与数字输入框
- 下拉选项
- 文本输入
- 分组标题、说明文字和恢复默认按钮

设置会由前置 mod 统一保存，其他 mod 只需要注册定义并读取 API，不需要自己编写面板或实现持久化。点击设置分类中的“管理模组”仍可进入游戏原生的 mod 管理页面。

#### 其他 mod 的接入方式

确保 `structured-mod-settings.js` 先加载，然后在其他 mod 的 `init()` 中注册：

```js
const settingsApi = globalThis.ShapezStructuredSettings;
const settings = settingsApi && settingsApi.register({
    id: "my-mod",
    title: { en: "My Mod", zh: "我的 Mod" },
    description: { en: "Mod settings", zh: "模组设置" },
    fields: [
        {
            id: "enabled",
            type: "boolean",
            label: { en: "Enabled", zh: "启用" },
            default: true,
        },
        {
            id: "amount",
            type: "number",
            label: { en: "Amount", zh: "数量" },
            min: 0.1,
            max: 10,
            step: 0.1,
            default: 1,
            onChange: value => applyAmount(value),
        },
    ],
});

const amount = settings ? settings.get("amount") : 1;
```

完整示例是 `zoomout-before-mapmode.js`：它使用一个以原版为 `1x` 基准的设置，控制进入地图总览前可继续缩小的范围；不会再把窗口宽度换算成网格数。没有安装前置 mod 时，该示例仍会使用默认值运行。

### Zoom out before Mapmode

除了调整进入地图总览的阈值，这个 mod 还会根据**实际镜头缩放值**优化传送带物品显示：

- 默认实际镜头缩放低于 `0.5` 时，隐藏传送带中间的物品，只保留每条传送带路径首尾的物品图标。
- “进入地图总览前的缩小范围”使用相对原版的倍数：`1x` 是原版，数值越大，进入地图总览前可缩得越远；默认 `2x`，最高 `8x`。
- 不修改普通建造模式镜头的最小缩放限制，避免扩大普通镜头可视/生成范围。
- 鼠标移到路径起始或结束物品图标附近时，该图标会放大，触发范围已扩大；相邻端点是不同物品时按距离选择最近的一个。
- 相邻端点是相同物品时会合并为一个放大的视觉组，避免同类图标重复堆叠。
- 该逻辑读取的是 `camera.zoomLevel`，与 `1x`、`5x`、`100x` 等模拟倍率无关。
- “设置 → 游戏模组（MODS）→ 地图总览缩放”中可以调整进入地图总览前的缩小范围，也可以关闭简化显示或调整传送带简化的 `0.x` 缩放阈值。

### Mapmode Preview Zoom

`mapmode-preview-zoom.js` 是只扩展地图总览预览的独立版本：

- 只有地图总览已经显示后，才允许继续缩小到默认 `0.02`。
- 普通建造模式仍保持原版最小缩放 `0.06`，避免因为扩大镜头可视范围而增加世界预加载/生成压力。
- 在“设置 → 游戏模组（MODS）→ 地图预览缩放”中可以关闭功能或调整地图预览最小缩放值（`0.02–0.06`）。
- 它与 `zoomout-before-mapmode.js` 相互独立；只需要地图总览阈值时不必启用本 mod。
- 如果已经使用 `zoomout-before-mapmode.js`，不要同时启用这个独立版本，避免两个 mod 同时修改普通镜头下限。

## 安装

将需要使用的 `.js` 文件复制到游戏的 mods 目录：

```text
~/Library/Preferences/shapez.io/mods/
```

启动游戏后，在 mod 管理界面启用对应 mod。修改 mod 文件后需要重启游戏。

## 配置文件位置

当前官方 shapez.io 一代 mod loader 的 `saveSettings()` 存储接口会把 mod 配置写入：

```text
~/Library/Preferences/shapez.io/saves/modsettings_<mod-id>__<version>.json
```

例如本项目的结构化设置数据位于 `saves/modsettings_structured-mod-settings-ui__<version>.json`。`mods/` 目录只用于加载 `.js` 模组。用户侧的独立配置目录可以规划为 `~/Library/Preferences/shapez.io/config/`，但当前官方 Electron 的 `fs-job` 接口固定以 `saves/` 作为运行时设置根目录；要让 mod 配置真正写入 `shapez.io/config/`，需要同步调整游戏 Electron 主进程的存储处理。仓库中的 `mods/` 目录用于模组代码。

## 推荐组合

- **普通建厂**：只启用需要的 `Balancer Variants`。
- **快速物流测试**：启用 `Belt Speed Control`，在 MODS 中选择倍率。
- **性能跑分**：启用 `Factory Stress Lab`，选择 Benchmark 时长后运行压力测试。
- **地图预览**：额外启用 `Mapmode Preview Zoom`，只扩展地图总览已经打开后的缩放范围。
- **统一设置**：同时启用 `Structured Mod Settings UI`、`Zoom out before Mapmode` 和（可选的）`Mapmode Preview Zoom`，进入“设置 → 游戏模组（MODS）”调节对应选项。
- **物流与性能联合测试**：同时启用 `Belt Speed Control`、平衡器和 `Factory Stress Lab`，对比不同布局的平均倍率与机器压力分数。

## 文件结构

```text
shapez-mods/
├── README.md
├── legacy/
│   ├── 4-way-balancer.js.disabled
│   └── 8-way-balancer.js.disabled
└── mods/
    ├── balancer-variants.js
    ├── belt-speed-10x.js
    ├── factory-stress-lab.js
    ├── key-reform.js
    ├── mapmode-preview-zoom.js
    ├── structured-mod-settings.js
    └── zoomout-before-mapmode.js
```

## 兼容性与注意事项

- `factory-stress-lab.js` 是当前维护版本，包含 Benchmark 展开按钮修复。
- `structured-mod-settings.js` 会把设置页面扩展为原生“游戏模组（MODS）”分类；依赖它的 mod 即使加载顺序靠前也会自动等待注册。
- `belt-speed-10x.js` 只修改运行时速度，不改变存档数据；`1x` 或关闭开关即恢复原版倍率。
- `balancer-variants.js` 与旧版独立 4/8-way mod 不要同时启用，否则会出现重复的扩展建筑。
- `mapmode-preview-zoom.js` 只影响地图总览模式；若不需要超远地图预览，可以保持关闭。
- 高模拟倍率可能让游戏逻辑负载明显增加；首次测试建议从 `120 s` 开始。
- Benchmark 页面默认收起，不运行压力测试时不会持续记录 Benchmark 曲线。
- 如果游戏更新后 mod 行为异常，请先确认游戏版本与 `minimumGameVersion`，再重新复制最新文件。

## 版本说明

本仓库用于保存和同步本地 mod 文件及其说明。每个 mod 都可以单独复制使用，修改一个文件不会自动修改其他 mod。
