<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import MapStage from './components/MapStage.vue'
import ArmySelectPanel from './components/ArmySelectPanel.vue'
import NodeDetailCard from './components/NodeDetailCard.vue'
import NodeRail from './components/NodeRail.vue'
import GanziFactModal from './components/GanziFactModal.vue'
import SourcesDrawer from './components/SourcesDrawer.vue'
import GuestbookDrawer from './components/GuestbookDrawer.vue'
import NavBar from './components/NavBar.vue'
import HomeView from './views/HomeView.vue'
import ArmiesView from './views/ArmiesView.vue'
import GalleryView from './views/GalleryView.vue'
import SpiritView from './views/SpiritView.vue'
import FloatingMusicPlayer from './components/FloatingMusicPlayer.vue'
import { ARMIES, getArmy } from './data/armies.js'
import { loadBaseMap } from './map/loadBaseMap.js'

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
const showGuestbook = ref(false)
const videoPlaying = ref(false)
/** 当前页面：home | armies | journey | gallery | spirit */
const view = ref('home')

// 首页是长页面，切换到其他栏目时回到页面顶部。
watch(view, () => window.scrollTo(0, 0), { flush: 'post' })

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

const progress = computed(() => {
  if (!currentArmy.value) return null
  const total = currentArmy.value.nodes.length
  return {
    total,
    done: revealCount.value,
    percent: total ? Math.round((revealCount.value / total) * 100) : 0
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
 * 下一站。
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

function openMapSelection() {
  backToSelect()
  view.value = 'journey'
}

/** 从首页或「部队介绍」页直接进入某支部队的地图 */
function enterArmyFromIntro(id) {
  selectArmy(id)
  view.value = 'journey'
}

/** 首页的历史现场入口定位到对应部队与节点，保持暂停，方便阅读。 */
function enterNodeFromHome({ armyId, nodeId }) {
  const army = getArmy(armyId)
  const node = army?.nodes.find((item) => item.id === nodeId)
  if (!node) return
  selectArmy(armyId)
  onSelectNode(node)
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

function openSources() {
  showGuestbook.value = false
  showSources.value = true
}

function openGuestbook() {
  showSources.value = false
  showGuestbook.value = true
}
</script>

<template>
  <div class="app-shell">
    <!-- ================= 顶部导航 ================= -->
    <NavBar :view="view" :guestbook-open="showGuestbook" @change="navigate" @open-sources="openSources" @open-guestbook="openGuestbook" />

    <!-- ================= 非地图页面 ================= -->
    <HomeView
      v-if="view === 'home'"
      @navigate="navigate"
      @open-map="openMapSelection"
      @enter-army="enterArmyFromIntro"
      @enter-node="enterNodeFromHome"
      @open-sources="openSources"
    />
    <ArmiesView v-else-if="view === 'armies'" @enter-army="enterArmyFromIntro" />
    <GalleryView v-else-if="view === 'gallery'" />
    <SpiritView v-else-if="view === 'spirit'" @video-state="videoPlaying = $event" />

    <!-- ================= 深度交互：加载 / 错误 / 地图 ================= -->
    <template v-if="view === 'journey'">
    <main v-if="loading" class="app-state">
      <div class="panel px-6 py-6 text-center">
        <p class="lede">正在加载地图底图与史实数据…</p>
      </div>
    </main>

    <main v-else-if="loadError" class="app-state">
      <div class="panel panel--solid px-6 py-6">
        <h2 class="serif text-xl">地图暂时无法加载</h2>
        <p class="prose-cn mt-3">请刷新页面，或关闭启动窗口后重新启动网站。</p>
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
        <header class="map-sourcebar">
          <span :title="baseMap.sources.sourceOnlineMapReviewScope">天地图在线底图审图号：{{ baseMap.sources.sourceOnlineMapReviewNumber }}</span>
          <a :href="baseMap.sources.url" target="_blank" rel="noopener noreferrer">底图来源 ↗</a>
        </header>
        <div class="map-frame">
        <MapStage
          :base-map="baseMap"
          :army="currentArmy"
          :reveal-count="revealCount"
          :selected-node-id="selectedNodeId"
          @select-start="onStartPinArmy"
          @select-node="onSelectNode"
        />
        </div>

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
              <button class="status__back" type="button" @click="backToSelect">
                更换部队
              </button>
            </div>

            <p class="status__line">
              {{ currentArmy.startDate }} — {{ currentArmy.endDate }}
            </p>

            <div v-if="progress" class="progress progress--tight">
              <div class="progress__bar">
                <span class="progress__fill" :style="{ width: `${progress.percent}%` }" />
              </div>
              <div class="progress__meta">
                <span>已行进 {{ progress.done }} / {{ progress.total }} 站</span>

              </div>
            </div>

            <div class="status__controls">
              <button class="btn btn--sm btn--primary" type="button" @click="togglePlay">
                {{ playing ? '暂停播放' : '播放路线' }}
              </button>
              <button
                class="btn btn--sm"
                type="button"
                :disabled="playPos <= 0"
                @click="step(-1)"
              >
                上一站
              </button>
              <button
                class="btn btn--sm"
                type="button"
                :disabled="!currentArmy || playPos >= currentArmy.nodes.length - 1"
                @click="advance()"
              >
                下一站
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

            </div>
          </section>

          <!-- 故事区：占据屏幕剩余部分，独立滚动 -->
          <div class="story-scroll scroll-area">
            <section v-if="currentNode" class="panel px-4 py-4 story-card">
              <NodeDetailCard
                :node="currentNode"
                @close="selectedNodeId = ''"
                @open-fact="showGanzi = true"

              />
            </section>

            <section v-else class="panel px-4 py-4 story-card story-empty">
              <p class="lede">事件详情已收起。</p>
              <button class="btn btn--primary" type="button" @click="returnToCurrent">
                查看当前事件
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
    <GuestbookDrawer :open="showGuestbook" @close="showGuestbook = false" />
    <FloatingMusicPlayer :video-playing="videoPlaying" />
  </div>
</template>

<style scoped>
.app-state { flex: 1; min-height: 0; display: grid; place-items: center; padding: 24px; }
.app-main { flex: 1; min-height: 0; display: grid; gap: 12px; padding: 12px; position: relative; }
.app-main--select { grid-template-columns: 346px minmax(0, 1fr); grid-template-areas: 'side map'; }
.app-main--select .col-side { justify-content: center; }
.app-main--journey { grid-template-columns: minmax(0, 1.12fr) minmax(375px, 1fr); grid-template-areas: 'map side'; }
.col-map { grid-area: map; position: relative; display: flex; flex-direction: column; min-height: 0; }
.map-frame { position: relative; flex: 1; min-height: 0; }
.map-sourcebar { display: flex; flex-wrap: wrap; align-items: center; gap: 6px 14px; flex: none; padding: 9px 12px; border-bottom: 1px solid var(--panel-border); color: var(--color-mist-500); font-size: 12px; line-height: 1.6; }
.map-sourcebar a { color: var(--color-gold-300); font: inherit; text-decoration: underline; text-underline-offset: 3px; }
.col-side { grid-area: side; display: flex; flex-direction: column; gap: 8px; min-height: 0; overflow: hidden; }
.story-scroll { flex: 1; min-height: 0; overflow-y: auto; }
.story-card { max-width: 900px; margin: 0 auto; }
.story-empty { display: flex; flex-direction: column; gap: 12px; align-items: flex-start; }
.status { flex: none; padding: 10px 12px; }
.status__head { display: flex; align-items: baseline; gap: 12px; }
.status__name { margin: 0; font-size: 16px; font-weight: 500; }
.status__back { margin-left: auto; padding: 0; border: none; background: none; color: var(--color-mist-500); font: inherit; font-size: 11px; cursor: pointer; }
.status__line { margin: 4px 0 7px; font-size: 11px; color: var(--color-mist-500); }
.progress { display: flex; align-items: center; gap: 10px; }
.progress__bar { flex: 1; height: 3px; background: #ffffff17; overflow: hidden; }
.progress__fill { display: block; height: 100%; background: #b36a4d; transition: width .4s; }
.progress__meta { font-size: 10px; color: var(--color-mist-500); white-space: nowrap; }
.status__controls { display: inline-flex; align-items: center; gap: 5px; flex-wrap: wrap; margin-top: 8px; }
.status__controls .btn { font-size: 11px; padding: 3px 7px; }
.speed-row { display: inline-flex; align-items: center; gap: 5px; margin: 8px 0 0 10px; font-size: 10px; }
.speed-row__group { display: inline-flex; }
.speed-row__btn { padding: 3px 6px; border: 0; border-radius: 2px; background: transparent; color: var(--color-mist-500); font: inherit; cursor: pointer; }
.speed-row__btn.is-on { background: #563126; color: #f0e6d1; }
</style>
