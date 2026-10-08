/**
 * 真实图片通道
 *
 * 用途：让「大事件配图」可以用真实照片，而不是只能用 EventArtwork.vue 里的手绘插画。
 *
 * 与 artwork.js 分开成独立模块的原因：
 * 插画场景归属（artwork.js）是纯数据映射，本模块负责外部图片的加载与**准入判定**，
 * 两者职责不同，分开后互不影响。
 *
 * 图片清单文件：public/art/manifest.json
 * {
 *   "photos": {
 *     "r1-luding": {
 *       "file": "luding.jpg",
 *       "reviewed": true,               // ← 必须为 true 才会显示
 *       "title": "泸定桥（1935 年前后）",
 *       "source": "https://…",          // 原始出处页
 *       "license": "CC BY-SA 4.0",
 *       "author": "摄影者 / 机构"
 *     }
 *   }
 * }
 *
 * ⚠ 为什么必须有 reviewed 这道开关：
 * 脚本能自动下载图片，但**无法自动判断图片内容是否与史实表述相符**。
 * 未经人工看过的图片若直接以“历史照片”的名义展示，等同于伪造史料。
 * 因此只有显式标记 reviewed: true 的条目才会被渲染，其余一律回退到手绘插画。
 */

import { ref } from 'vue'

/** 已加载的图片清单 */
export const photoManifest = ref({})

let manifestLoaded = false

function resolvePath(relative) {
  try {
    return new URL(relative, document.baseURI).href
  } catch {
    return relative
  }
}

/** 载入图片清单（只请求一次；没有清单或请求失败时全部回退插画） */
export async function ensureArtworkManifest() {
  if (manifestLoaded) return
  manifestLoaded = true
  try {
    const res = await fetch(resolvePath('art/manifest.json'), { cache: 'no-cache' })
    if (!res.ok) return
    const data = await res.json()
    const photos = (data && data.photos) || data
    if (photos && typeof photos === 'object') photoManifest.value = photos
  } catch {
    /* 无清单属正常情况：全部使用插画 */
  }
}

/**
 * 取节点应显示的真实图片地址。
 * - 节点数据里显式写 `photo` 时直接采用（作者自行为该图片的准确性负责）；
 * - 否则查清单，且**只认 reviewed === true 的条目**；
 * - 都没有则返回空串，由调用方回退到手绘插画。
 */
export function photoFor(node) {
  if (!node) return ''
  if (node.photo) return resolvePath(node.photo)

  const entry = photoManifest.value[node.id]
  if (!entry) return ''

  const info = typeof entry === 'string' ? { file: entry, reviewed: false } : entry
  if (!info || !info.reviewed || !info.file) return ''
  return resolvePath(`art/${info.file}`)
}

/** 取图片的署名信息（界面上须标注出处；赛事对图片注记同样有要求） */
export function photoCreditFor(node) {
  if (!node) return null
  const entry = photoManifest.value[node.id]
  if (!entry || typeof entry === 'string') return null
  if (!entry.reviewed) return null
  return {
    title: entry.title || '',
    author: entry.author || '',
    license: entry.license || '',
    source: entry.source || ''
  }
}
