<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import MapStage from './components/MapStage.vue'
import ArmySelectPanel from './components/ArmySelectPanel.vue'
import NodeDetailCard from './components/NodeDetailCard.vue'
import NodeRail from './components/NodeRail.vue'
import GanziFactModal from './components/GanziFactModal.vue'
import SourcesDrawer from './components/SourcesDrawer.vue'
import NavBar from './components/NavBar.vue'
import HomeView from './views/HomeView.vue'
import ArmiesView from './views/ArmiesView.vue'
import GalleryView from './views/GalleryView.vue'
import SpiritView from './views/SpiritView.vue'
import { ARMIES, getArmy } from './data/armies.js'
import { loadBaseMap, MAP_PATHS } from './map/loadBaseMap.js'
import { cumulativeDistances, formatKm } from './utils/geo.js'

/* ---------------- 状态 ---------------- */
const baseMap = ref(null)
const loading = ref(true)
const loadError = ref(null)

const selectedArmyId = ref('')
const revealCount = ref(0)
const selectedNodeId = ref('')
const playing = ref(false)

const ganziShown = ref(false)
const showGanzi = ref(false)
const showSources = ref(false)
/** 当前页面：home | armies | journey | gallery | spirit */
const view = ref('home')

/* ---------------- 派生 ---------------- */
const currentArmy = computed(() => (selectedArmyId.value ? getArmy(selectedArmyId.value) : null))

const selectedIndex = computed(() => {
  if (!currentArmy.value || !selectedNodeId.value) return -1
  return currentArmy.value.nodes.findIndex((n) => n.id === selectedNodeId.value)
})

const currentNode = computed(() => {
  if (!currentArmy.value || selectedIndex.value < 0) return null
  return currentArmy.value.nodes[selectedIndex.value]
})

/** 底图领土表示合规状态：把“南海诸岛插图”与“九段线”分开判断，避免假阳性 */
const mapCompliance = computed(() => {
  const it = baseMap.value && baseMap.value.integrity
  if (!it) return null
  if (!it.hasNanhaiFeature) {
    return {
      level: 'danger',
      text: '底图未检测到“南海诸岛”插图要素，领土表示不完整，不得用于展示或参赛。请更换为符合自然资源部标准地图要求的底图。'
    }
  }
  if (it.needsManualDashCheck) {
    return {
      level: 'warn',
      text: '底图未检测到线状几何，九段线无法由数据自动确认。请按「资料来源」中的指引，在地图上放大南海方向目视核对九段线是否完整。'
    }
  }
  return null
})

const progress = computed(() => {
  if (!currentArmy.value) return null
  const total = currentArmy.value.nodes.length
  const { cumulative } = cumulativeDistances(currentArmy.value.nodes)
  const totalKm = cumulative[total - 1] || 0
  const doneKm = cumulative[Math.max(0, revealCount.value - 1)] || 0
  return {
    total,
    done: revealCount.value,
    percent: total ? Math.round((revealCount.value / total) * 100) : 0,
    totalKm: formatKm(totalKm),
    doneKm: formatKm(doneKm)
  }
})

/* ---------------- 底图加载 ---------------- */
onMounted(async () => {
  try {
    baseMap.value = await loadBaseMap()
  } catch (e) {
    loadError.value = {
      message: e && e.message ? e.message : String(e),
      url: (e && e.url) || ''
    }
  } finally {
    loading.value = false
  }
  window.addEventListener('keydown', onGlobalKeydown)
})

onBeforeUnmount(() => {
  stopTimer()
  window.removeEventListener('keydown', onGlobalKeydown)
})

/* ---------------- 行进推进 ---------------- */
let timer = 0

/**
 * 播放速度预设。默认「慢」——每一站要留出时间看清事件卡片与配图，
 * 原来的 1.25 秒/站太快，来不及读。
 */
