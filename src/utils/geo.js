/**
 * 地理距离工具
 *
 * 口径说明：本作品界面中出现的“沿途累计直线距离”，是按节点经纬度用半正矢公式
 * （Haversine）测算的球面直线距离累加值，用于直观表达行程跨度。
 * 它不等于、且明显小于红军实际行军里程（实际路线弯曲、往返、迂回）。
 */

const EARTH_RADIUS_KM = 6371.0088

const toRad = (deg) => (deg * Math.PI) / 180

/** 两点间大圆距离（公里） */
export function haversineKm(a, b) {
  if (!a || !b) return 0
  const [lon1, lat1] = a
  const [lon2, lat2] = b
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const lat1r = toRad(lat1)
  const lat2r = toRad(lat2)
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1r) * Math.cos(lat2r) * Math.sin(dLon / 2) ** 2
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)))
}

/**
 * 计算沿线累计直线距离
 * @param {Array<{coord:[number,number]}>} nodes
 * @returns {{legs:number[], cumulative:number[], total:number}} 单位：公里
 */
export function cumulativeDistances(nodes) {
  const legs = []
  const cumulative = []
  let total = 0
  for (let i = 0; i < nodes.length; i += 1) {
    if (i === 0) {
      legs.push(0)
    } else {
      const d = haversineKm(nodes[i - 1].coord, nodes[i].coord)
      legs.push(d)
      total += d
    }
    cumulative.push(total)
  }
  return { legs, cumulative, total }
}

/** 公里数格式化：<10 保留 1 位，其余取整 */
export function formatKm(km) {
  if (!Number.isFinite(km)) return '—'
  if (km < 10) return km.toFixed(1)
  return String(Math.round(km))
}

/** 经纬度格式化 */
export function formatCoord(coord) {
  if (!Array.isArray(coord) || coord.length < 2) return '—'
  const [lon, lat] = coord
  const ns = lat >= 0 ? 'N' : 'S'
  const ew = lon >= 0 ? 'E' : 'W'
  return `${Math.abs(lon).toFixed(2)}°${ew} ${Math.abs(lat).toFixed(2)}°${ns}`
}
