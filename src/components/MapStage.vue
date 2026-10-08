<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue'
import * as echarts from 'echarts'
import { NODE_KINDS, startPoints } from '../data/armies.js'

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
  const padLon = Math.max((maxLon - minLon) * 0.18, 1.5)
  const padLat = Math.max((maxLat - minLat) * 0.2, 1.5)
  return [
    [minLon - padLon, minLat - padLat],
    [maxLon + padLon, maxLat + padLat]
  ]
}

/** 选部队页面：只框到大陆 + 台湾 + 海南岛 */
const HOME_BOUNDS = [
  [73, 17.5],
  [136, 54.5]
]

/** 故事页面：以武汉一带为中心的「汉地十八省 + 四川」 */
const JOURNEY_BOUNDS = [
  [98, 20],
  [126, 44]
]

/** 取两个取景框的并集，保证路线完整落在框内 */
function unionBounds(a, b) {
  if (!a) return b
  if (!b) return a
  return [
    [Math.min(a[0][0], b[0][0]), Math.min(a[0][1], b[0][1])],
    [Math.max(a[1][0], b[1][0]), Math.max(a[1][1], b[1][1])]
  ]
}

/** 当前视图的目标取景框 */
function targetBounds() {
  if (props.army) return unionBounds(JOURNEY_BOUNDS, routeBounds(props.army.nodes))
  return HOME_BOUNDS
}

/* ------------------------------------------------------------------ */
/* 配置项                                                              */
/* ------------------------------------------------------------------ */

function buildOption() {
  const army = props.army
  const revealed = army ? army.nodes.slice(0, Math.max(0, props.revealCount)) : []
  const routeCoords = revealed.map((n) => n.coord)

  const geo = {
    map: 'china',
    // 允许鼠标滚轮缩放与拖动（由 HTML 覆盖层负责标记，标记不会因此错位）
    roam: true,
    scaleLimit: { min: 0.8, max: 50 },
    itemStyle: {
      areaColor: '#152230',
      borderColor: 'rgba(150, 182, 208, 0.45)',
      borderWidth: 0.9,
      shadowColor: 'rgba(74, 157, 229, 0.22)',
      shadowBlur: 26
    },
    emphasis: { itemStyle: { areaColor: '#1d2f40' }, label: { show: false } },
    select: { itemStyle: { areaColor: '#1d2f40' }, label: { show: false } },
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
        shadowBlur: 14,
        shadowColor: army ? army.color : '#d92b3a'
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
  updateDebugInfo()
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
    refreshOverlays()
  })
}

function handleResize() {
  chart.value && chart.value.resize()
  scheduleOverlayRefresh()
  updateDebugInfo()
  // 只在读者还没自己调整过视角时重新取景；否则保留他当前看到的位置
  if (!userRoamed) scheduleFrame()
}

/* ------------------------------------------------------------------ */
/* 取景自检读数（?debug）                                               */
/* ------------------------------------------------------------------ */

const SHOW_DEBUG = (() => {
  try {
    return new URLSearchParams(window.location.search).has('debug')
  } catch {
    return false
  }
})()

const debugInfo = ref('')

function updateDebugInfo() {
  if (!SHOW_DEBUG) return
  const c = chart.value
  if (!c) return
  const w = c.getWidth()
  const h = c.getHeight()
  const tl = c.convertFromPixel({ geoIndex: 0 }, [0, 0])
  const br = c.convertFromPixel({ geoIndex: 0 }, [w, h])
  if (!tl || !br || !Number.isFinite(tl[0]) || !Number.isFinite(br[0])) {
    debugInfo.value = '视野：读取失败'
    return
  }
  const target = props.army ? '故事（汉地十八省）' : '选部队（大陆+台湾+海南）'
  debugInfo.value =
    `取景目标 ${target}｜实际视野 ` +
    `${br[0].toFixed(1)}–${tl[0].toFixed(1)}°E / ` +
    `${br[1].toFixed(1)}–${tl[1].toFixed(1)}°N｜画布 ${w}×${h}`
}

/* ------------------------------------------------------------------ */
/* 生命周期                                                            */
/* ------------------------------------------------------------------ */

onMounted(async () => {
  echarts.registerMap('china', mergedGeoJSON())
  rebuildChart()
  await nextTick()
  scheduleOverlayRefresh()
  window.addEventListener('resize', handleResize)
  emit('ready')
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  if (overlayFrame) cancelAnimationFrame(overlayFrame)
  if (frameTimer) clearTimeout(frameTimer)
  chart.value && chart.value.dispose()
  chart.value = null
})

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
    <div ref="canvasEl" class="map-stage__canvas" />

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

    <!-- 取景自检读数：仅在 URL 带 ?debug 时出现 -->
    <p v-if="SHOW_DEBUG && debugInfo" class="map-debug">{{ debugInfo }}</p>
  </div>
</template>

<style scoped>
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

/* ---------- 取景自检读数（?debug） ---------- */
.map-debug {
  position: absolute;
  left: 8px;
  top: 8px;
  z-index: 8;
  margin: 0;
  padding: 4px 8px;
  border-radius: 6px;
  font-family: ui-monospace, Menlo, Consolas, monospace;
  font-size: 10.5px;
  line-height: 1.45;
  color: #ffe6a8;
  background: rgba(8, 4, 6, 0.88);
  border: 1px solid rgba(212, 175, 55, 0.5);
}
</style>
