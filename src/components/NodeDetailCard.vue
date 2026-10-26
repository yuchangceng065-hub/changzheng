<script setup>
import { computed } from 'vue'
import EventArtwork from './EventArtwork.vue'
import { NODE_KINDS } from '../data/armies.js'

const props = defineProps({
  node: { type: Object, required: true }
})

const emit = defineEmits(['close', 'open-fact'])

const kind = computed(() => NODE_KINDS[props.node.kind] || NODE_KINDS.march)

const isGanzi = computed(() => props.node.special === 'ganzi')

</script>

<template>
  <article class="flex flex-col gap-3" :style="{ '--kind-color': kind.color }">
    <div class="node-card__head">
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
    <div class="node-card__top">
      <EventArtwork :node="node" class="node-card__art" />

      <div v-if="!node.detail.startsWith(node.brief)" class="node-card__intro">
        <p class="lede">{{ node.brief }}</p>

      </div>
    </div>

    <p class="prose-cn">{{ node.detail }}</p>

    <div v-if="isGanzi" class="callout">
      <b>甘孜专题：</b>红二、六军团与红四方面军在甘孜会合，以及红二方面军的正式组建。
      <div class="mt-2">
        <button class="btn btn--sm btn--primary" type="button" @click="emit('open-fact')">
          查看会师与组建经过
        </button>
      </div>
    </div>

  </article>
</template>

<style scoped>
.node-card__top { display: flex; flex-direction: column; gap: 12px; }
.node-card__intro:empty { display: none; }
.node-card__name { margin: 0; font: 600 24px/1.5 var(--font-serif); }
.node-card__place { margin: 5px 0 0; font-size: 12px; line-height: 1.8; }
.lede { margin: 0; font-size: 14px; line-height: 1.9; }
.prose-cn { margin: 0; white-space: pre-line; font-size: 14px; line-height: 2; }
</style>
