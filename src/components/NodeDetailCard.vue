<script setup>
import { computed } from 'vue'
import EventArtwork from './EventArtwork.vue'
import MiniGameHost from './MiniGameHost.vue'
import { NODE_KINDS } from '../data/armies.js'
import { gameIdFor } from '../data/miniGames.js'
import { cumulativeDistances, formatKm } from '../utils/geo.js'

const props = defineProps({
  node: { type: Object, required: true },
  army: { type: Object, required: true },
  index: { type: Number, default: 0 }
})

const emit = defineEmits(['close', 'open-fact', 'open-sources'])

const kind = computed(() => NODE_KINDS[props.node.kind] || NODE_KINDS.march)

const distances = computed(() => cumulativeDistances(props.army.nodes))

const cumulativeKm = computed(() => distances.value.cumulative[props.index] || 0)
const legKm = computed(() => distances.value.legs[props.index] || 0)

const isGanzi = computed(() => props.node.special === 'ganzi')

/** 本站预留的小游戏（未实现，仅占位与接口） */
const gameId = computed(() => gameIdFor(props.node))
</script>

<template>
  <article class="anim-rise flex flex-col gap-3" :style="{ '--kind-color': kind.color }">
    <div class="node-card__head">
      <div class="node-kind" :title="kind.label">{{ kind.label }}</div>
      <div class="min-w-0 flex-1">
        <h3 class="node-card__name">{{ node.name }}</h3>
        <p class="node-card__place">
          {{ node.place }} · {{ node.date }} ·
          <span :style="{ color: kind.color }">{{ kind.label }}</span>
        </p>
      </div>
      <button class="btn btn--ghost btn--sm" type="button" title="关闭" @click="emit('close')">
        ✕
      </button>
    </div>

    <!-- 头图与导语并排：图片收窄，把横向空间让给介绍文字 -->
    <div class="node-card__top">
      <!-- 手绘内联 SVG 场景；节点若配了确认过的照片则优先显示照片 -->
      <EventArtwork :node="node" class="node-card__art" />

      <div class="node-card__intro">
        <p class="lede">{{ node.brief }}</p>

        <div class="fact-grid">
          <div class="fact">
            <div class="fact__k">本段直线距离</div>
            <div class="fact__v">
              {{ index === 0 ? '起点' : `${formatKm(legKm)} 公里` }}
            </div>
          </div>
          <div class="fact">
            <div class="fact__k">沿途累计直线距离</div>
            <div class="fact__v">{{ formatKm(cumulativeKm) }} 公里</div>
          </div>
        </div>
      </div>
    </div>

    <p class="prose-cn">{{ node.detail }}</p>

    <!-- 小游戏：本版本只预留接入点，不实现玩法 -->
    <MiniGameHost v-if="gameId" :game-id="gameId" />

    <div v-if="isGanzi" class="callout">
      <b>本站设有专题史实说明：</b>红二、六军团与红四方面军在甘孜会合，以及红二方面军的正式组建。
      <div class="mt-2">
        <button class="btn btn--sm btn--primary" type="button" @click="emit('open-fact')">
          查看【史实说明】
        </button>
      </div>
    </div>

    <div class="node-card__sources">
      <span class="text-dim">本站表述依据 {{ army.name }} 的史实来源清单</span>
      <button class="btn btn--sm btn--ghost" type="button" @click="emit('open-sources')">
        查看史实来源 →
      </button>
    </div>

    <p class="text-dim node-card__disclaimer">
      直线距离按节点经纬度测算（半正矢公式），仅用于直观表达行程跨度，不等于实际行军里程；实际行军里程远大于此。
    </p>
  </article>
</template>

<style scoped>
.node-card__sources {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
  font-size: 11.5px;
}

/* ---------- 头图 + 导语并排 ---------- */
/* 图片只占左侧固定一栏（约 300–360px），把横向空间留给介绍文字；
   窄屏下自动改为上下堆叠。 */
.node-card__top {
  display: grid;
  grid-template-columns: minmax(0, 340px) minmax(0, 1fr);
  gap: 14px;
  align-items: start;
}

.node-card__intro {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 0;
}

/* 并排时图片不必再按整幅卡片宽度铺开 */
.node-card__art {
  max-width: 340px;
}

@media (max-width: 720px) {
  .node-card__top {
    grid-template-columns: minmax(0, 1fr);
  }

  .node-card__art {
    max-width: none;
  }
}

.node-card__disclaimer {
  font-size: 10.5px;
  line-height: 1.7;
  margin: 0;
}

/* ---------- 紧凑排版 ----------
   故事区要放下图片、导语、数据、正文、小游戏占位与来源入口，
   因此这里统一把字号收一档。scoped 规则只作用于本组件内的元素，
   不会影响选部队界面与弹窗。 */
.node-card__name {
  font-size: 17px;
}

.node-card__place {
  font-size: 11.5px;
}

/* 覆盖全局的导语与正文字号 */
.lede {
  font-size: 13px;
  line-height: 1.8;
}

.prose-cn {
  font-size: 13px;
  line-height: 1.9;
}

.fact__k {
  font-size: 10.5px;
}

.fact__v {
  font-size: 12.5px;
}

.node-card__sources {
  font-size: 10.5px;
}
</style>
