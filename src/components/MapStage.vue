<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue'
import * as echarts from 'echarts'
import { NODE_KINDS, startPoints } from '../data/armies.js'
import { createTerrainLayer, TERRAIN_SOURCE } from '../map/terrainLayer.js'

const props = defineProps({
  /** loadBaseMap() 的返回结果 */
  baseMap: { type: Object, required: true },
  /** 当前选中的部队；为 null 时进入“选择部队”视图 */
  army: { type: Object, default: null },
  /** 当前已“行进”到的节点数量 */
  revealCount: { type: Number, default: 0 },
  /** 当前选中的节点 id */
  selectedNodeId: { type: String, default: '' }
})

const emit = defineEmits(['select-start', 'select-node', 'ready'])
// 使用专用名称，避免 ECharts 对名为 china 的地图额外补绘南海小框。
const MAP_NAME = 'long-march-national-map'

const terrainCanvasEl = ref(null)
const terrainEnabled = ref(true)
const terrainReady = ref(false)
const terrainError = ref(false)
const terrainVisible = computed(() => terrainEnabled.value && terrainReady.value)
let terrainLayer = null
let unmounted = false
const canvasEl = ref(null)
const chart = shallowRef(null)

/** 选部队视图：四个起点标记（HTML 覆盖层） */
const pins = ref([])
/** 故事视图：全部历史节点标记（HTML 覆盖层） */
const nodePins = ref([])

const kindOf = (node) => NODE_KINDS[node.kind] || NODE_KINDS.march

/* ------------------------------------------------------------------ */
/* 地图数据与取景目标                                                  */
/* ------------------------------------------------------------------ */

/** 把补充要素（如南海诸岛）并入底图 */
function mergedGeoJSON() {
  const geo = props.baseMap.geo
  const sup = props.baseMap.supplement
  if (!sup || !Array.isArray(sup.features) || !sup.features.length) return geo
  return { type: 'FeatureCollection', features: [...geo.features, ...sup.features] }
}

/** 路线外接矩形（含留白） */
function routeBounds(nodes) {
  if (!nodes.length) return null
  let minLon = 180
  let maxLon = -180
  let minLat = 90
  let maxLat = -90
  for (const n of nodes) {
    const [lon, lat] = n.coord
    minLon = Math.min(minLon, lon)
    maxLon = Math.max(maxLon, lon)
    minLat = Math.min(minLat, lat)
    maxLat = Math.max(maxLat, lat)
  }
  const padLon = Math.max((maxLon - minLon) * 0.12, 0.8)
  const padLat = Math.max((maxLat - minLat) * 0.12, 0.8)
  return [
    [minLon - padLon, minLat - padLat],
    [maxLon + padLon, maxLat + padLat]
  ]
}

/** 选部队页面包含底图全部要素，南海诸岛不排除在默认视野外。 */
const HOME_BOUNDS = [
  [73, 3],
  [135.6, 54.1]
]

function targetBounds() {
  return props.army ? routeBounds(props.army.nodes) : HOME_BOUNDS
}

/* ------------------------------------------------------------------ */
/* 配置项                                                              */
/* ------------------------------------------------------------------ */

function mapAppearance() {
  return {
    itemStyle: {
      areaColor: terrainVisible.value ? 'rgba(29, 37, 31, 0.12)' : '#26332f',
      borderColor: terrainVisible.value ? 'rgba(229, 224, 203, 0.32)' : 'rgba(170, 185, 166, 0.45)',
      borderWidth: 0.8,
      shadowBlur: 0
    },
    emphasis: { itemStyle: { areaColor: terrainVisible.value ? 'rgba(231, 215, 176, 0.12)' : '#34453c' }, label: { show: false } },
    select: { itemStyle: { areaColor: terrainVisible.value ? 'rgba(231, 215, 176, 0.12)' : '#34453c' }, label: { show: false } }
  }
}

function applyTerrainMode() {
  const c = chart.value
  if (!c) return
  // 重绘样式时明确保留读者已调整的视角。
  const current = c.getOption().geo[0]
  c.setOption({ geo: { ...mapAppearance(), center: current.center, zoom: current.zoom } }, { lazyUpdate: false })
  scheduleOverlayRefresh()
}

function zoomMap(factor) {
  const c = chart.value
  if (!c) return
  const current = c.getOption().geo[0]
  const zoom = Math.max(0.8, Math.min(50, (current.zoom || 1) * factor))
  userRoamed = true
  c.setOption({ geo: { zoom, center: current.center } }, { lazyUpdate: false })
  scheduleOverlayRefresh()
}

