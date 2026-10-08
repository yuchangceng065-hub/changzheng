#!/usr/bin/env node
/**
 * 《长征征途》交付物端到端校验
 *
 * 用法：node scripts/verify.mjs
 *
 * 校验内容：
 *   1. 工程文件是否齐全（源码、组件、脚本、文档、底图声明）；
 *   2. 史实数据自检（转发 scripts/check-data.mjs，以退出码判定）；
 *   3. 底图是否就位，并用**与浏览器完全相同的自检逻辑**（analyzeIntegrity）
 *      判断领土表示是否完整（南海诸岛插图 / 九段线分开判定）；
 *   4. 依赖是否已安装、构建产物是否存在。
 *
 * 退出码：0 = 全部必需项通过；1 = 存在必需项未通过。
 */

import { existsSync, readFileSync, statSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { analyzeIntegrity } from '../src/map/loadBaseMap.js'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

const results = []
const record = (ok, level, name, detail = '') => results.push({ ok, level, name, detail })

const check = (ok, name, detail) => record(ok, 'required', name, detail)
const warn = (ok, name, detail) => record(ok, 'advisory', name, detail)

/* ------------------------------------------------------------------ */
/* 1. 文件齐全性                                                       */
/* ------------------------------------------------------------------ */
const REQUIRED_FILES = [
  'index.html',
  'package.json',
  'vite.config.js',
  'README.md',
  'src/main.js',
  'src/App.vue',
  'src/style.css',
  'src/data/armies.js',
  'src/data/sources.js',
  'src/data/specNotes.js',
  'src/data/artwork.js',
  'src/data/miniGames.js',
  'src/data/photoSource.js',
  'src/data/gallery.js',
  'src/map/loadBaseMap.js',
  'src/utils/geo.js',
  'src/utils/stars.js',
  'src/components/MapStage.vue',
  'src/components/ArmySelectPanel.vue',
  'src/components/TimelineStrip.vue',
  'src/components/NodeDetailCard.vue',
  'src/components/EventArtwork.vue',
  'src/components/MiniGameHost.vue',
  'src/components/GanziFactModal.vue',
  'src/components/SourcesDrawer.vue',
  'src/components/StarRating.vue',
  'src/components/NavBar.vue',
  'src/components/FlagCN.vue',
  'src/components/PartyEmblem.vue',
  'src/views/HomeView.vue',
  'src/views/ArmiesView.vue',
  'src/views/GalleryView.vue',
  'src/views/SpiritView.vue',
  'scripts/check-data.mjs',
  'scripts/fetch-basemap.mjs',
  'scripts/probe-basemap.mjs',
  'scripts/fetch-artwork.mjs',
  'docs/史实来源与注记.md',
  'docs/需求实现对照.md',
  'docs/配图清单.md',
  'public/map/README.md',
  'public/map/sources.json',
  'public/art/README.md',
  'public/art/manifest.json'
]

const missing = REQUIRED_FILES.filter((f) => !existsSync(path.join(ROOT, f)))
check(missing.length === 0, '工程文件齐全', missing.length ? `缺失：${missing.join('、')}` : `${REQUIRED_FILES.length} 个文件全部存在`)

/* ------------------------------------------------------------------ */
/* 2. 史实数据自检（转发，继承其输出）                                 */
/* ------------------------------------------------------------------ */
console.log('\n────────── 史实数据自检（check-data） ──────────')
const dataRun = spawnSync(process.execPath, [path.join(ROOT, 'scripts', 'check-data.mjs')], {
  stdio: 'inherit'
})
check(dataRun.status === 0, '史实数据自检通过', `check-data.mjs 退出码 ${dataRun.status}`)

/* ------------------------------------------------------------------ */
/* 3. 底图就位与领土表示自检                                            */
/* ------------------------------------------------------------------ */
console.log('\n────────── 底图领土表示自检（与浏览器同一套逻辑） ──────────')
const mapFile = path.join(ROOT, 'public', 'map', 'china.json')

if (!existsSync(mapFile)) {
  check(false, '底图文件已就位', '缺少 public/map/china.json，请先运行 pnpm fetch:basemap 或手动放置')
} else {
  const sizeKb = Math.round(statSync(mapFile).size / 1024)
  check(true, '底图文件已就位', `public/map/china.json（约 ${sizeKb} KB）`)

  let geo = null
  try {
    geo = JSON.parse(readFileSync(mapFile, 'utf8'))
  } catch (e) {
    check(false, '底图 JSON 可解析', e.message)
  }

  if (geo) {
    if (!Array.isArray(geo.features) || geo.features.length === 0) {
      check(false, '底图结构有效', '缺少 features 数组')
    } else {
      const it = analyzeIntegrity(geo)
      console.log(
        `  要素 ${it.featureCount} 个 · 台湾省 ${it.hasTaiwan ? '✓' : '✗'} · ` +
          `海南省 ${it.hasHainan ? '✓' : '✗'} · 南海诸岛插图 ${it.hasNanhaiFeature ? '✓' : '✗'} · ` +
          `九段线 ${it.dashConfirmed ? '✓' : '需人工确认'}` +
          (it.dashEvidence ? `（${it.dashEvidence}）` : '')
      )
      if (it.matchedNames.length) console.log(`  命中要素：${it.matchedNames.join('、')}`)

      check(it.hasTaiwan, '底图含台湾省要素')
      check(it.hasHainan, '底图含海南省要素')
      check(it.hasNanhaiFeature, '底图含南海诸岛插图要素')
      warn(
        it.dashConfirmed,
        '九段线可由数据自动确认',
        it.dashConfirmed
          ? it.dashEvidence || '已确认'
          : '未检测到九段线（名称 / adcode / 线状几何三种判据均未命中），必须在地图上目视核对九段线是否完整'
      )
      check(
        it.hasNanhaiFeature && it.dashConfirmed,
        '底图满足赛事使用条件',
        it.hasNanhaiFeature && it.dashConfirmed
          ? '客观检测项均通过（正式参赛仍建议改用带审图号标准地图）'
          : '不满足：正式提交前必须替换为自然资源部标准地图服务网站的带审图号标准地图'
      )
    }
  }
}

/* ------------------------------------------------------------------ */
/* 4. 依赖与构建产物                                                    */
/* ------------------------------------------------------------------ */
const depsInstalled = existsSync(path.join(ROOT, 'node_modules'))
warn(depsInstalled, '依赖已安装', depsInstalled ? '' : '未找到 node_modules，请先运行 pnpm install')

const distBuilt = existsSync(path.join(ROOT, 'dist', 'index.html'))
warn(distBuilt, '构建产物存在', distBuilt ? '' : '未找到 dist/index.html，可运行 pnpm build 生成')

/* ------------------------------------------------------------------ */
/* 汇总                                                                */
/* ------------------------------------------------------------------ */
const required = results.filter((r) => r.level === 'required')
const advisory = results.filter((r) => r.level === 'advisory')
const failedRequired = required.filter((r) => !r.ok)

console.log('\n================ 校验汇总 ================')
for (const r of results) {
  const mark = r.ok ? '✓' : r.level === 'required' ? '✗' : '!'
  console.log(`  ${mark} [${r.level === 'required' ? '必需' : '建议'}] ${r.name}${r.detail ? ` —— ${r.detail}` : ''}`)
}
console.log('=========================================')
console.log(`必需项 ${required.length - failedRequired.length}/${required.length} 通过；建议项 ${advisory.filter((r) => !r.ok).length} 项待办。`)

if (failedRequired.length) {
  console.error('\n校验未通过。请先修复上述标 ✗ 的必需项。')
  process.exit(1)
}
console.log('\n✓ 必需项全部通过。')
