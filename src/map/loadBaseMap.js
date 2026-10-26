async function fetchJson(path, optional = false) {
  const response = await fetch(new URL(path, document.baseURI))
  if (!response.ok) {
    if (optional) return null
    throw new Error(`地图加载失败：${response.status}`)
  }
  return response.json()
}

export async function loadBaseMap() {
  const [geo, sources] = await Promise.all([
    fetchJson('map/china.json'),
    fetchJson('map/sources.json', true)
  ])
  if (!Array.isArray(geo.features) || !geo.features.length) throw new Error('地图数据为空')
  return { geo, sources }
}
