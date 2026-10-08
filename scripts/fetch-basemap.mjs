#!/usr/bin/env node
/**
 * 《长征征途》底图获取与合规自检脚本
 *
 * 用法：
 *   node scripts/fetch-basemap.mjs                    # 依次尝试内置候选源
 *   node scripts/fetch-basemap.mjs --url <URL>        # 指定来源
 *   node scripts/fetch-basemap.mjs --url <URL> --strict
 *
 * 行为：
 *   1. 下载中国矢量底图 GeoJSON，校验 JSON 结构与 FeatureCollection 完整性；
 *   2. 用**与浏览器完全相同**的判据（src/map/loadBaseMap.js 的 analyzeIntegrity）
 *      自检法定表示要素：台湾省、海南省、南海诸岛岛屿、九段线；
 *   3. 写入 public/map/china.json，并按实际情况更新 public/map/sources.json；
 *   4. 打印合规检查清单——**不会**替使用者判定“已合规”，只报告客观检测结果。
 *
 * 注意：本脚本不简化、不裁剪、不修改任何坐标，保证底图边界与来源一致。
 */

import { mkdir, writeFile, readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { analyzeIntegrity } from '../src/map/loadBaseMap.js'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const MAP_DIR = path.join(ROOT, 'public', 'map')
const OUT_FILE = path.join(MAP_DIR, 'china.json')
const SOURCES_FILE = path.join(MAP_DIR, 'sources.json')

/**
 * 内置候选源。
 *
 * ⚠ 这些来源的合规性差异很大，务必以脚本输出的四项客观检测为准：
 *   - ECharts 4.x 内置 china.json 只有 34 个省级要素，**既无南海诸岛插图、
 *     也无九段线**，经实测确认，仅可用于看界面，不可用于任何正式场合；
 *   - DataV.GeoAtlas 的 100000_full.json 含 35 个要素，其中第 35 个
 *     `adcode=100000_JD`（JD 即“九段”）为九段线，南海诸岛岛屿包含在海南省要素内，
 *     是目前实测最完整的开源选择，但仍非带审图号的标准地图。
 * 正式参赛、公开发布或出版前，必须替换为自然资源部标准地图服务网站
 * （http://bzdt.ch.mnr.gov.cn/）发布的带审图号标准地图。
 */
const CANDIDATES = [
  {
    url: 'https://geo.datav.aliyun.com/areas_v3/bound/100000_full.json',
    publisher: '阿里云 DataV.GeoAtlas 行政区划数据服务',
    license: '以该服务条款为准',
    knownIssues:
      '含 35 个要素（第 35 个 adcode=100000_JD 为九段线，南海诸岛岛屿含于海南省要素内）；非带审图号标准地图'
  },
  {
    url: 'https://cdn.jsdelivr.net/npm/echarts@4.9.0/map/json/china.json',
    publisher: 'Apache ECharts 4.9.0 官方 npm 包内置中国地图数据（经 jsDelivr 分发）',
    license: 'Apache-2.0',
    knownIssues: '已实测确认：仅 34 个省级要素，缺南海诸岛插图与九段线，不可用于正式提交'
  },
  {
    url: 'https://unpkg.com/echarts@4.9.0/map/json/china.json',
    publisher: 'Apache ECharts 4.9.0 官方 npm 包内置中国地图数据（经 unpkg 分发）',
    license: 'Apache-2.0',
    knownIssues: '同 ECharts 4.9.0：缺南海诸岛插图与九段线，不可用于正式提交'
  }
]

function parseArgs(argv) {
  const args = { url: '', name: 'china.json', strict: false }
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--url') args.url = argv[i + 1] || ''
    else if (argv[i] === '--name') args.name = argv[i + 1] || 'china.json'
    else if (argv[i] === '--strict') args.strict = true
  }
  return args
}

