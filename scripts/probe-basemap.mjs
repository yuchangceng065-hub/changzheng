#!/usr/bin/env node
/**
 * 底图候选源对比探测
 *
 * 用法：
 *   node scripts/probe-basemap.mjs                       # 探测内置候选源
 *   node scripts/probe-basemap.mjs --url <URL> [--url <URL> ...]
 *   node scripts/probe-basemap.mjs --dump --url <URL>    # 打印每个要素的名称/代码/范围
 *
 * 作用：把多个候选底图源分别下载并跑一遍**与浏览器、与 fetch-basemap 完全相同**的
 *      领土表示自检（src/map/loadBaseMap.js 的 analyzeIntegrity），并排列出结果。
 *      三个入口共用同一套判据，因此不会出现互相矛盾的结论。
 *
 * 本脚本只读不写：不会覆盖 public/map/china.json。确认合适的源之后，
 * 再用 `pnpm fetch:basemap --url <该源>` 正式写入。
 */

import {
  analyzeIntegrity,
  bboxOf,
  inSouthChinaSea
} from '../src/map/loadBaseMap.js'

/** 内置候选源 */
const CANDIDATES = [
  {
    url: 'https://geo.datav.aliyun.com/areas_v3/bound/100000_full.json',
    note: '阿里云 DataV.GeoAtlas 省级行政区划（含 100000_JD 九段线要素）'
  },
  {
    url: 'https://cdn.jsdelivr.net/npm/echarts@4.9.0/map/json/china.json',
    note: 'Apache ECharts 4.9.0 内置（经实测仅 34 个省级要素）'
  },
  {
    url: 'https://unpkg.com/echarts@4.9.0/map/json/china.json',
    note: '同 ECharts 4.9.0（经 unpkg 分发）'
  }
]

function parseArgs(argv) {
  const urls = []
  let dump = false
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--url' && argv[i + 1]) urls.push({ url: argv[i + 1], note: '命令行指定' })
    else if (argv[i] === '--dump') dump = true
  }
  return { urls, dump }
}

/** 逐个要素打印名称、行政代码、几何类型与外接矩形 */
function dumpFeatures(geo, url) {
  console.log(`  ── 要素清单（${url}） ──`)
  const features = geo.features || []
  features.forEach((f, i) => {
    const props = f.properties || {}
    const name = props.name || props.NAME || ''
    const adcode = props.adcode || props.ADCODE || ''
    const type = (f.geometry && f.geometry.type) || '(无几何)'
    const bbox = bboxOf(f.geometry)
    const scs = inSouthChinaSea(bbox)
    console.log(
      `  ${String(i + 1).padStart(2)}. ` +
        `name=${name || '<空>'}  adcode=${adcode || '-'}  ${type}  ` +
        `bbox=${bbox ? bbox.map((v) => v.toFixed(2)).join(', ') : '-'}` +
        (scs ? '   ← 完全落在南海范围' : '')
    )
  })
  console.log('')
}

async function probe(candidate) {
  const started = Date.now()
  try {
    const res = await fetch(candidate.url, { redirect: 'follow' })
    if (!res.ok) {
      return { ...candidate, ok: false, error: `HTTP ${res.status} ${res.statusText}` }
    }
    const text = await res.text()
    let geo
    try {
      geo = JSON.parse(text)
    } catch (e) {
      return { ...candidate, ok: false, error: `不是合法 JSON：${e.message}`, bytes: text.length }
    }
    if (!geo || !Array.isArray(geo.features)) {
      return { ...candidate, ok: false, error: '不是 GeoJSON FeatureCollection', bytes: text.length }
    }

    const it = analyzeIntegrity(geo)
    const compliant = it.hasTaiwan && it.hasHainan && it.hasNanhaiFeature && it.dashConfirmed

    return {
      ...candidate,
      ok: true,
      geo,
      bytes: text.length,
      ms: Date.now() - started,
      featureCount: it.featureCount,
      hasTaiwan: it.hasTaiwan,
      hasHainan: it.hasHainan,
      hasNanhai: it.hasNanhaiFeature,
      nanhaiNames: it.nanhaiFeatureNames,
      dashConfirmed: it.dashConfirmed,
      dashEvidence: it.dashEvidence,
      matchedNames: it.matchedNames,
      compliant
    }
  } catch (e) {
    return { ...candidate, ok: false, error: e && e.message ? e.message : String(e) }
  }
}

const MARK = (ok) => (ok ? '✓' : '✗')

async function main() {
  if (typeof fetch !== 'function') {
    console.error('需要 Node 18+（内置 fetch）。')
    process.exit(1)
  }

  const { urls, dump } = parseArgs(process.argv.slice(2))
  const list = urls.length ? urls : CANDIDATES

  console.log(`探测 ${list.length} 个候选源…\n`)

  const results = []
  for (const c of list) {
    process.stdout.write(`· ${c.url}\n`)
    const r = await probe(c)
    if (r.ok) {
      console.log(
        `  下载 ${(r.bytes / 1024).toFixed(0)} KB / ${r.ms} ms · 要素 ${r.featureCount} 个\n`
      )
      if (dump) dumpFeatures(r.geo, r.url)
    } else {
      console.log(`  失败：${r.error}\n`)
    }
    results.push(r)
  }

  console.log('================ 对比结果 ================')
  console.log('  源                                              台湾 海南 南海诸岛 九段线  结论')
  for (const r of results) {
    const label = (r.url.length > 46 ? r.url.slice(0, 43) + '...' : r.url).padEnd(46)
    if (!r.ok) {
      console.log(`  ${label}  -    -    -        -      不可用（${r.error}）`)
      continue
    }
    console.log(
      `  ${label}  ${MARK(r.hasTaiwan)}    ${MARK(r.hasHainan)}    ${MARK(r.hasNanhai)}       ` +
        `${MARK(r.dashConfirmed)}      ${r.compliant ? '★ 四项齐全' : '不满足'}`
    )
  }
  console.log('=========================================')

  const good = results.filter((r) => r.ok && r.compliant)

  if (good.length) {
    console.log('\n★ 四项客观检测齐全的源：')
    for (const g of good) {
      console.log(`  ${g.url}`)
      console.log(`    南海诸岛：${g.nanhaiNames.join('、')}`)
      console.log(`    九段线：${g.dashEvidence}`)
    }
    console.log(
      `\n下一步：pnpm fetch:basemap --url ${good[0].url}\n` +
        '注意：脚本判定的只是“客观检测项齐全”。仍需人工目视确认九段线与南海诸岛插图\n' +
        '未被裁切、边界完整，并在正式提交前改用带审图号的标准地图。'
    )
  } else {
    console.log(
      '\n没有找到四项齐全的源。可行的做法：\n' +
        '  1. 从自然资源部标准地图服务网站（http://bzdt.ch.mnr.gov.cn/）获取带审图号的合规底图；\n' +
        '  2. 或自备一份含南海诸岛与九段线的数据，放入 public/map/china.json；\n' +
        '  3. 或只补一份南海诸岛/九段线要素放入 public/map/nanhai.json（应用会自动并入）。\n' +
        '  也可以再用 --url 指定其它源继续探测。'
    )
  }
}

main().catch((e) => {
  console.error('执行失败：', e && e.message ? e.message : e)
  process.exit(1)
})
