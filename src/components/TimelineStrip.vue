<script setup>
import { computed } from 'vue'
import { NODE_KINDS } from '../data/armies.js'
import StarRating from './StarRating.vue'

const props = defineProps({
  army: { type: Object, required: true },
  revealCount: { type: Number, default: 0 },
  selectedNodeId: { type: String, default: '' }
})

const emit = defineEmits(['select'])

const items = computed(() =>
  props.army.nodes.map((node, index) => {
    const kind = NODE_KINDS[node.kind] || NODE_KINDS.march
    return {
      node,
      index,
      kind,
      reached: index < props.revealCount,
      active: node.id === props.selectedNodeId
    }
  })
)
</script>

<template>
  <section class="timeline">
    <p class="panel-title mb-2">行军节点（共 {{ army.nodes.length }} 站）</p>
    <ol class="timeline__list">
      <li v-for="item in items" :key="item.node.id">
        <button
          class="timeline__item"
          :class="{ 'is-reached': item.reached, 'is-active': item.active }"
          :style="{ '--node-color': item.kind.color }"
          type="button"
          @click="emit('select', item.node)"
        >
          <span class="timeline__rail">
            <span class="timeline__dot">{{ item.reached ? item.kind.icon : '' }}</span>
          </span>
          <span class="timeline__body">
            <span class="timeline__name">
              {{ item.node.name }}
              <span v-if="item.node.special === 'ganzi'" class="timeline__badge">史实说明</span>
            </span>
            <span class="timeline__meta">
              {{ item.node.place }} · {{ item.node.date }}
            </span>
          </span>
          <StarRating :stars="item.node.hardship" size="sm" />
        </button>
      </li>
    </ol>
  </section>
</template>

<style scoped>
.timeline__list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.timeline__item {
  display: grid;
  grid-template-columns: 26px minmax(0, 1fr) auto;
  align-items: start;
  gap: 8px;
  width: 100%;
  padding: 6px 8px 6px 0;
  border: 1px solid transparent;
  border-radius: 10px;
  background: transparent;
  color: inherit;
  font-family: inherit;
  text-align: left;
  cursor: pointer;
  transition: background 0.16s ease, border-color 0.16s ease;
}

.timeline__item:hover {
  background: rgba(255, 255, 255, 0.05);
  border-color: var(--panel-border);
}

.timeline__item.is-active {
  background: rgba(255, 255, 255, 0.08);
  border-color: var(--node-color, #9aa7b4);
}

.timeline__rail {
  position: relative;
  display: flex;
  justify-content: center;
  align-self: stretch;
}

.timeline__rail::before {
  content: '';
  position: absolute;
  top: 0;
  bottom: -12px;
  left: 50%;
  width: 1px;
  transform: translateX(-50%);
  background: rgba(140, 165, 190, 0.25);
}

.timeline__list li:last-child .timeline__rail::before {
  display: none;
}

.timeline__dot {
  position: relative;
  z-index: 1;
  width: 22px;
  height: 22px;
  border-radius: 999px;
  display: grid;
  place-items: center;
  font-size: 11px;
  background: #0e1720;
  border: 1.5px solid var(--node-color, #9aa7b4);
  opacity: 0.5;
}

.timeline__item.is-reached .timeline__dot {
  opacity: 1;
  background: #24333f;
  background: color-mix(in srgb, var(--node-color, #9aa7b4) 34%, #0e1720);
  box-shadow: 0 0 10px rgba(154, 167, 180, 0.45);
  box-shadow: 0 0 10px color-mix(in srgb, var(--node-color, #9aa7b4) 45%, transparent);
}

.timeline__name {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13.5px;
  color: var(--color-mist-500);
  line-height: 1.5;
}

.timeline__item.is-reached .timeline__name {
  color: #e8eef4;
  font-weight: 600;
}

.timeline__meta {
  display: block;
  font-size: 11.5px;
  color: var(--color-mist-600);
  margin-top: 2px;
}

.timeline__badge {
  flex: none;
  padding: 1px 6px;
  border-radius: 999px;
  font-size: 10px;
  font-weight: 400;
  color: #1b1205;
  background: var(--color-gold-400);
}
</style>