function resetView() {
  userRoamed = false
  scheduleFrame()
}

function buildOption() {
  const army = props.army
  const revealed = army ? army.nodes.slice(0, Math.max(0, props.revealCount)) : []
  const routeCoords = revealed.map((n) => n.coord)

  const geo = {
    map: MAP_NAME,
    // 允许鼠标滚轮缩放与拖动（由 HTML 覆盖层负责标记，标记不会因此错位）
    roam: true,
    scaleLimit: { min: 0.8, max: 50 },
    ...mapAppearance(),
    label: { show: false },
    zlevel: 0
  }

  // 只保留一条行军路线。节点标记、名称标签全部交给 HTML 覆盖层绘制——
  // 覆盖层每次 georoam 都用 convertToPixel 重新换算位置，
  // 因此拖动、缩放时与地图严丝合缝，不存在 ECharts 图层之间的错位。
  const series = [
    {
      id: 'route',
      name: army ? `${army.name}行军路线` : '行军路线',
      type: 'lines',
      coordinateSystem: 'geo',
      polyline: true,
      silent: true,
      zlevel: 2,
      data: routeCoords.length >= 2 ? [{ coords: routeCoords }] : [],
      lineStyle: {
        color: army ? army.color : '#d92b3a',
        width: 3,
        opacity: 0.92,
        type: 'dashed',
        curveness: 0.12,
        shadowBlur: 4,
        shadowColor: '#111b13'
      },
      effect: {
        show: routeCoords.length >= 2,
        period: 5.5,
        trailLength: 0.24,
        symbol: 'arrow',
        symbolSize: 7,
        color: '#fff'
      },
      animationDuration: 0,
      animationDurationUpdate: 0,
      animationEasingUpdate: 'cubicOut'
    }
  ]

  return {
    backgroundColor: 'transparent',
    animation: true,
    animationDuration: 600,
    // ⚠ 增量更新动画必须为 0。
    // 地图拖动/缩放时 ECharts 会重算所有图元的像素位置，如果这时还有
    // 几百毫秒的更新动画，路线就会"从旧位置滑到新位置"，
    // 而底图是瞬间跟随的——看起来就是路线跟不上、和节点标记各走各的。
    // 设为 0 后所有图元立即跳到新位置，与底图严丝合缝。
    animationDurationUpdate: 0,
    animationEasing: 'cubicOut',
    animationEasingUpdate: 'linear',
    geo,
    series
  }
}

/* ------------------------------------------------------------------ */
/* 图表实例                                                            */
/* ------------------------------------------------------------------ */

function applyOption(notMerge) {
  const c = chart.value
  if (!c) return
  const option = buildOption()
  if (notMerge) {
    c.setOption(option, { notMerge: true, lazyUpdate: false })
  } else {
    // 增量更新（前进一站、切换选中节点）**只推 series**，不重推 geo。
    // 重推 geo 会触发坐标系重建，可能把读者手动缩放/拖动的视角冲掉——
    // 表现就是"走到下一站时地图自己跳回去了"。
    c.setOption({ series: option.series }, { lazyUpdate: false })
  }
  scheduleOverlayRefresh()
}

/**
 * 重建图表实例：dispose 后重新 init。
 * 这样上一次的取景、缩放、平移等内部状态会被彻底丢弃，
 * 切换部队时地图一定按新范围重新布局。
 */
function rebuildChart() {
  const el = canvasEl.value
  if (!el) return
  if (chart.value) {
    chart.value.dispose()
    chart.value = null
  }
  chart.value = echarts.init(el, null, { renderer: 'canvas' })
  // 读者一旦自己拖动/缩放过，就不再自动重设视角（窗口大小变化时也不重置），
  // 免得辛苦找到的视角被悄悄冲掉。
  userRoamed = false
  chart.value.on('georoam', () => {
    userRoamed = true
    scheduleOverlayRefresh()
  })
  applyOption(true)
  scheduleFrame()
}

/* ------------------------------------------------------------------ */
/* 取景：实测自校正 + 强制重排                                          */
/* ------------------------------------------------------------------ */

/**
 * 用「实测 → 反算」的方式取景：先摆正中心，再按实测跨度反算缩放。
 * 之所以不直接用 boundingCoords：它只决定缩放基准、决定不了视窗中心，
 * 实测会把视野甩到川藏、新疆一带。
 */