async function download(url) {
  const res = await fetch(url, { redirect: 'follow' })
  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`)
  const text = await res.text()
  if (!text || text.length < 200) throw new Error('返回内容过短，可能不是有效数据')
  return text
}

function validate(raw, url) {
  let geo
  try {
    geo = JSON.parse(raw)
  } catch (e) {
    throw new Error(`不是合法 JSON：${e.message}`)
  }
  if (!geo || geo.type !== 'FeatureCollection' || !Array.isArray(geo.features)) {
    throw new Error('不是合法的 GeoJSON FeatureCollection')
  }
  if (geo.features.length < 20) {
    throw new Error(`要素数量异常（仅 ${geo.features.length} 个），可能不是省级以上底图`)
  }

  const integrity = analyzeIntegrity(geo)
  if (!integrity.provinceCount) {
    throw new Error('要素缺少 properties.name，无法做地名自检')
  }

  const badGeom = geo.features.filter((f) => !f.geometry || !f.geometry.type).length
  if (badGeom) console.warn(`  ! 有 ${badGeom} 个要素缺少 geometry，已原样保留`)

  return { geo, url, integrity }
}

async function readExistingSources() {
  try {
    return JSON.parse(await readFile(SOURCES_FILE, 'utf8'))
  } catch {
    return {}
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2))

  if (typeof fetch !== 'function') {
    console.error('当前 Node.js 版本过低（需要 Node 18+ 才内置 fetch）。请升级 Node 后重试。')
    process.exit(1)
  }

  await mkdir(MAP_DIR, { recursive: true })

  const targets = args.url
    ? [{ url: args.url, publisher: '使用者指定来源', license: '以来源声明为准' }]
    : CANDIDATES

  let result = null
  const failures = []

  for (const target of targets) {
    process.stdout.write(`尝试来源：${target.url}\n`)
    if (target.knownIssues) console.log(`  ! 已知情况：${target.knownIssues}`)
    try {
      const raw = await download(target.url)
      result = { ...validate(raw, target.url), meta: target }
      console.log(
        `  成功：${result.integrity.featureCount} 个要素，${result.integrity.provinceCount} 个带名称要素`
      )
      break
    } catch (e) {
      console.log(`  失败：${e.message}`)
      failures.push({ url: target.url, message: e.message })
    }
  }

  if (!result) {
    console.error('\n所有候选来源均失败：')
    failures.forEach((f) => console.error(`  ✗ ${f.url} —— ${f.message}`))
    console.error(
      '\n请改用 --url 指定可访问的底图地址，或从自然资源部标准地图服务网站（http://bzdt.ch.mnr.gov.cn/）获取后手动放入 public/map/china.json。'
    )
    process.exit(1)
  }

  // 原样写回：不做坐标简化、不做裁剪，保证与来源一致
  await writeFile(OUT_FILE, JSON.stringify(result.geo), 'utf8')
  console.log(`\n已写入 ${path.relative(ROOT, OUT_FILE)}`)

  const it = result.integrity
  const sources = await readExistingSources()
  const next = {
    ...sources,
    id: sources.id || 'cn-provinces-vector',
    description:
      '中国省级行政区划矢量底图（GeoJSON，FeatureCollection），用于《长征征途》地图渲染。底图按来源原样使用，未对任何边界、岛屿或海岸线作增删与简化。',
    publisher: result.meta.publisher,
    url: result.url,
    obtainedAt: new Date().toISOString().slice(0, 10),
    license: result.meta.license,
    checks: {
      featureCount: it.featureCount,
      hasTaiwan: it.hasTaiwan,
      hasHainan: it.hasHainan,
      hasNanhaiFeature: it.hasNanhaiFeature,
      nanhaiFeatureNames: it.nanhaiFeatureNames,
      dashConfirmed: it.dashConfirmed,
      dashEvidence: it.dashEvidence,
      matchedNames: it.matchedNames
    },
    standardMapNote:
      '如用于正式参赛、公开发布或出版，请以自然资源部标准地图服务网站（bzdt.ch.mnr.gov.cn）发布的带审图号标准地图为准，并按要求标注审图号。'
  }
  await writeFile(SOURCES_FILE, JSON.stringify(next, null, 2) + '\n', 'utf8')
  console.log(`已更新 ${path.relative(ROOT, SOURCES_FILE)}`)

  /* ---------------- 合规检查清单（只报告客观结果） ---------------- */
  console.log('\n================ 底图合规自检 ================')
  const mark = (ok) => (ok ? '✓ 检测到' : '✗ 未检测到')
  console.log(`  台湾省          ${mark(it.hasTaiwan)}`)
  console.log(`  海南省          ${mark(it.hasHainan)}`)
  console.log(`  南海诸岛插图    ${mark(it.hasNanhaiFeature)}`)
  if (it.hasNanhaiFeature) console.log(`                  （${it.nanhaiFeatureNames.join('、')}）`)
  console.log(`  九段线          ${it.dashConfirmed ? '✓ 已确认' : '⚠ 无法自动确认'}`)
  if (it.dashEvidence) console.log(`                  （${it.dashEvidence}）`)
  if (it.matchedNames.length) console.log(`  命中要素名称    ${it.matchedNames.join('、')}`)

  if (!it.hasNanhaiFeature) {
    console.log(
      '\n  ! 未检测到“南海诸岛”插图要素。请更换底图，或补充 public/map/nanhai.json，' +
        '否则界面会显示领土表示告警。'
    )
  }
  if (!it.dashConfirmed) {
    console.log(
      '\n  ! 未检测到九段线（名称 / adcode / 线状几何三种判据均未命中）。' +
        '很多第三方底图只画了南海诸岛插图而缺少九段线，请更换底图或补充 public/map/nanhai.json。'
    )
  }

  console.log(
    '\n  仍需人工确认（脚本无法替代）：\n' +
      '   1. 在界面中放大南海方向，确认南海诸岛插图与九段线完整、未被裁切；\n' +
      '   2. 确认台湾省、海南省域边界完整；\n' +
      '   3. 正式参赛或出版前，改用自然资源部标准地图服务网站的带审图号标准地图，并标注审图号。'
  )

  const compliant = it.hasTaiwan && it.hasHainan && it.hasNanhaiFeature && it.dashConfirmed
  if (!compliant) {
    console.log(
      '\n  ⛔ 结论：当前底图【不满足赛事使用条件】。界面会显示领土表示告警。' +
        '请务必在正式提交前替换为自然资源部标准地图服务网站（bzdt.ch.mnr.gov.cn）的带审图号标准地图。'
    )
  } else {
    console.log(
      '\n  ✓ 客观检测项均通过。注意：这仍不等于“已合规”——还需完成上述人工目视确认，' +
        '并在正式提交前按赛事要求替换为带审图号的标准地图。'
    )
  }
  console.log('=============================================\n')

  if (args.strict && !compliant) {
    console.error('严格模式（--strict）：底图未通过合规自检，退出码 1。')
    process.exit(1)
  }
}

main().catch((e) => {
  console.error('执行失败：', e && e.message ? e.message : e)
  process.exit(1)
})
