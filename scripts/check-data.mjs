#!/usr/bin/env node
/**
 * 《长征征途》史实数据自检
 *
 * 运行：node scripts/check-data.mjs
 * 作用：在构建前校验四支部队节点数据的结构完整性、地理合理性与需求符合性，
 *      避免出现坐标越界、字段缺失、id 重复、甘孜专题缺失等问题。
 */

import { readFileSync } from 'node:fs'
import { ARMIES, NODE_KINDS, GANZI_FACT } from '../src/data/armies.js'
import { SOURCES } from '../src/data/sources.js'
import { SPEC_NOTES, SPEC_NOTE_KEYWORDS, START_LABEL, SELECT_LEDE } from '../src/data/specNotes.js'
import { ART_BY_NODE } from '../src/data/artwork.js'
import { MINI_GAME_BY_NODE } from '../src/data/miniGames.js'
import { cumulativeDistances } from '../src/utils/geo.js'

/** 中国大陆 + 海南 + 南海诸岛 + 台湾的宽松经纬度范围（用于拦截明显错误的坐标） */
const BBOX = { minLon: 73, maxLon: 136, minLat: 3, maxLat: 54 }

/** 单段直线距离上限（公里）：超过则说明坐标很可能写错 */
const MAX_LEG_KM = 1200

const errors = []
const warnings = []

const fail = (m) => errors.push(m)
const warn = (m) => warnings.push(m)

const REQUIRED_NODE_FIELDS = [
  'id',
  'name',
  'place',
  'coord',
  'date',
  'kind',
  'hardship',
  'brief',
  'detail'
]

const sourceIds = new Set(SOURCES.map((s) => s.id))
const armyIds = new Set()
const nodeIds = new Set()

for (const army of ARMIES) {
  const tag = `[${army.id}]`

  if (armyIds.has(army.id)) fail(`${tag} 部队 id 重复`)
  armyIds.add(army.id)

  for (const field of ['name', 'startPlace', 'startDate', 'endDate', 'duration', 'totalDistance', 'summary']) {
    if (!army[field]) fail(`${tag} 缺少字段 ${field}`)
  }

  if (typeof army.stars !== 'number' || army.stars < 0 || army.stars > 5) {
    fail(`${tag} 难度星级必须在 0—5 之间`)
  } else if (Math.round(army.stars * 2) !== army.stars * 2) {
    fail(`${tag} 难度星级只允许整星或半星`)
  }

  for (const sid of army.sources || []) {
    if (!sourceIds.has(sid)) fail(`${tag} 引用了不存在的来源 id：${sid}`)
  }
  if (!(army.sources || []).length) warn(`${tag} 未标注史实来源`)

  if (!Array.isArray(army.nodes) || army.nodes.length < 5) {
    fail(`${tag} 节点数量过少或不是数组`)
    continue
  }

  army.nodes.forEach((node, i) => {
    const ntag = `${tag} 节点#${i + 1}(${node.id || '无id'})`

    for (const field of REQUIRED_NODE_FIELDS) {
      if (node[field] === undefined || node[field] === null || node[field] === '') {
        fail(`${ntag} 缺少字段 ${field}`)
      }
    }

    if (nodeIds.has(node.id)) fail(`${ntag} 节点 id 全局重复`)
    nodeIds.add(node.id)

    if (!Array.isArray(node.coord) || node.coord.length !== 2) {
      fail(`${ntag} coord 必须是 [经度, 纬度]`)
    } else {
      const [lon, lat] = node.coord
      if (!Number.isFinite(lon) || !Number.isFinite(lat)) fail(`${ntag} 坐标不是有效数字`)
      else if (lon < BBOX.minLon || lon > BBOX.maxLon || lat < BBOX.minLat || lat > BBOX.maxLat) {
        fail(`${ntag} 坐标超出中国范围：${lon}, ${lat}`)
      }
    }

    if (!NODE_KINDS[node.kind]) fail(`${ntag} 未知节点类型：${node.kind}`)

    if (!Number.isInteger(node.hardship) || node.hardship < 1 || node.hardship > 5) {
      fail(`${ntag} 艰难程度必须是 1—5 的整数`)
    }

    if (!/年/.test(node.date || '')) warn(`${ntag} 日期未包含年份：${node.date}`)

    if ((node.detail || '').length < 30) warn(`${ntag} 事件简介过短，建议补充史实细节`)
  })

  // 出发节点：必须存在且只有一个，并且不能埋在行程中间。
  // 允许「出发前在附近召开的决策会议」排在出发节点之前——例如红 25 军的
  // 花山寨会议（1934.11.11）决定实行战略转移，部队五天后才从何家冲出发（11.16），
  // 按时间顺序这类会议本就应该排在出发之前。故允许出发节点落在前两位。
  const startIndex = army.nodes.findIndex((n) => n.kind === 'start')
  const startCount = army.nodes.filter((n) => n.kind === 'start').length
  if (startIndex < 0) fail(`${tag} 缺少 kind 为 start 的出发节点`)
  else if (startIndex > 1) {
    fail(`${tag} 出发节点位置过靠后（第 ${startIndex + 1} 个节点），请检查节点顺序`)
  }
  if (startCount > 1) fail(`${tag} 有 ${startCount} 个出发节点，应只有 1 个`)

  if (army.nodes[army.nodes.length - 1].kind !== 'end') {
    fail(`${tag} 末个节点类型应为 end`)
  }

  const { legs, total } = cumulativeDistances(army.nodes)

  legs.forEach((km, i) => {
    if (km > MAX_LEG_KM) {
      fail(`${tag} 第 ${i} → ${i + 1} 段直线距离 ${Math.round(km)} 公里，疑似坐标错误`)
    }
  })

  const avg = total / (army.nodes.length - 1)
  if (avg < 30) warn(`${tag} 平均站间直线距离仅 ${avg.toFixed(0)} 公里，节点可能过密`)

  console.log(
    `${army.id.padEnd(6)} ${army.name.padEnd(8)} 节点 ${String(army.nodes.length).padStart(2)} 个  ` +
      `沿线直线合计约 ${total.toFixed(0).padStart(5)} 公里  平均 ${avg.toFixed(0).padStart(4)} 公里/段  星级 ${army.stars}`
  )
}

