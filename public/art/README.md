# 大事件配图目录

本目录存放《长征征途》节点详情卡使用的**真实图片**。没有图片时，作品自动使用 `src/components/EventArtwork.vue` 里的手绘内联 SVG 插画。

## 工作机制

1. 界面渲染某个节点时，先向本目录的 `manifest.json` 查询该节点是否有图片；
2. **只有 `reviewed: true` 的条目会被显示**；
3. 其余情况一律回退到手绘插画。

`reviewed` 这道开关是刻意设置的安全阀，原因见下一节。

## 为什么必须有 `reviewed` 开关

脚本能自动下载图片，但**无法判断图片内容是否与史实表述相符**，也无法判断画面质量、是否存在不当内容。

如果未经人工审看就把一张图当作"飞夺泸定桥历史照片"展示，那等同于伪造史料——这比没有配图严重得多。因此：

- 自动下载的条目一律是 `"reviewed": false`，**不显示**；
- 请你逐张打开确认后，手工把标记改成 `true`。

## manifest.json 结构

```json
{
  "photos": {
    "r1-luding": {
      "file": "r1-luding.jpg",
      "reviewed": false,
      "label": "泸定桥",
      "title": "Luding Bridge (2019)",
      "description": "现今实地的泸定桥",
      "author": "摄影者姓名",
      "license": "CC BY-SA 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0/",
      "source": "https://commons.wikimedia.org/wiki/File:...",
      "note": "请确认内容与史实表述相符后再改为 true"
    }
  }
}
```

`<节点 id>` 取自 `src/data/armies.js`，可用 `node scripts/fetch-artwork.mjs --list` 查看建议的检索目标。

## 三种获取方式

### 方式一：脚本自动获取（自由许可图片）

```bash
pnpm fetch:artwork                  # 按内置清单检索并下载
pnpm fetch:artwork --node r1-luding # 只处理某个节点
pnpm fetch:artwork --list           # 只列出检索目标，不下载
```

脚本到 Wikimedia Commons 检索，**只接受明确自由许可**（CC0 / CC BY / CC BY-SA / 公有领域），跳过 CC BY-NC、CC BY-ND 等，并把出处、作者、许可写入 `manifest.json`。重跑脚本不会冲掉你已经标记过的 `reviewed`。

> 注意：Commons 上多为**现今实地照片**（今天的泸定桥、遵义会议会址等），1930 年代的历史照片较少且版权状况复杂。对地图类科普作品而言，现今实地照片往往更贴切——**只要如实标注拍摄对象与年代**，不要标成"1935 年历史照片"。

### 方式二：自己搜集官方党史图片

这是国内红色主题作品更常见的做法。步骤：

1. 从权威来源获取图片（党史机构、军史媒体、纪念馆、正式出版物）；
2. 把文件放到本目录，例如 `r1-zunyi.jpg`；
3. 在 `manifest.json` 中登记，**如实填写 `author`、`license`、`source`**——如果不确定许可，就在 `license` 里写清来源与授权情况，不要留空；
4. 确认内容无误后把 `reviewed` 改为 `true`。

> ⚠ 使用他人图片前请自行确认授权范围是否覆盖你的参赛/发布场景。本作品不对使用者自行引入的图片承担版权责任。

### 方式三：直接写在节点数据里

在 `src/data/armies.js` 的节点上直接加 `photo` 字段（例如 `photo: 'art/r1-luding.jpg'`）。这条路径**绕过 `reviewed` 检查**，等于你以作者身份为该图片的准确性背书，请谨慎使用。

## 图片建议

| 项目 | 建议 |
| --- | --- |
| 格式 | `.jpg`（照片）/ `.webp`（更小）；脚本同时支持 `.png` |
| 尺寸 | 宽度 ≥ 640px；详情卡显示区约 16:9，横构图最合适 |
| 体积 | 单张建议控制在 300KB 以内，过大会拖慢首屏 |
| 内容 | 优先"实地现状 + 可核对的地标"，避免使用无法核实来源的"历史场景图" |

## 界面上的标注

作品会在配图右上角明确标出这张图是**「史料图片」**还是**「手绘插画」**，并在题注里显示作者与许可。这样观众不会把手绘误当史料，评审核查图片出处时也能一眼看到依据。
