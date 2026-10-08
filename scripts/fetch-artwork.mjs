#!/usr/bin/env node
/**
 * 大事件配图：真实图片获取脚本（可选）
 *
 * 用法：
 *   node scripts/fetch-artwork.mjs                 # 按内置清单检索并下载候选图片
 *   node scripts/fetch-artwork.mjs --node r1-luding # 只处理某个节点
 *   node scripts/fetch-artwork.mjs --list          # 只列出检索目标，不下载
 *
 * 行为：
 *   1. 到 Wikimedia Commons 检索每个历史地点/事件的图片；
 *   2. 只接受**明确自由许可**的图片（CC0 / CC BY / CC BY-SA / 公有领域），
 *      CC BY-NC、CC BY-ND 等一律跳过；
 *   3. 下载到 public/art/，并把出处、作者、许可写进 public/art/manifest.json；
 *   4. 所有新条目一律写成 `"reviewed": false`。
 *
 * ⚠ 为什么必须人工确认：
 *   脚本能自动下载，但**无法判断图片内容是否与史实表述相符**，也无法判断画面质量、
 *   是否存在不当内容。界面只渲染 `reviewed: true` 的条目，因此在你逐张看过并把
 *   标记改为 true 之前，作品显示的一律是手绘插画。这是刻意设置的安全阀——
 *   把没看过的图片当“历史照片”展示，等同于伪造史料。
 *
 * 提示：Commons 上多为**现今实地照片**（如今天的泸定桥、遵义会议会址），
 *   1930 年代的历史照片较少且版权状况复杂。对地图类科普作品而言，
 *   现今实地照片往往更贴切，只要如实标注拍摄对象与年代即可。
 */

import { mkdir, writeFile, readFile, stat } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const ART_DIR = path.join(ROOT, 'public', 'art')
const MANIFEST = path.join(ART_DIR, 'manifest.json')

const API = 'https://commons.wikimedia.org/w/api.php'

/** 检索目标：节点 id → 检索词（优先英文，Commons 英文条目更全） */
const TARGETS = [
  { node: 'r1-yudu', label: '于都（长征出发地）', terms: ['Yudu County', 'Yudu Jiangxi'] },
  { node: 'r1-xiangjiang', label: '湘江', terms: ['Xiang River Guangxi', 'Xiangjiang'] },
  { node: 'r1-zunyi', label: '遵义会议会址', terms: ['Zunyi Conference site', 'Zunyi meeting'] },
  { node: 'r1-chishui4', label: '赤水河', terms: ['Chishui River'] },
  { node: 'r1-jiaopingdu', label: '金沙江', terms: ['Jinsha River'] },
  { node: 'r1-luding', label: '泸定桥', terms: ['Luding Bridge'] },
  { node: 'r1-jiajinshan', label: '夹金山', terms: ['Jiajin Mountain', 'Jiajinshan'] },
  { node: 'r1-caodi', label: '松潘草地（若尔盖）', terms: ['Zoige', 'Ruoergai grassland'] },
  { node: 'r1-lazikou', label: '腊子口', terms: ['Lazikou', 'Dianbu County'] },
  { node: 'r1-wuqi', label: '吴起镇', terms: ['Wuqi County'] },
  { node: 'r25-hejiachong', label: '何家冲（罗山）', terms: ['Luoshan County Henan'] },
  { node: 'r25-dushuzhen', label: '独树镇（方城）', terms: ['Fangcheng County Henan'] },
  { node: 'r26-liujiaping', label: '刘家坪（桑植）', terms: ['Sangzhi County'] },
  { node: 'r26-wumengshan', label: '乌蒙山', terms: ['Wumeng Mountains'] },
  { node: 'r26-ganzi', label: '甘孜', terms: ['Ganzi County', 'Garze'] },
  { node: 'r26-jiangtaibao', label: '将台堡', terms: ['Jiangtaibao', 'Xiji County'] },
  { node: 'r4-jiadingjiang', label: '苍溪（嘉陵江渡口）', terms: ['Cangxi County'] },
  { node: 'r4-jianmenguan', label: '剑门关', terms: ['Jianmen Pass'] },
  { node: 'r4-huining', label: '会宁', terms: ['Huining County'] }
]