/* ---------- 需求专项校验 ---------- */

// 需求：红二、六军团行至甘孜节点必须触发专题史实弹窗
const red26 = ARMIES.find((a) => a.id === 'red26')
const ganziNode = red26 && red26.nodes.find((n) => n.special === 'ganzi')
if (!ganziNode) {
  fail('[需求] 红二、六军团缺少 special=ganzi 的甘孜节点，无法触发必修史实弹窗')
} else if (!/甘孜/.test(ganziNode.place)) {
  fail('[需求] 标记为 ganzi 的节点地点不是甘孜')
}

// 需求：甘孜史实说明必须包含三条核心表述
const ganziText = GANZI_FACT.points.join('')
for (const keyword of ['红二、六军团', '刘家坪', '红32军', '红二方面军', '木黄', '1936年7月5日', '不并入']) {
  if (!ganziText.includes(keyword)) fail(`[需求] 甘孜史实说明缺少关键表述：${keyword}`)
}
if (GANZI_FACT.points.length !== 3) {
  warn(`[需求] 甘孜史实说明现有 ${GANZI_FACT.points.length} 条，需求给定为 3 条`)
}

// 需求：四支部队出发地必须与需求文档逐字一致
for (const [id, place] of Object.entries(START_LABEL)) {
  const army = ARMIES.find((a) => a.id === id)
  if (!army) {
    fail(`[需求] 缺少部队：${id}`)
    continue
  }
  if (army.startPlace !== place) {
    fail(`[需求] ${id} 出发地与需求不一致：${army.startPlace} ≠ ${place}`)
  }
}

// 需求：首页引导语必须与当前口径一致
// 注：需求原文后半句为「难度星级代表当年行军的艰险程度，并非部队作战强弱。」
// 按作者要求删除难度星级后，该句失去指代对象，一并删除——详见 data/specNotes.js 的注释。
const REQUIRED_LEDE = '选择一支从不同起点踏上长征之路的红军部队，跟随行军路线，亲历长征征途。'
if (SELECT_LEDE !== REQUIRED_LEDE) {
  fail('[需求] 首页引导语与当前口径不一致（含标点）')
}