const SPEEDS = [
  { id: 'slow', label: '慢', ms: 3200 },
  { id: 'normal', label: '中', ms: 2100 },
  { id: 'fast', label: '快', ms: 1200 }
]
const speedId = ref('slow')
const stepMs = computed(() => {
  const found = SPEEDS.find((s) => s.id === speedId.value)
  return found ? found.ms : SPEEDS[0].ms
})

function stopTimer() {
  if (timer) {
    clearInterval(timer)
    timer = 0
  }
  playing.value = false
}

function reachNode(node) {
  if (!node) return
  selectedNodeId.value = node.id
  if (node.special && !ganziShown.value) {
    ganziShown.value = true
    showGanzi.value = true
    stopTimer()
  }
}

/**
 * 当前推进位置（0 基）。
 * 优先取"正在查看的节点"；事件卡收起时退回"最远到过的那一站"。
 * 所有前进/后退/可否继续的判断都统一以它为准，避免混用 revealCount 造成状态打架。
 */
const playPos = computed(() => {
  if (selectedIndex.value >= 0) return selectedIndex.value
  return Math.max(0, revealCount.value - 1)
})

/**
 * 前进一站。
 *
 * ⚠ 必须以「当前所在的站」(playPos) 为准，不能用「揭示进度」判断。
 * 曾经用 revealCount 判断是否到终点，结果：跑完全程后按「上一站」回退，
 * revealCount 仍是最大值 → 前进按钮被锁死，「继续」也无法重新播放。
 * revealCount 只表示"最远到过哪一站"，回退不应被当成"已在终点"。
 */
function advance() {
  const army = currentArmy.value
  if (!army) return
  const next = playPos.value + 1
  if (next < 0 || next >= army.nodes.length) {
    stopTimer()
    return
  }
  const node = army.nodes[next]
  // 目标站还没揭示过时才推进揭示进度；回退后重走只移动选中位置
  if (next + 1 > revealCount.value) revealCount.value = next + 1
  reachNode(node)
  if (next >= army.nodes.length - 1) stopTimer()
}

function startTimer() {
  stopTimer()
  const army = currentArmy.value
  if (!army) return
  // 同样按「当前所在的站」判断，回退后才能重新继续播放
  if (playPos.value >= army.nodes.length - 1) return
  playing.value = true
  timer = setInterval(advance, stepMs.value)
}

function togglePlay() {
  if (playing.value) stopTimer()
  else startTimer()
}

// 播放中切换速度立即生效，不必先暂停
watch(speedId, () => {
  if (playing.value) startTimer()
})

/* ---------------- 交互 ---------------- */
function selectArmy(id) {
  const army = getArmy(id)
  if (!army) return
  selectedArmyId.value = id
  revealCount.value = 1
  selectedNodeId.value = army.nodes[0].id
  ganziShown.value = false
  showGanzi.value = false
  // 进入部队故事时**默认暂停**，停在出发地等读者自己按「继续」。
  // 一进来就自动开走会让人来不及看清起点与部队概况。
  stopTimer()
}

function backToSelect() {
  stopTimer()
  selectedArmyId.value = ''
  selectedNodeId.value = ''
  revealCount.value = 0
  showGanzi.value = false
  ganziShown.value = false
}

function onSelectNode(node) {
  const army = currentArmy.value
  if (!army) return
  const index = army.nodes.findIndex((n) => n.id === node.id)
  if (index < 0) return
  if (index + 1 > revealCount.value) revealCount.value = index + 1
  reachNode(node)
}

function step(delta) {
  const army = currentArmy.value
  if (!army) return
  // 手动后退时先暂停自动播放，否则定时器会立刻把人推回前进方向，等于退不动
  if (delta < 0) stopTimer()
  const next = playPos.value + delta
  if (next < 0 || next >= army.nodes.length) return
  onSelectNode(army.nodes[next])
}

function jumpTo(index) {
  const army = currentArmy.value
  if (!army) return
  const clamped = Math.min(army.nodes.length, Math.max(1, index))
  revealCount.value = clamped
  const node = army.nodes[clamped - 1]
  reachNode(node)
  if (clamped >= army.nodes.length) stopTimer()
}

