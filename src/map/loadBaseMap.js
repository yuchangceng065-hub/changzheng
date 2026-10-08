/**
 * 底图加载与领土完整性自检
 *
 * 设计原则（对标赛事“无领土争议问题”要求）：
 * 1. 底图使用随作品分发的本地矢量行政区划数据（public/map/china.json），
 *    不使用来源不明的在线底图，也不做静默的在线回退。
 * 2. 加载后立刻自检法定表示要素，并**把“南海诸岛岛屿”与“九段线”分开判断**：
 *    二者是不同的表示内容，很多第三方底图只画了南海诸岛插图却缺少九段线线段，
 *    若把二者混为一谈，就会出现“自检显示合规、实际缺少九段线”的假阳性。
 * 3. 九段线在矢量数据里**通常不是 LineString，而是一组细长的多边形**，而且
 *    往往**没有 name**（DataV.GeoAtlas 用 `adcode = 100000_JD` 标识，JD 即“九段”）。
 *    因此判据必须同时覆盖：名称关键字、adcode 关键字、以及线状几何。
 *    只查名称会造成假阴性——把一份其实合格的底图判成不合格。
 * 4. 南海诸岛岛屿的判据：名称关键字，或**要素南端越过北纬 12°**（南海诸岛诸岛礁
 *    位于北纬 12° 以南，行政区划上隶属海南省，因此体现在海南要素的南端）。
 *    注意范围框必须收紧，否则会把广东、台湾、香港、澳门等沿海要素误捞进来。
 * 5. 即使客观检测项齐全，**九段线是否完整、未被裁切仍需人工目视确认**；
 *    本模块只报告“检测到什么、依据是什么”，不臆断为合规。
 * 6. 底图来源与口径在 public/map/sources.json 中声明，并在界面“资料来源”中展示。
 */

const MAP_FILE = 'map/china.json'
const NANHAI_FILE = 'map/nanhai.json'
const SOURCES_FILE = 'map/sources.json'

/** 南海诸岛相关关键字 */
const NANHAI_KEYWORDS = ['南海诸岛', '南海諸島', '南沙', '西沙', '中沙']
/** 九段线名称关键字 */
const DASH_KEYWORDS = ['九段线', '九段線']
/** 九段线的 adcode 约定：DataV.GeoAtlas 使用 100000_JD（JD = 九段） */
const DASH_ADCODE = /_JD$/i
/** 台湾省相关关键字 */
const TAIWAN_KEYWORDS = ['台湾', '臺灣']
/** 海南省相关关键字 */
const HAINAN_KEYWORDS = ['海南']

/** 线状几何类型 */
const LINE_GEOM = /LineString|MultiLineString/

/** 南海诸岛岛屿所在区域的收紧范围框（避免误捞沿海省份） */
export const SCS_BOX = { minLon: 105, maxLon: 125, minLat: 2, maxLat: 24 }
/** 南海诸岛岛礁位于北纬 12° 以南 */
const SCS_ISLAND_MAX_LAT = 12

function resolve(relative) {
  try {
    return new URL(relative, document.baseURI).href
  } catch {
    return relative
  }
}

async function fetchJson(relative) {
  const url = resolve(relative)
  const res = await fetch(url, { cache: 'no-cache' })
  if (!res.ok) {
    const err = new Error(`${relative} 请求失败（HTTP ${res.status}）`)
    err.url = url
    throw err
  }
  const text = await res.text()
  try {
    return { data: JSON.parse(text), url }
  } catch (e) {
    const err = new Error(`${relative} 不是合法的 JSON：${e.message}`)
    err.url = url
    throw err
  }
}

/** 计算几何体外接矩形 [minLon, minLat, maxLon, maxLat]，无有效坐标时返回 null */
export function bboxOf(geometry) {
  let minLon = 180
  let maxLon = -180
  let minLat = 90
  let maxLat = -90
  const walk = (coords) => {
    if (!Array.isArray(coords)) return
    if (typeof coords[0] === 'number') {
      const lon = coords[0]
      const lat = coords[1]
      if (lon < minLon) minLon = lon
      if (lon > maxLon) maxLon = lon
      if (lat < minLat) minLat = lat
      if (lat > maxLat) maxLat = lat
      return
    }
    for (const c of coords) walk(c)
  }
  if (geometry && geometry.coordinates) walk(geometry.coordinates)
  if (minLon > maxLon) return null
  return [minLon, minLat, maxLon, maxLat]
}

/** 外接矩形是否完全落在收紧后的南海范围内 */
export function inSouthChinaSea(bbox) {
  if (!bbox) return false
  const [minLon, minLat, maxLon, maxLat] = bbox
  return (
    minLon >= SCS_BOX.minLon &&
    maxLon <= SCS_BOX.maxLon &&
    minLat >= SCS_BOX.minLat &&
    maxLat <= SCS_BOX.maxLat
  )
}