// 需求：四张选项卡片的备注文案必须逐字保留需求原文（数字前后亦不加空格）
for (const [id, keywords] of Object.entries(SPEC_NOTE_KEYWORDS)) {
  const note = SPEC_NOTES[id]
  if (!note) {
    fail(`[需求] 缺少 ${id} 的选项卡片备注文案`)
    continue
  }
  for (const kw of keywords) {
    if (!note.includes(kw)) fail(`[需求] ${id} 备注文案缺少关键表述：${kw}`)
  }
}

// 需求：红25军必须注明“唯一一支长征结束时人数多于出发时”
const red25 = ARMIES.find((a) => a.id === 'red25')
if (red25 && !/人数多于出发时/.test(red25.summary + red25.strength)) {
  fail('[需求] 红25军缺少“长征结束时人数多于出发时”的表述')
}

// 需求：红二、六军团必须说明甘孜整编为红二方面军，最终将台堡会师
if (red26) {
  const last = red26.nodes[red26.nodes.length - 1]
  if (!/将台堡/.test(last.place)) fail('[需求] 红二、六军团终点应为将台堡会师')
}

// 需求：红四方面军必须体现会宁三大主力会师
// 注：按作者提供的《四路主力红军完整长征路线大事记》，红四方面军的行军在会宁会师
// 之后还延续到 11 月的山城堡战役与 12 月 2 日红军总部到达保安，因此末节点是保安会合，
// 这里改为校验“会宁会师必须作为节点存在”，而不是“必须是最后一个节点”。
const red4 = ARMIES.find((a) => a.id === 'red4')
if (red4) {
  if (!red4.nodes.some((n) => /会宁/.test(n.place))) {
    fail('[需求] 红四方面军缺少会宁三大主力会师节点')
  }
  if (!red4.nodes.some((n) => /会宁/.test(n.place) && n.kind === 'meeting')) {
    warn('[需求] 会宁会师节点类型不是 meeting')
  }
}

/* ---------- 交叉引用校验 ----------
 * 线路数据里的节点 id 一旦改名，配图场景表、小游戏挂载表、真实图片清单
 * 都会静默失效（不会报错，只是配图退化成默认场景、小游戏不再出现）。
 * 曾经因为 r1-chishui 拆成 r1-chishui1..4、r4-cangxi 改名为 r4-jiadingjiang
 * 而漏改过三处，所以这里强制校验一遍。
 */
const allNodeIds = new Set()
for (const army of ARMIES) {
  for (const node of army.nodes) allNodeIds.add(node.id)
}

for (const id of Object.keys(ART_BY_NODE)) {
  if (!allNodeIds.has(id)) {
    fail(`[交叉引用] artwork.js 的 ART_BY_NODE 引用了不存在的节点：${id}`)
  }
}

for (const id of Object.keys(MINI_GAME_BY_NODE)) {
  if (!allNodeIds.has(id)) {
    fail(`[交叉引用] miniGames.js 的 MINI_GAME_BY_NODE 引用了不存在的节点：${id}`)
  }
}

try {
  const manifestUrl = new URL('../public/art/manifest.json', import.meta.url)
  const manifest = JSON.parse(readFileSync(manifestUrl, 'utf8'))
  for (const id of Object.keys(manifest.photos || {})) {
    if (!allNodeIds.has(id)) {
      warn(`[交叉引用] 配图清单 public/art/manifest.json 引用了不存在的节点：${id}`)
    }
  }
} catch (err) {
  warn(`[交叉引用] 无法读取配图清单：${err.message}`)
}

/* ---------- 输出 ---------- */

console.log('')
if (warnings.length) {
  console.log(`提示 ${warnings.length} 条：`)
  warnings.forEach((m) => console.log('  · ' + m))
  console.log('')
}

if (errors.length) {
  console.error(`数据自检未通过，发现 ${errors.length} 个问题：`)
  errors.forEach((m) => console.error('  ✗ ' + m))
  process.exit(1)
}

console.log('✓ 数据自检通过：结构、坐标、来源引用与需求专项校验均无问题。')
