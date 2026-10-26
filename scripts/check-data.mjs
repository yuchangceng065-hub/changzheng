import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import { ARMIES, NODE_KINDS } from '../src/data/armies.js'
import { SOURCES } from '../src/data/sources.js'
import { buildGalleryItems } from '../src/data/gallery.js'

const sourceIds = new Set(SOURCES.map(source => source.id))
const ids = new Set()
for (const army of ARMIES) {
  for (const id of army.sources) assert(sourceIds.has(id), `来源不存在：${id}`)
  for (const node of army.nodes) {
    assert(!ids.has(node.id), `节点重复：${node.id}`)
    ids.add(node.id)
    for (const field of ['name', 'place', 'date', 'brief', 'detail']) assert(node[field], `${node.id} 缺少 ${field}`)
    assert(NODE_KINDS[node.kind], `未知节点类型：${node.id}`)
    assert(Array.isArray(node.coord) && node.coord.length === 2 && node.coord.every(Number.isFinite), `坐标格式错误：${node.id}`)
    assert(node.coord[0] >= 97 && node.coord[0] <= 117 && node.coord[1] >= 24 && node.coord[1] <= 38, `坐标超出行军区域：${node.id}`)
  }
}
const { photos } = JSON.parse(readFileSync(new URL('../public/art/manifest.json', import.meta.url)))
const forNode = node => photos[node.id]?.images.map(photo => ({ ...photo, url: photo.file })) || []
for (const [id, entry] of Object.entries(photos)) {
  assert(ids.has(id), `配图关联的节点不存在：${id}`)
  for (const photo of entry.images) {
    assert(existsSync(new URL(`../public/art/${photo.file}`, import.meta.url)), `图片不存在：${photo.file}`)
    assert(!/用户提供|文档配图|文档选编|配图取自/.test(JSON.stringify(photo)), `图注未清理：${id}`)
    assert(!/来源[：:]/.test(photo.title), `图名与来源未分开：${id}`)
  }
}
const gallery = buildGalleryItems(ARMIES, forNode)
console.log(`${ARMIES.length} 支部队，${ids.size} 个节点，${gallery.length} 幅不同图片；数据结构与资源引用检查通过。`)