function frameTo(bounds) {
  const c = chart.value
  if (!c || !bounds) return
  const [[minLon, minLat], [maxLon, maxLat]] = bounds
  const center = [(minLon + maxLon) / 2, (minLat + maxLat) / 2]
  const wantLon = maxLon - minLon
  const wantLat = maxLat - minLat
  if (!(wantLon > 0) || !(wantLat > 0)) return

  c.setOption({ geo: { center } })

  const w = c.getWidth()
  const h = c.getHeight()
  const a = c.convertFromPixel({ geoIndex: 0 }, [0, 0])
  const b = c.convertFromPixel({ geoIndex: 0 }, [w, h])
  if (!a || !b || !Number.isFinite(a[0]) || !Number.isFinite(b[0])) return

  const curLon = Math.abs(b[0] - a[0])
  const curLat = Math.abs(a[1] - b[1])
  if (!(curLon > 0) || !(curLat > 0)) return

  const geoOption = c.getOption().geo && c.getOption().geo[0]
  const curZoom = (geoOption && geoOption.zoom) || 1
  const factor = Math.min(curLon / wantLon, curLat / wantLat)
  const nextZoom = Math.max(0.8, Math.min(50, curZoom * factor))
  if (Math.abs(nextZoom - curZoom) > 0.001) {
    c.setOption({ geo: { zoom: nextZoom, center } })
  }
}

let frameTimer = 0

/**
 * 延迟取景，并在取景后强制重新布局。
 * setOption 只把 center / zoom 写进模型，真正读取它们的是 resizeGeo（只在重排时执行），
 * 不强制重排就会"刚进去位置不对、动一下才跳正"。
 */
function scheduleFrame() {
  if (frameTimer) clearTimeout(frameTimer)
  frameTimer = setTimeout(() => {
    frameTimer = 0
    const c = chart.value
    if (!c) return
    frameTo(targetBounds())
    c.resize()
    frameTo(targetBounds())
    scheduleOverlayRefresh()
  }, 60)
}

/* ------------------------------------------------------------------ */
/* HTML 覆盖层：起点标记与节点标记                                      */
/* ------------------------------------------------------------------ */

/**
 * 把经纬度换算成像素位置，驱动 HTML 覆盖层。
 * 统一从 ECharts 的 convertToPixel 取位置，就能保证标记与地图严丝合缝：
 * 拖动、缩放时只需重算一次，不会出现两套坐标系统各画各的导致的错位。
 */
function refreshOverlays() {
  const c = chart.value
  if (!c) {
    pins.value = []
    nodePins.value = []
    return
  }

  if (!props.army) {
    // 选部队：四个起点
    nodePins.value = []
    const list = []
    for (const p of startPoints()) {
      const px = c.convertToPixel({ geoIndex: 0 }, p.coord)
      if (px && Number.isFinite(px[0]) && Number.isFinite(px[1])) {
        list.push({ ...p, x: px[0], y: px[1] })
      }
    }
    pins.value = list
    return
  }

  // 故事：全部历史节点
  pins.value = []
  const revealed = Math.max(0, props.revealCount)
  const list = []
  props.army.nodes.forEach((n, i) => {
    const px = c.convertToPixel({ geoIndex: 0 }, n.coord)
    if (!px || !Number.isFinite(px[0]) || !Number.isFinite(px[1])) return
    const kind = kindOf(n)
    list.push({
      id: n.id,
      node: n,
      x: px[0],
      y: px[1],
      color: kind.color,
      kindLabel: kind.label,
      reached: i < revealed,
      active: n.id === props.selectedNodeId
    })
  })
  nodePins.value = list
}

let overlayFrame = 0

/** 读者是否自己拖动/缩放过地图 */
let userRoamed = false

function scheduleOverlayRefresh() {
  if (overlayFrame) cancelAnimationFrame(overlayFrame)
  overlayFrame = requestAnimationFrame(() => {
    overlayFrame = 0
    terrainLayer?.draw(chart.value, terrainVisible.value)
    refreshOverlays()
  })
}

function handleResize() {
  chart.value && chart.value.resize()
  scheduleOverlayRefresh()
  // 只在读者还没自己调整过视角时重新取景；否则保留他当前看到的位置
  if (!userRoamed) scheduleFrame()
}

/* ------------------------------------------------------------------ */
/* 生命周期                                                            */
/* ------------------------------------------------------------------ */

onMounted(async () => {
  const geo = mergedGeoJSON()
  echarts.registerMap(MAP_NAME, geo)
  terrainLayer = createTerrainLayer(terrainCanvasEl.value, geo)
  terrainLayer.load().then(() => {
    if (!unmounted) terrainReady.value = true
  }).catch(() => {
    if (!unmounted) terrainError.value = true
  })
  rebuildChart()
  await nextTick()
  scheduleOverlayRefresh()
  window.addEventListener('resize', handleResize)
  emit('ready')
})