function resetReveal() {
  stopTimer()
  const army = currentArmy.value
  if (!army) return
  revealCount.value = 1
  selectedNodeId.value = army.nodes[0].id
  ganziShown.value = false
  showGanzi.value = false
}

/** 收起事件卡后，回到“当前已行进到”的那一站 */
function returnToCurrent() {
  const army = currentArmy.value
  if (!army) return
  const index = Math.min(army.nodes.length, Math.max(1, revealCount.value)) - 1
  const node = army.nodes[index]
  if (node) selectedNodeId.value = node.id
}

/** 切换页面。离开深度交互页时停掉自动播放，避免在别的页面里空跑定时器 */
function navigate(next) {
  if (next !== 'journey') stopTimer()
  view.value = next
}

/** 从「部队介绍」页直接进入某支部队的地图 */
function enterArmyFromIntro(id) {
  selectArmy(id)
  view.value = 'journey'
}

/** 点击地图上的起点标记：直接选中该部队并进入故事 */
function onStartPinArmy(id) {
  selectArmy(id)
}

function onGlobalKeydown(e) {
  if (e.key !== 'Escape') return
  if (showGanzi.value) {
    showGanzi.value = false
    return
  }
  if (showSources.value) showSources.value = false
}
</script>

<template>
  <div class="app-shell">
    <!-- ================= 顶部导航 ================= -->
    <NavBar :view="view" @change="navigate" @open-sources="showSources = true" />

    <!-- ================= 非地图页面 ================= -->
    <HomeView v-if="view === 'home'" @navigate="navigate" />
    <ArmiesView v-else-if="view === 'armies'" @enter-army="enterArmyFromIntro" />
    <GalleryView v-else-if="view === 'gallery'" />
    <SpiritView v-else-if="view === 'spirit'" />

    <!-- 底图领土表示告警：仅在深度交互（地图）页显示，缺失法定要素时明确提示，绝不静默 -->
    <div
      v-if="view === 'journey' && !loading && !loadError && mapCompliance"
      class="compliance-strip"
      :class="`compliance-strip--${mapCompliance.level}`"
    >
      <span class="compliance-strip__text">{{ mapCompliance.text }}</span>
      <button class="map-notice__link" type="button" @click="showSources = true">
        查看资料来源 →
      </button>
    </div>

    <!-- ================= 深度交互：加载 / 错误 / 地图 ================= -->
    <template v-if="view === 'journey'">
    <main v-if="loading" class="app-state">
      <div class="panel px-6 py-6 text-center">
        <p class="lede">正在加载地图底图与史实数据…</p>
      </div>
    </main>

    <main v-else-if="loadError" class="app-state">
      <div class="panel panel--solid px-6 py-6 max-w-[720px]">
        <p class="panel-title mb-2">底图加载失败</p>
        <h2 class="serif text-xl font-bold">缺少地图底图数据文件</h2>
        <p class="prose-cn mt-3">
          本作品不复用来源不明的在线底图，也不做静默回退，以保证地图领土表示的严谨性。请将符合自然资源部标准地图要求的中国矢量底图放置到：
        </p>
        <pre class="code-block">public/{{ MAP_PATHS.MAP_FILE }}</pre>
        <p class="prose-cn mt-2">
          如需在底图之外补充“南海诸岛 / 九段线”等法定表示要素，可另放
          <code>public/{{ MAP_PATHS.NANHAI_FILE }}</code>；底图来源声明请写入
          <code>public/{{ MAP_PATHS.SOURCES_FILE }}</code>。
        </p>
        <p class="callout callout--danger mt-4">
          错误信息：{{ loadError.message }}
          <br v-if="loadError.url" />
          <span v-if="loadError.url">请求地址：{{ loadError.url }}</span>
        </p>
        <p class="text-dim mt-3 text-[12.5px]">
          放置文件后刷新页面即可。若需替换为官方标准地图，请访问自然资源部标准地图服务网站
          （bzdt.ch.mnr.gov.cn）获取带审图号的底图，并同步更新来源声明。
        </p>
      </div>
    </main>

    <!-- ================= 主体 ================= -->
    <main
      v-else
      class="app-main"
      :class="currentArmy ? 'app-main--journey' : 'app-main--select'"
    >
      <!-- 地图列 -->
      <section class="col-map panel overflow-hidden">
        <MapStage
          :base-map="baseMap"
          :army="currentArmy"
          :reveal-count="revealCount"
          :selected-node-id="selectedNodeId"
          @select-start="onStartPinArmy"
          @select-node="onSelectNode"
        />

        <!-- 点击地图上的起点标记 = 直接选中该部队进入故事。
             需求文档原本要求"点击起点图标弹出选择卡片"，此处按作者要求改为直接进入；
             「选择卡片」的职责由左侧的选部队浮窗承担。 -->

        <!-- 底图声明条：仅在选择模式（地图铺满）时显示；故事模式地图很窄，改到故事列底部 -->
        <p v-if="!currentArmy" class="map-notice">
          底图：中国矢量行政区划数据，<b>未修改任何边界</b>，含南海诸岛、九段线。
          <button class="map-notice__link" type="button" @click="showSources = true">
            依据 →
          </button>
        </p>
      </section>

      <!-- 侧栏 -->
      <aside class="col-side">
        <!-- 未选择部队：选部队浮窗。点开某个起点卡片时暂时隐藏，避免两块浮层重叠 -->
        <ArmySelectPanel
          v-if="!currentArmy"
          :armies="ARMIES"
          :active-id="selectedArmyId"
          @select="selectArmy"
        />

        <!-- 已选择部队：状态栏 + 节点时间线 + 详情 -->
        <template v-else>
          <section class="panel status">
            <div class="status__head">
              <h2 class="serif status__name">{{ currentArmy.name }}</h2>
              <span class="status__alias">{{ currentArmy.alias }}</span>
              <button class="status__back" type="button" @click="backToSelect">
                重新选择部队
              </button>
            </div>

            <p class="status__line">
              {{ currentArmy.startDate }} — {{ currentArmy.endDate }} ·
              {{ currentArmy.duration }} · {{ currentArmy.totalDistance }}
            </p>
            <p class="status__line status__line--dim">{{ currentArmy.strength }}</p>

            <div v-if="progress" class="progress progress--tight">
              <div class="progress__bar">
                <span class="progress__fill" :style="{ width: `${progress.percent}%` }" />
              </div>
              <div class="progress__meta">
                <span>已行进 {{ progress.done }} / {{ progress.total }} 站</span>
                <span>沿线直线约 {{ progress.doneKm }} / {{ progress.totalKm }} 公里</span>
              </div>
            </div>

            <div class="status__controls">
              <button class="btn btn--sm btn--primary" type="button" @click="togglePlay">
                {{ playing ? '⏸ 暂停' : '▶ 继续' }}
              </button>
              <button
                class="btn btn--sm"
                type="button"
                :disabled="playPos <= 0"
                @click="step(-1)"
              >
                ← 上一站
              </button>
              <button
                class="btn btn--sm"
                type="button"
                :disabled="!currentArmy || playPos >= currentArmy.nodes.length - 1"
                @click="advance()"
              >
                前进一站
              </button>
              <button class="btn btn--sm" type="button" @click="jumpTo(currentArmy.nodes.length)">
                直达终点
              </button>
              <button class="btn btn--sm btn--ghost" type="button" @click="resetReveal">
                重走
              </button>
            </div>

            <div class="speed-row">
              <span class="text-dim">速度</span>
              <div class="speed-row__group" role="group" aria-label="播放速度">
                <button
                  v-for="s in SPEEDS"
                  :key="s.id"
                  class="speed-row__btn"
                  :class="{ 'is-on': speedId === s.id }"
                  type="button"
                  @click="speedId = s.id"
                >
                  {{ s.label }}
                </button>
              </div>
              <span class="text-dim">{{ (stepMs / 1000).toFixed(1) }} 秒/站</span>
            </div>
          </section>

          <!-- 故事区：占据屏幕剩余部分，独立滚动 -->
          <div class="story-scroll scroll-area">
            <section v-if="currentNode" class="panel px-4 py-4 story-card">
              <NodeDetailCard
                :node="currentNode"
                :army="currentArmy"
                :index="selectedIndex"
                @close="selectedNodeId = ''"
                @open-fact="showGanzi = true"
                @open-sources="showSources = true"
              />
            </section>

            <section v-else class="panel px-4 py-4 story-card story-empty">
              <p class="lede">已收起当前事件卡。</p>
              <button class="btn btn--primary" type="button" @click="returnToCurrent">
                回到正在行进的站点
              </button>
            </section>
          </div>

          <!-- 节点进度轨道：常驻故事区底部 -->
          <NodeRail
            :army="currentArmy"
            :reveal-count="revealCount"
            :selected-node-id="selectedNodeId"
            @select="onSelectNode"
          />

          <!-- 故事区页脚：里程口径 + 底图声明（地图已收窄，这些说明移到这里） -->
          <p v-if="progress" class="story-foot">
            <span>
              沿途累计直线距离约 <b>{{ progress.doneKm }}</b> / {{ progress.totalKm }} 公里
              <span class="story-foot__dim">（直线，非行军里程）</span>
            </span>
            <span class="story-foot__sep">·</span>
            <span class="story-foot__dim">底图未修改任何边界，含南海诸岛、九段线</span>
            <button class="map-notice__link" type="button" @click="showSources = true">
              依据 →
            </button>
          </p>
        </template>
      </aside>
    </main>
    </template>

    <!-- ================= 弹窗 ================= -->
    <GanziFactModal
      :open="showGanzi"
      :army-name="currentArmy ? currentArmy.name : ''"
      @close="showGanzi = false"
    />

    <SourcesDrawer
      :open="showSources"
      :base-map="baseMap"
      :army="currentArmy"
      @close="showSources = false"
    />
  </div>
