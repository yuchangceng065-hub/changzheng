<script setup>
import { computed } from 'vue'
import { DISCLAIMERS, SOURCES, getSource } from '../data/sources.js'

const props = defineProps({
  open: { type: Boolean, default: false },
  baseMap: { type: Object, default: null },
  army: { type: Object, default: null }
})

const emit = defineEmits(['close'])

const integrity = computed(() => (props.baseMap && props.baseMap.integrity) || null)
const mapSources = computed(() => (props.baseMap && props.baseMap.sources) || null)
const armySources = computed(() =>
  props.army ? props.army.sources.map(getSource) : []
)
</script>

<template>
  <template v-if="open">
    <div class="drawer-mask" @click="emit('close')" />
    <aside class="drawer" role="dialog" aria-modal="true" aria-label="资料来源与数据口径">
      <header class="flex items-start justify-between gap-3 px-5 py-4">
        <div>
          <p class="panel-title">资料来源与数据口径</p>
          <h2 class="serif mt-1 text-xl font-bold">史实注记 · 底图声明</h2>
        </div>
        <button class="btn btn--ghost btn--sm" type="button" @click="emit('close')">✕</button>
      </header>

      <div class="drawer__body scroll-area">
        <!-- 底图 -->
        <section class="mb-6">
          <p class="panel-title mb-2">地图底图与领土完整性自检</p>

          <div v-if="mapSources" class="source-item">
            <p class="text-body text-[13px] leading-relaxed">
              {{ mapSources.description }}
            </p>
            <p v-if="mapSources.publisher" class="text-dim mt-1 text-[12px]">
              数据提供：{{ mapSources.publisher }}
            </p>
            <p v-if="mapSources.url" class="mt-1 text-[12px]">
              <a :href="mapSources.url" target="_blank" rel="noopener noreferrer">
                {{ mapSources.url }}
              </a>
            </p>
            <p v-if="mapSources.standardMapNote" class="text-dim mt-2 text-[12px] leading-relaxed">
              {{ mapSources.standardMapNote }}
            </p>
          </div>
          <div v-else class="source-item">
            <p class="text-body text-[13px]">未找到底图来源声明文件（public/map/sources.json）。</p>
          </div>

          <div v-if="integrity" class="fact-grid mt-3">
            <div class="fact">
              <div class="fact__k">底图要素数</div>
              <div class="fact__v">{{ integrity.featureCount }}</div>
            </div>
            <div class="fact">
              <div class="fact__k">台湾省</div>
              <div class="fact__v" :style="{ color: integrity.hasTaiwan ? '#7bd88f' : '#ff7b72' }">
                {{ integrity.hasTaiwan ? '已包含 ✓' : '未检测到 ✗' }}
              </div>
            </div>
            <div class="fact">
              <div class="fact__k">海南省</div>
              <div class="fact__v" :style="{ color: integrity.hasHainan ? '#7bd88f' : '#ff7b72' }">
                {{ integrity.hasHainan ? '已包含 ✓' : '未检测到 ✗' }}
              </div>
            </div>
            <div class="fact">
              <div class="fact__k">南海诸岛插图</div>
              <div
                class="fact__v"
                :style="{ color: integrity.hasNanhaiFeature ? '#7bd88f' : '#ff7b72' }"
              >
                {{ integrity.hasNanhaiFeature ? '已包含 ✓' : '未检测到 ✗' }}
              </div>
            </div>
            <div class="fact">
              <div class="fact__k">九段线（线状要素）</div>
              <div
                class="fact__v"
                :style="{ color: integrity.dashConfirmed ? '#7bd88f' : '#e8c766' }"
              >
                {{ integrity.dashConfirmed ? '已检测到' : '需人工确认' }}
              </div>
            </div>
            <div class="fact">
              <div class="fact__k">补充要素</div>
              <div class="fact__v">{{ integrity.supplementUsed ? '已启用' : '未启用' }}</div>
            </div>
          </div>

          <p
            v-if="integrity && integrity.matchedNames && integrity.matchedNames.length"
            class="text-dim mt-2 text-[12px]"
          >
            命中要素：{{ integrity.matchedNames.join('、') }}
          </p>

          <p v-if="integrity && !integrity.hasNanhaiFeature" class="callout callout--danger mt-3">
            当前底图未检测到“南海诸岛”插图要素，领土表示不完整。请更换为符合自然资源部标准地图要求的底图，或补充
            <code>public/map/nanhai.json</code>，否则不得用于展示或参赛。
          </p>

          <p v-else-if="integrity && integrity.needsManualDashCheck" class="callout mt-3">
            底图中未检测到线状几何，因此<b>无法由数据自动确认“九段线”是否完整表示</b>。请在地图上放大南海方向
            <b>目视核对九段线</b>；如缺失，请更换底图或补充 <code>public/map/nanhai.json</code>。本作品不臆断为合规。
          </p>
        </section>

        <!-- 数据口径 -->
        <section class="mb-6">
          <p class="panel-title mb-2">数据口径说明</p>
          <div v-for="d in DISCLAIMERS" :key="d.id" class="source-item">
            <p class="text-[13.5px] font-semibold">{{ d.title }}</p>
            <p class="text-body mt-1 text-[12.5px] leading-relaxed">{{ d.text }}</p>
          </div>
        </section>

        <!-- 当前部队来源 -->
        <section v-if="armySources.length" class="mb-6">
          <p class="panel-title mb-2">当前部队（{{ army.name }}）史实依据</p>
          <div v-for="s in armySources" :key="s.id" class="source-item">
            <p class="text-[13.5px]">{{ s.title }}</p>
            <p v-if="s.publisher" class="text-dim text-[12px]">{{ s.publisher }}</p>
            <p v-if="s.note" class="text-dim mt-1 text-[12px] leading-relaxed">{{ s.note }}</p>
          </div>
        </section>

        <!-- 全部来源 -->
        <section>
          <p class="panel-title mb-2">全部史实资料来源</p>
          <div v-for="s in SOURCES" :key="s.id" class="source-item">
            <p class="text-[13.5px]">{{ s.title }}</p>
            <p v-if="s.publisher" class="text-dim text-[12px]">{{ s.publisher }}</p>
            <p v-if="s.url" class="text-[12px]">
              <a :href="s.url" target="_blank" rel="noopener noreferrer">{{ s.url }}</a>
            </p>
            <p v-if="s.note" class="text-dim mt-1 text-[12px] leading-relaxed">{{ s.note }}</p>
          </div>
          <p class="text-dim mt-3 text-[11.5px] leading-relaxed">
            注：本作品的史实表述均依据公开出版的权威党史、军史著作与官方机构发布内容整理；出版版本与页码以正式出版物为准。如用于正式参赛或公开出版，请以自然资源部标准地图服务网站（bzdt.ch.mnr.gov.cn）发布的带审图号标准地图为准。
          </p>
        </section>
      </div>
    </aside>
  </template>
</template>