/** 该要素是否可能是南海诸岛岛礁：名称命中，或南端越过北纬 12° 且位于南海范围 */
function looksLikeNanhaiIslands(name, bbox) {
  if (NANHAI_KEYWORDS.some((k) => name.includes(k))) return true
  if (!bbox) return false
  const [minLon, minLat, maxLon, maxLat] = bbox
  const inside =
    minLon >= SCS_BOX.minLon && maxLon <= SCS_BOX.maxLon && maxLat <= SCS_BOX.maxLat
  return inside && minLat <= SCS_ISLAND_MAX_LAT
}

/**
 * 领土表示自检
 * @param {object} geo GeoJSON FeatureCollection
 */
export function analyzeIntegrity(geo) {
  const features = (geo && geo.features) || []

  const named = features.map((f) => {
    const props = (f && f.properties) || {}
    return {
      name: props.name || props.NAME || '',
      adcode: String(props.adcode || props.ADCODE || ''),
      type: (f && f.geometry && f.geometry.type) || '',
      bbox: bboxOf(f && f.geometry)
    }
  })

  const names = named.map((n) => n.name).filter(Boolean)
  const has = (keywords) => names.some((n) => keywords.some((k) => n.includes(k)))

  /* ---- 南海诸岛岛屿 ---- */
  const nanhaiFeatures = named.filter((n) => looksLikeNanhaiIslands(n.name, n.bbox))

  /* ---- 九段线：名称 / adcode / 线状几何，三选一即可确认 ---- */
  const dashByName = named.filter((n) => DASH_KEYWORDS.some((k) => n.name.includes(k)))
  const dashByAdcode = named.filter((n) => DASH_ADCODE.test(n.adcode))
  const lineFeatures = named.filter((n) => LINE_GEOM.test(n.type))

  let dashEvidence = ''
  if (dashByAdcode.length) {
    dashEvidence = `按 adcode 识别（${dashByAdcode.map((n) => n.adcode).join('、')}）`
  } else if (dashByName.length) {
    dashEvidence = `按名称识别（${dashByName.map((n) => n.name).join('、')}）`
  } else if (lineFeatures.length) {
    dashEvidence = `按线状几何识别（${lineFeatures.length} 个线状要素）`
  }

  const dashConfirmed = Boolean(dashEvidence)

  return {
    featureCount: features.length,
    provinceCount: names.length,
    hasTaiwan: has(TAIWAN_KEYWORDS),
    hasHainan: has(HAINAN_KEYWORDS),
    /** 是否存在南海诸岛岛屿要素 */
    hasNanhaiFeature: nanhaiFeatures.length > 0,
    nanhaiFeatureNames: nanhaiFeatures.map((n) => n.name || `<无名称 adcode=${n.adcode}>`),
    /** 九段线是否可被客观确认 */
    dashConfirmed,
    /** 确认依据的说明，便于人工复核 */
    dashEvidence,
    dashAdcodes: dashByAdcode.map((n) => n.adcode),
    /** 是否存在线状几何 */
    hasLineGeometry: lineFeatures.length > 0,
    /** 无法自动确认时，要求人工目视核对 */
    needsManualDashCheck: !dashConfirmed,
    supplementUsed: false,
    matchedNames: named
      .filter(
        (n) =>
          [...NANHAI_KEYWORDS, ...DASH_KEYWORDS, ...TAIWAN_KEYWORDS, ...HAINAN_KEYWORDS].some(
            (k) => n.name.includes(k)
          ) || DASH_ADCODE.test(n.adcode)
      )
      .map((n) => n.name || `<无名称 adcode=${n.adcode}>`)
  }
}

/**
 * 加载底图
 * @returns {Promise<{geo:object, supplement:object|null, integrity:object, sources:object|null, url:string}>}
 */
export async function loadBaseMap() {
  const { data: geo, url } = await fetchJson(MAP_FILE)
  if (!geo || !Array.isArray(geo.features) || geo.features.length === 0) {
    const err = new Error('底图文件结构异常：缺少 features 数组')
    err.url = url
    throw err
  }

  let integrity = analyzeIntegrity(geo)

  // 缺少南海诸岛岛屿要素时，尝试加载补充要素；仍缺失则保留告警标记交由界面明示
  let supplement = null
  if (!integrity.hasNanhaiFeature) {
    try {
      const { data } = await fetchJson(NANHAI_FILE)
      if (data && Array.isArray(data.features) && data.features.length) {
        supplement = data
        integrity = {
          ...analyzeIntegrity({ features: [...geo.features, ...data.features] }),
          supplementUsed: true
        }
      }
    } catch {
      integrity.supplementUsed = false
    }
  }

  let sources = null
  try {
    const { data } = await fetchJson(SOURCES_FILE)
    sources = data
  } catch {
    sources = null
  }

  return { geo, supplement, integrity, sources, url }
}

export const MAP_PATHS = { MAP_FILE, NANHAI_FILE, SOURCES_FILE }