</template>

<style scoped>
/* ---------- 顶栏 ---------- */
.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  padding: 12px 16px;
  border-bottom: 1px solid var(--panel-border);
  background: rgba(8, 13, 19, 0.6);
  backdrop-filter: blur(10px);
}

.app-header__brand {
  display: flex;
  align-items: center;
  gap: 11px;
  min-width: 0;
}

.app-header__mark {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border-radius: 11px;
  font-size: 17px;
  color: #fff;
  background: linear-gradient(180deg, #d92b3a, #8f1622);
  box-shadow: 0 6px 18px rgba(217, 43, 58, 0.35);
}

.app-header__title {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  letter-spacing: 0.06em;
  line-height: 1.2;
}

.app-header__sub {
  margin: 2px 0 0;
  font-size: 11.5px;
  color: var(--color-mist-500);
}

.app-header__actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.app-header__army {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 5px 12px;
  border-radius: 999px;
  border: 1px solid var(--panel-border);
  background: rgba(255, 255, 255, 0.05);
  font-size: 12.5px;
}

/* ---------- 底图合规告警条 ---------- */
.compliance-strip {
  display: flex;
  align-items: center;
  gap: 9px;
  flex-wrap: wrap;
  padding: 9px 16px;
  font-size: 12.5px;
  line-height: 1.6;
  border-bottom: 1px solid var(--panel-border);
}

.compliance-strip--danger {
  background: rgba(229, 72, 77, 0.16);
  color: #ffd9d6;
}

.compliance-strip--warn {
  background: rgba(212, 175, 55, 0.14);
  color: #f0e2b8;
}

.compliance-strip__icon {
  flex: none;
}

.compliance-strip__text {
  flex: 1;
  min-width: 220px;
}

/* ---------- 状态页 ---------- */
.app-state {
  flex: 1;
  display: grid;
  place-items: center;
  padding: 24px;
  min-height: 0;
}

.code-block {
  margin: 10px 0 0;
  padding: 10px 12px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid var(--panel-border);
  font-size: 12.5px;
  color: #ffd9a0;
  overflow-x: auto;
}

.app-state code {
  font-size: 12px;
  color: #ffd9a0;
}

/* ---------- 主体布局 ---------- */
.app-main {
  flex: 1;
  min-height: 0;
  display: grid;
  gap: 12px;
  padding: 12px;
  /* 选择模式下浮窗的定位基准 */
  position: relative;
}

/* ---------- 选择模式：地图铺满，选部队以小浮窗浮在地图上 ---------- */
.app-main--select {
  grid-template-columns: minmax(0, 1fr);
}

.app-main--select .col-map {
  grid-area: 1 / 1;
  min-height: 380px;
}

.app-main--select .col-side {
  grid-area: 1 / 1;
  position: absolute;
  left: 12px;
  top: 12px;
  z-index: 20;
  width: min(346px, calc(100% - 24px));
  max-height: calc(100% - 24px);
  padding: 0;
  overflow: hidden;
}

/* ---------- 故事模式：地图与故事各占一半 ---------- */
.app-main--journey {
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
}

.app-main--journey .col-side {
  /* 故事列内部自带滚动区与常驻底部的节点轨道，外层不再滚动 */
  overflow: hidden;
}

.col-map {
  position: relative;
  min-height: 400px;
}

.col-side {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 0;
  overflow-y: auto;
  padding-right: 2px;
}

/* ---------- 故事区 ---------- */
.story-scroll {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding-right: 2px;
}

.story-card {
  /* 限制正文行宽：故事区很宽时不限制会难以阅读 */
  max-width: 900px;
  margin: 0 auto;
}

.story-empty {
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: flex-start;
}

.story-foot {
  flex: none;
  display: flex;
  align-items: center;
  gap: 7px;
  flex-wrap: wrap;
  margin: 0;
  padding: 0 4px;
  font-size: 11px;
  line-height: 1.6;
  color: var(--color-mist-500);
}

.story-foot b {
  color: var(--color-gold-300);
}

.story-foot__sep {
  color: var(--color-mist-600);
}

.story-foot__dim {
  color: var(--color-mist-600);
}

/* ---------- 故事区紧凑排版 ----------
   收紧顶栏、轨道与页脚的字号与留白，把纵向空间让给图片与介绍。 */
.status__name {
  font-size: 14.5px;
}

.status__line {
  font-size: 11px;
}

.progress--tight .progress__meta {
  font-size: 10px;
}

.status__controls .btn {
  padding: 3px 9px;
  font-size: 11.5px;
}

.story-foot {
  font-size: 10.5px;
}

/* ---------- 底图声明条 ---------- */
.map-notice {
  position: absolute;
  right: 12px;
  bottom: 10px;
  z-index: 6;
  margin: 0;
  max-width: min(70%, 560px);
  font-size: 11px;
  line-height: 1.6;
  text-align: right;
  color: var(--color-mist-600);
  background: rgba(8, 13, 19, 0.72);
  border: 1px solid var(--panel-border);
  border-radius: 10px;
  padding: 6px 10px;
  backdrop-filter: blur(8px);
}

.map-notice b {
  color: var(--color-mist-300);
}

.map-notice__link {
  display: inline;
  padding: 0;
  border: none;
  background: none;
  color: var(--color-gold-300);
  font: inherit;
  cursor: pointer;
  text-decoration: underline;
}

/* ---------- 进度条 ---------- */
.progress {
  margin-top: 12px;
}

.progress__bar {
  height: 6px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.09);
  overflow: hidden;
}