onBeforeUnmount(() => {
  unmounted = true
  terrainLayer?.dispose()
  window.removeEventListener('resize', handleResize)
  if (overlayFrame) cancelAnimationFrame(overlayFrame)
  if (frameTimer) clearTimeout(frameTimer)
  chart.value && chart.value.dispose()
  chart.value = null
})

watch([terrainEnabled, terrainReady], applyTerrainMode)

// 切换部队 / 视图：整体重建实例
watch(
  () => [props.army && props.army.id, props.baseMap],
  async () => {
    rebuildChart()
    await nextTick()
    scheduleOverlayRefresh()
  }
)

// 行进进度与选中态：增量更新路线，并刷新覆盖层的状态样式
watch(
  () => [props.revealCount, props.selectedNodeId],
  () => applyOption(false)
)
</script>

<template>
  <div class="map-stage">
    <canvas ref="terrainCanvasEl" class="map-stage__terrain" aria-hidden="true" />
    <div ref="canvasEl" class="map-stage__canvas" />
    <div class="map-tools" aria-label="地图显示与缩放">
      <div class="map-tools__modes" role="group" aria-label="底图样式">
        <button type="button" :aria-pressed="terrainEnabled" @click="terrainEnabled = true">地形</button>
        <button type="button" :aria-pressed="!terrainEnabled" @click="terrainEnabled = false">简图</button>
      </div>
      <div class="map-tools__zoom" role="group" aria-label="地图缩放">
        <button type="button" aria-label="放大地图" @click="zoomMap(1.4)">+</button>
        <button type="button" aria-label="缩小地图" @click="zoomMap(1 / 1.4)">−</button>
        <button type="button" @click="resetView">复位</button>
      </div>
    </div>
    <p class="terrain-credit">
      <a v-if="terrainVisible" :href="TERRAIN_SOURCE" target="_blank" rel="noopener noreferrer">地形晕渲 · Natural Earth</a>
      <span v-else-if="terrainEnabled && !terrainReady">{{ terrainError ? '地形加载失败，可切换简图' : '正在加载地形…' }}</span>
    </p>

    <!-- 选部队：起点标记。点击即选中该部队 -->
    <button
      v-for="pin in pins"
      :key="pin.id"
      class="map-pin"
      :style="{ left: `${pin.x}px`, top: `${pin.y}px`, '--pin-color': pin.color }"
      type="button"
      :title="`${pin.place} ${pin.name}`"
      @click="emit('select-start', pin.id)"
    >
      <span class="map-pin__dot" />
      <span class="map-pin__text">
        {{ pin.place }}
        <span class="map-pin__army">{{ pin.name }}</span>
      </span>
    </button>

    <!-- 故事：历史节点标记。全部由本组件换算像素位置，随地图同步移动 -->
    <button
      v-for="p in nodePins"
      :key="p.id"
      class="node-pin"
      :class="{ 'is-reached': p.reached, 'is-active': p.active }"
      :style="{ left: `${p.x}px`, top: `${p.y}px`, '--node-color': p.color }"
      type="button"
      :title="`${p.node.name}｜${p.node.place}｜${p.node.date}｜${p.kindLabel}`"
      @click="emit('select-node', p.node)"
    >
      <span class="node-pin__dot" />
      <span class="node-pin__label">{{ p.node.name }}</span>
    </button>

  </div>
</template>

