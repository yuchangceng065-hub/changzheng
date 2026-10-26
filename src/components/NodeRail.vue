<script setup>
import { computed, nextTick, ref, watch } from 'vue'
import { NODE_KINDS } from '../data/armies.js'

const props = defineProps({
  army: { type: Object, required: true },
  revealCount: { type: Number, default: 0 },
  selectedNodeId: { type: String, default: '' }
})

const emit = defineEmits(['select'])

const items = computed(() =>
  props.army.nodes.map((node, index) => ({
    node,
    index,
    kind: NODE_KINDS[node.kind] || NODE_KINDS.march,
    reached: index < props.revealCount,
    active: node.id === props.selectedNodeId
  }))
)

const listEl = ref(null)

/** 当前节点自动滚入视野，避免横向轨道太长时看不出走到哪了 */
watch(
  () => props.selectedNodeId,
  async () => {
    await nextTick()
    const el = listEl.value && listEl.value.querySelector('.rail__btn.is-active')
    if (el && el.scrollIntoView) {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
    }
  }
)
</script>

<template>
  <nav class="rail" aria-label="行军节点进度">
    <div class="rail__head">
      <span class="panel-title">行军进度</span>
      <span class="rail__count">第 {{ Math.max(1, revealCount) }} / {{ army.nodes.length }} 站</span>
    </div>

    <ol ref="listEl" class="rail__list">
      <li v-for="item in items" :key="item.node.id" class="rail__item">
        <button
          class="rail__btn"
          :class="{ 'is-reached': item.reached, 'is-active': item.active }"
          :style="{ '--node-color': item.kind.color }"
          type="button"
          :title="`${item.node.name} · ${item.node.place} · ${item.node.date}`"
          @click="emit('select', item.node)"
        >
          <span class="rail__dot">{{ item.index + 1 }}</span>
          <span class="rail__label">{{ item.node.name }}</span>
        </button>
      </li>
    </ol>
  </nav>
</template>

<style scoped>
.rail {
  flex: none;
  padding: 6px 9px 3px;
  border-radius: var(--radius-lg);
  border: 1px solid var(--panel-border);
  background: var(--panel-bg);
  backdrop-filter: none;
}

.rail__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 3px;
}

.rail__count {
  font-size: 11px;
  color: var(--color-gold-300);
}

.rail__list {
  display: flex;
  align-items: flex-start;
  gap: 0;
  margin: 0;
  padding: 0 0 3px;
  list-style: none;
  overflow-x: auto;
  overflow-y: hidden;
  scrollbar-width: thin;
  scrollbar-color: rgba(180, 152, 158, 0.4) transparent;
}

.rail__list::-webkit-scrollbar {
  height: 6px;
}

.rail__list::-webkit-scrollbar-thumb {
  background: rgba(180, 152, 158, 0.35);
  border-radius: 999px;
}

.rail__item {
  position: relative;
  flex: none;
}

/* 连接线：每个节点右侧拉到下一个节点，形成一条横向的“行军路线” */
.rail__item::after {
  content: '';
  position: absolute;
  top: 10px;
  left: calc(50% + 12px);
  width: calc(100% - 24px);
  height: 1px;
  background: rgba(180, 152, 158, 0.22);
}

.rail__item:last-child::after {
  display: none;
}

.rail__btn {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  width: 74px;
  padding: 2px 2px 3px;
  border: 1px solid transparent;
  border-radius: 3px;
  background: transparent;
  color: inherit;
  font-family: inherit;
  cursor: pointer;
  transition: background 0.16s ease, border-color 0.16s ease;
}

.rail__btn:hover {
  background: rgba(255, 255, 255, 0.06);
  border-color: var(--panel-border);
}

.rail__btn.is-active {
  background: rgba(255, 255, 255, 0.09);
  border-color: var(--node-color, #9aa7b4);
}

.rail__dot {
  display: grid;
  place-items: center;
  width: 19px;
  height: 19px;
  border-radius: 999px;
  font-size: 11px;
  background: #1b1915;
  border: 1.5px solid var(--node-color, #9aa7b4);
  opacity: 0.45;
  transition: opacity 0.16s ease, box-shadow 0.16s ease;
}

.rail__btn.is-reached .rail__dot {
  opacity: 1;
  background: #30241e;
  box-shadow: none;
}

.rail__label {
  font-size: 10px;
  line-height: 1.3;
  color: var(--color-mist-600);
  text-align: center;
  max-width: 74px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rail__btn.is-reached .rail__label {
  color: var(--color-mist-300);
}

.rail__btn.is-active .rail__label {
  color: #fff;
  font-weight: 600;
}
</style>