.progress__fill {
  display: block;
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, #d92b3a, #e8c766);
  transition: width 0.5s cubic-bezier(0.22, 1, 0.36, 1);
}

.progress__meta {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  margin-top: 5px;
  font-size: 11px;
  color: var(--color-mist-500);
  flex-wrap: wrap;
}

/* ---------- 故事页顶栏（紧凑版：把纵向空间让给图片与介绍） ---------- */
.status {
  padding: 10px 12px;
}

.status__head {
  display: flex;
  align-items: baseline;
  gap: 8px;
  flex-wrap: wrap;
}

.status__name {
  margin: 0;
  font-size: 15.5px;
  font-weight: 700;
  line-height: 1.3;
}

.status__alias {
  font-size: 11px;
  color: var(--color-mist-500);
}

/* 返回选部队的文字按钮：靠右，弱化处理不抢主线 */
.status__back {
  margin-left: auto;
  padding: 2px 8px;
  border: none;
  border-radius: 999px;
  background: transparent;
  color: var(--color-mist-500);
  font-family: inherit;
  font-size: 11px;
  cursor: pointer;
  transition: color 0.16s ease, background 0.16s ease;
}

.status__back:hover {
  color: #fff;
  background: rgba(255, 255, 255, 0.08);
}

.status__line {
  margin: 5px 0 0;
  font-size: 11.5px;
  line-height: 1.6;
  color: var(--color-mist-300);
}