<style scoped>
.map-stage { background: #171e1c; overflow: hidden; }
.map-stage__terrain { position: absolute; inset: 0; pointer-events: none; filter: brightness(.78) saturate(.62); }
.map-stage__canvas { position: relative; }
.map-tools { position: absolute; top: 12px; right: 12px; display: flex; flex-direction: column; align-items: end; gap: 8px; z-index: 9; }
.map-tools__modes, .map-tools__zoom { display: flex; border: 1px solid #8e997768; border-radius: 4px; overflow: hidden; background: #18221dec; }
.map-tools button { border: 0; border-right: 1px solid #8e997736; background: transparent; color: #d9dccb; padding: 7px 10px; font: inherit; font-size: 11px; cursor: pointer; }
.map-tools button:last-child { border-right: 0; }
.map-tools button:hover { background: #4b604452; }
.map-tools button[aria-pressed="true"] { color: #f0e6ca; background: #5c66505e; }
.map-tools__zoom button { min-width: 31px; }
.terrain-credit { position: absolute; bottom: 10px; left: 12px; z-index: 7; margin: 0; font-size: 10px; }
.terrain-credit a, .terrain-credit span { display: block; padding: 4px 7px; color: #ccd0bc; background: #17211ccc; border-radius: 3px; text-decoration: none; }
.terrain-credit a:hover { text-decoration: underline; }

/* ---------- 起点标记 ---------- */
/* ⚠ 锚点是**圆点**，不是整颗胶囊。
   这颗标记是"圆点 + 文字"的胶囊，若用 translate(-50%,-50%) 居中的是整颗胶囊，
   圆点位于胶囊左侧，就会被挤偏半个胶囊宽（文字越长偏得越多）。
   圆点中心距胶囊左边缘 = 边框 1px + 左内边距 4px + 圆点半径 9px = 14px，
   因此用 translate(-14px, -50%) 把"圆点中心"对到坐标上。 */
.map-pin {
  position: absolute;
  transform: translate(-14px, -50%);
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 4px 10px 4px 4px;
  border-radius: 999px;
  border: 1px solid var(--pin-color, #d92b3a);
  background: rgba(10, 5, 7, 0.82);
  color: #fff;
  font-family: inherit;
  font-size: 12.5px;
  white-space: nowrap;
  cursor: pointer;
  z-index: 6;
  backdrop-filter: blur(8px);
  transition: background 0.18s ease, transform 0.18s ease;
}

.map-pin:hover {
  background: rgba(24, 12, 16, 0.94);
  transform: translate(-14px, -50%) scale(1.05);
}

.map-pin__dot {
  width: 18px;
  height: 18px;
  border-radius: 999px;
  background: var(--pin-color, #d92b3a);
  box-shadow: 0 0 10px var(--pin-color, #d92b3a);
}

.map-pin__army {
  margin-left: 4px;
  font-size: 11px;
  color: var(--color-mist-500);
}

/* ---------- 历史节点标记 ---------- */
/* ⚠ 锚点是**圆点**，不是"圆点 + 标签"。
   做法：按钮做成固定 22×22 的锚点盒并居中于坐标，圆点用 grid 居中其中；
   名称标签改为**绝对定位**挂在盒子右侧，因此标签的显隐、长短都不再影响圆点位置。
   （此前标签与圆点同处一个 flex 盒，translate(-50%,-50%) 居中的是两者整体，
    标签一显示圆点就会被挤偏半个标签宽——这正是"点对不准"的原因。） */
.node-pin {
  position: absolute;
  transform: translate(-50%, -50%);
  display: grid;
  place-items: center;
  width: 22px;
  height: 22px;
  padding: 0;
  border: none;
  background: none;
  color: inherit;
  font-family: inherit;
  cursor: pointer;
  z-index: 5;
}

.node-pin__dot {
  width: 9px;
  height: 9px;
  border-radius: 999px;
  background: #0b0507;
  border: 1.5px solid var(--node-color, #9aa7b4);
  opacity: 0.5;
  transition: opacity 0.18s ease, transform 0.18s ease, box-shadow 0.18s ease;
}

.node-pin.is-reached .node-pin__dot {
  width: 12px;
  height: 12px;
  opacity: 1;
  background: var(--node-color, #9aa7b4);
  box-shadow: 0 0 9px var(--node-color, #9aa7b4);
}

.node-pin.is-active .node-pin__dot {
  width: 16px;
  height: 16px;
  box-shadow: 0 0 0 4px rgba(255, 255, 255, 0.14), 0 0 12px var(--node-color, #9aa7b4);
}

/* 名称标签：默认隐藏，悬停或选中时出现——避免地图被文字糊住。
   绝对定位挂在锚点右侧（left:50% + margin-left），与圆点位置解耦。 */
.node-pin__label {
  position: absolute;
  left: 50%;
  top: 50%;
  margin-left: 10px;
  transform: translateY(-50%);
  display: none;
  padding: 3px 7px;
  border-radius: 5px;
  font-size: 11.5px;
  line-height: 1.3;
  white-space: nowrap;
  color: #e8eef4;
  background: rgba(8, 4, 6, 0.86);
  border: 1px solid var(--panel-border);
  backdrop-filter: blur(6px);
}

.node-pin:hover .node-pin__label,
.node-pin.is-active .node-pin__label {
  display: block;
}

.node-pin.is-active .node-pin__label {
  color: #fff;
  border-color: var(--node-color, #9aa7b4);
}

</style>
