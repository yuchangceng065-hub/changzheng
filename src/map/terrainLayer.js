/** 地理配准的 Natural Earth 晕渲图层。与 ECharts 共用经纬度到像素的变换。 */
export const TERRAIN_BOUNDS = { west: 72, east: 137, south: 2, north: 56 }
export const TERRAIN_SOURCE = 'https://www.naturalearthdata.com/downloads/50m-raster-data/50m-natural-earth-2/'

/** 原始行政区划只用来裁切显示范围，不改写其坐标或边界。 */
function countryPath(geo) {
  const path = new Path2D()
  for (const feature of geo.features || []) {
    const geometry = feature.geometry
    const polygons = geometry?.type === 'Polygon' ? [geometry.coordinates]
      : geometry?.type === 'MultiPolygon' ? geometry.coordinates : []
    for (const polygon of polygons) for (const ring of polygon) {
      if (!ring.length) continue
      path.moveTo(ring[0][0], ring[0][1])
      for (let i = 1; i < ring.length; i++) path.lineTo(ring[i][0], ring[i][1])
      path.closePath()
    }
  }
  return path
}

export function terrainPlacement(chart) {
  const { west, east, south, north } = TERRAIN_BOUNDS
  const topLeft = chart.convertToPixel({ geoIndex: 0 }, [west, north])
  const bottomRight = chart.convertToPixel({ geoIndex: 0 }, [east, south])
  if (!topLeft || !bottomRight || ![...topLeft, ...bottomRight].every(Number.isFinite)) return null
  const width = bottomRight[0] - topLeft[0]
  const height = bottomRight[1] - topLeft[1]
  if (!(width > 0 && height > 0)) return null
  const scaleX = width / (east - west)
  const scaleY = -height / (north - south)
  return {
    left: topLeft[0], top: topLeft[1], width, height,
    matrix: { a: scaleX, b: 0, c: 0, d: scaleY, e: topLeft[0] - west * scaleX, f: topLeft[1] - north * scaleY }
  }
}

export function createTerrainLayer(canvas, geo) {
  const image = new Image()
  const mask = countryPath(geo)
  let disposed = false
  let loaded = false

  async function load() {
    image.src = new URL('map/terrain/china-relief.webp', document.baseURI).href
    await image.decode()
    if (!disposed) loaded = true
  }

  function draw(chart, visible) {
    if (disposed || !chart) return
    const ratio = Math.min(window.devicePixelRatio || 1, 2)
    const width = chart.getWidth()
    const height = chart.getHeight()
    const pixelWidth = Math.round(width * ratio)
    const pixelHeight = Math.round(height * ratio)
    if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
      canvas.width = pixelWidth
      canvas.height = pixelHeight
    }
    canvas.style.width = `${width}px`
    canvas.style.height = `${height}px`
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.clearRect(0, 0, pixelWidth, pixelHeight)
    if (!visible || !loaded) return
    const placement = terrainPlacement(chart)
    if (!placement) return
    const clip = new Path2D()
    clip.addPath(mask, placement.matrix)
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0)
    ctx.save()
    ctx.clip(clip, 'evenodd')
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(image, placement.left, placement.top, placement.width, placement.height)
    ctx.restore()
  }

  return { load, draw, dispose() { disposed = true; loaded = false } }
}