.status__line--dim {
  color: var(--color-mist-600);
}

.status__controls {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  margin-top: 9px;
}

.status__controls .btn {
  padding: 4px 10px;
  font-size: 12px;
}

/* 紧凑进度条 */
.progress--tight {
  margin-top: 8px;
}

.progress--tight .progress__bar {
  height: 5px;
}

.progress--tight .progress__meta {
  margin-top: 4px;
  font-size: 10.5px;
}

/* ---------- 播放速度 ---------- */
.speed-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 8px;
  font-size: 11px;
}

.speed-row__group {
  display: inline-flex;
  padding: 2px;
  border-radius: 999px;
  border: 1px solid var(--panel-border);
  background: rgba(255, 255, 255, 0.04);
}

.speed-row__btn {
  padding: 3px 12px;
  border: none;
  border-radius: 999px;
  background: transparent;
  color: var(--color-mist-300);
  font-family: inherit;
  font-size: 11px;
  cursor: pointer;
  transition: background 0.16s ease, color 0.16s ease;
}

.speed-row__btn:hover {
  color: #fff;
}

.speed-row__btn.is-on {
  background: linear-gradient(180deg, rgba(217, 43, 58, 0.95), rgba(160, 24, 36, 0.95));
  color: #fff;
}

/* ---------- 移动端 ---------- */
@media (max-width: 1023px) {
  .app-main--select,
  .app-main--journey {
    grid-template-columns: minmax(0, 1fr);
  }

  /* 选择模式：地图铺满，选部队的浮窗贴底（不再独占一栏） */
  .app-main--select .col-map {
    height: 62vh;
    min-height: 340px;
  }

  .app-main--select .col-side {
    left: 10px;
    right: 10px;
    top: auto;
    bottom: 10px;
    width: auto;
    max-height: 54vh;
  }

  /* 故事模式：地图收缩到约 1/3 屏高，把屏幕让给故事 */
  .app-main--journey .col-map {
    height: 34vh;
    min-height: 220px;
  }

  /* 移动端交给页面整体滚动，取消故事列内部的滚动容器 */
  .app-main--journey .col-side {
    overflow: visible;
    padding-right: 0;
  }

  .story-scroll {
    overflow: visible;
    padding-right: 0;
  }

  .map-notice {
    max-width: calc(100% - 24px);
    font-size: 10.5px;
  }
}

/* 桌面端：整体不滚动，列内滚动 */
@media (min-width: 1024px) {
  .app-shell {
    height: 100dvh;
    overflow: hidden;
  }
}
</style>
