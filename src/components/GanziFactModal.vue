<script setup>
import { GANZI_FACT } from '../data/armies.js'
import { getSource } from '../data/sources.js'

defineProps({
  open: { type: Boolean, default: false },
  /** 触发弹窗的部队名，用于文案衔接 */
  armyName: { type: String, default: '' }
})

const emit = defineEmits(['close'])

function onKeydown(e) {
  if (e.key === 'Escape') emit('close')
}

const sources = GANZI_FACT.sources.map(getSource)
</script>

<template>
  <div
    v-if="open"
    class="modal-mask"
    role="dialog"
    aria-modal="true"
    aria-labelledby="ganzi-fact-title"
    tabindex="-1"
    @click.self="emit('close')"
    @keydown="onKeydown"
  >
    <div class="modal panel panel--solid p-5 md:p-6">
      <div class="flex items-start justify-between gap-4">
        <div>
          <p class="modal__eyebrow">★ 专题史实说明</p>
          <h2 id="ganzi-fact-title" class="serif mt-1 text-2xl leading-snug font-bold">
            甘孜会师与红二方面军的组建
          </h2>
          <p class="text-dim mt-1 text-[13px]">{{ GANZI_FACT.subtitle }}</p>
          <p v-if="armyName" class="text-dim mt-1 text-[12px]">
            触发位置：{{ armyName }} · 甘孜节点
          </p>
        </div>
        <button class="btn btn--ghost btn--sm" type="button" aria-label="关闭" @click="emit('close')">
          ✕
        </button>
      </div>

      <div class="mt-5 flex flex-col gap-3">
        <div v-for="(point, i) in GANZI_FACT.points" :key="i" class="fact-point">
          <span class="fact-point__no">{{ i + 1 }}</span>
          {{ point }}
        </div>
      </div>

      <p class="callout mt-4">{{ GANZI_FACT.conclusion }}</p>

      <div class="mt-5">
        <p class="panel-title mb-2">史实来源</p>
        <ul class="flex flex-col gap-1 text-[12.5px] text-body">
          <li v-for="s in sources" :key="s.id">
            · {{ s.title }}<span v-if="s.publisher">（{{ s.publisher }}）</span>
          </li>
        </ul>
      </div>

      <div class="mt-5 flex items-center justify-between gap-3">
        <span class="text-dim text-[11.5px]">按 Esc 或点击空白处关闭</span>
        <button class="btn btn--primary" type="button" @click="emit('close')">
          我已了解，继续行军
        </button>
      </div>
    </div>
  </div>
</template>