/** 可接受的自由许可 */
const OK_LICENSE = /(CC0|CC[ -]BY(?!-NC|-ND)|Public domain|PD-|GFDL)/i
/** 明确排除的许可 */
const BAD_LICENSE = /(-NC|-ND|NonCommercial|NoDeriv)/i

const UA =
  'LongMarchJourney/1.0 (educational Long March map project; contact: local project owner)'

function parseArgs(argv) {
  const args = { node: '', list: false }
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--node') args.node = argv[i + 1] || ''
    else if (argv[i] === '--list') args.list = true
  }
  return args
}

const stripHtml = (s) =>
  String(s || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim()

async function api(params) {
  const url = `${API}?${new URLSearchParams({ format: 'json', formatversion: '2', ...params })}`
  const res = await fetch(url, { headers: { 'User-Agent': UA }, redirect: 'follow' })
  if (!res.ok) throw new Error(`Commons API HTTP ${res.status}`)
  return res.json()
}

/** 检索一个目标，返回首个许可合格的候选 */
async function findCandidate(term) {
  const data = await api({
    action: 'query',
    generator: 'search',
    gsrsearch: term,
    gsrnamespace: '6',
    gsrlimit: '8',
    prop: 'imageinfo',
    iiprop: 'url|mime|size|extmetadata',
    iiextmetadatafilter: 'LicenseShortName|Artist|ImageDescription|LicenseUrl'
  })

  const pages = (data && data.query && data.query.pages) || []
  for (const page of pages) {
    const info = page.imageinfo && page.imageinfo[0]
    if (!info) continue
    if (!/^image\/(jpeg|png|webp)$/.test(info.mime || '')) continue
    // 太小的图不做配图
    if ((info.width || 0) < 640) continue

    const meta = info.extmetadata || {}
    const license = stripHtml(meta.LicenseShortName && meta.LicenseShortName.value)
    if (BAD_LICENSE.test(license)) continue
    if (!OK_LICENSE.test(license)) continue

    return {
      fileUrl: info.url,
      mime: info.mime,
      width: info.width,
      height: info.height,
      pageUrl: `https://commons.wikimedia.org/wiki/${encodeURIComponent(page.title)}`,
      title: stripHtml(page.title.replace(/^File:/, '')),
      license,
      licenseUrl: stripHtml(meta.LicenseUrl && meta.LicenseUrl.value),
      author: stripHtml(meta.Artist && meta.Artist.value),
      description: stripHtml(meta.ImageDescription && meta.ImageDescription.value).slice(0, 300)
    }
  }
  return null
}

function extFor(mime) {
  if (/png/.test(mime)) return 'png'
  if (/webp/.test(mime)) return 'webp'
  return 'jpg'
}

async function readManifest() {
  try {
    const data = JSON.parse(await readFile(MANIFEST, 'utf8'))
    return data && typeof data === 'object' ? data : { photos: {} }
  } catch {
    return { photos: {} }
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2))

  if (args.list) {
    console.log('检索目标：')
    TARGETS.forEach((t) => console.log(`  ${t.node.padEnd(18)} ${t.label}  ← ${t.terms.join(' / ')}`))
    return
  }

  if (typeof fetch !== 'function') {
    console.error('需要 Node 18+（内置 fetch）。')
    process.exit(1)
  }

  await mkdir(ART_DIR, { recursive: true })
  const manifest = await readManifest()
  manifest.photos = manifest.photos || {}

  const targets = args.node ? TARGETS.filter((t) => t.node === args.node) : TARGETS
  if (!targets.length) {
    console.error(`没有匹配的目标：${args.node}。可用 --list 查看全部目标。`)
    process.exit(1)
  }

  let saved = 0
  let skipped = 0
  let networkFailures = 0

  for (const target of targets) {
    process.stdout.write(`\n· ${target.label}（${target.node}）\n`)

    let candidate = null
    for (const term of target.terms) {
      try {
        candidate = await findCandidate(term)
      } catch (e) {
        const msg = e && e.message ? e.message : String(e)
        if (/fetch failed|ENOTFOUND|ECONNRESET|ETIMEDOUT|EAI_AGAIN/i.test(msg)) {
          networkFailures += 1
        }
        console.log(`  检索「${term}」失败：${msg}`)
        candidate = null
      }
      if (candidate) {
        console.log(`  命中（检索词「${term}」）：${candidate.title}`)
        break
      }
      console.log(`  检索「${term}」无合格结果（太小或许可不适配）`)
    }

    if (!candidate) {
      console.log('  跳过：未找到许可合格且尺寸合适的图片')
      skipped += 1
      continue
    }

    const ext = extFor(candidate.mime)
    const fileName = `${target.node}.${ext}`
    const filePath = path.join(ART_DIR, fileName)

    try {
      const res = await fetch(candidate.fileUrl, {
        headers: { 'User-Agent': UA },
        redirect: 'follow'
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const buf = Buffer.from(await res.arrayBuffer())
      await writeFile(filePath, buf)

      const sizeKb = Math.round((await stat(filePath)).size / 1024)
      console.log(
        `  已保存 public/art/${fileName}（${sizeKb} KB，${candidate.width}×${candidate.height}）`
      )

      // 保留已有的 reviewed 标记，避免重跑时把人工确认结果冲掉
      const existing = manifest.photos[target.node]
      manifest.photos[target.node] = {
        file: fileName,
        reviewed: Boolean(existing && existing.reviewed),
        label: target.label,
        title: candidate.title,
        description: candidate.description,
        author: candidate.author,
        license: candidate.license,
        licenseUrl: candidate.licenseUrl,
        source: candidate.pageUrl,
        note: '脚本自动下载。请打开图片确认内容与史实表述相符、画面可用后，把 reviewed 改为 true。'
      }
      saved += 1
    } catch (e) {
      console.log(`  下载失败：${e.message}`)
      skipped += 1
    }
  }

  await writeFile(MANIFEST, JSON.stringify(manifest, null, 2) + '\n', 'utf8')

  console.log('\n================ 结果 ================')
  console.log(`  新增/更新图片 ${saved} 张，跳过 ${skipped} 个目标`)
  console.log(`  清单：public/art/manifest.json`)

  const pending = Object.entries(manifest.photos).filter(([, v]) => v && !v.reviewed)
  console.log(`  待人工确认：${pending.length} 条（reviewed 仍为 false）`)

  if (pending.length) {
    console.log(
      '\n  ⚠ 重要：这些图片目前**不会显示**，作品仍使用手绘插画。\n' +
        '    请逐张打开 public/art/ 下的图片，确认：\n' +
        '      1. 画面内容与节点对应的史实表述相符（这是最关键的一条）；\n' +
        '      2. 画面清晰、无不当内容；\n' +
        '      3. 许可与署名适合你的参赛/发布场景。\n' +
        '    确认无误后，把 manifest.json 里对应条目的 "reviewed": false 改为 true。\n' +
        '    Commons 上多为现今实地照片，请在 title 里如实写明拍摄对象与年代。'
    )
  }

  // 全部失败且都是网络错误时，给出明确解释与替代路径，
  // 避免把“网络被封锁”误判成脚本缺陷。
  if (saved === 0 && networkFailures > 0) {
    console.log(
      '\n  ⚠ 检测到所有请求都是网络错误（fetch failed），这通常意味着\n' +
        '    commons.wikimedia.org 在当前网络环境下无法直连（中国大陆常见），\n' +
        '    而不是脚本本身有问题。\n' +
        '\n    可行的替代做法：\n' +
        '      1. 自己搜集图片（党史机构、军史媒体、纪念馆、正式出版物等），\n' +
        '         放进 public/art/，再在 manifest.json 里登记出处、作者、许可；\n' +
        '      2. 或使用可直连的自由图库（注意确认许可与是否可直连）；\n' +
        '      3. 或维持手绘插画——作品会在配图上明确标注“手绘插画”，不会被误当史料。\n' +
        '\n    登记方式见 public/art/README.md。'
    )
  }
  console.log('=====================================\n')
}

main().catch((e) => {
  console.error('执行失败：', e && e.message ? e.message : e)
  process.exit(1)
})
