<script setup>
import { ref } from 'vue'
import { SELECT_LEDE, SPEC_NOTES, START_LABEL } from '../data/specNotes.js'

defineProps({
  armies: { type: Array, required: true },
  activeId: { type: String, default: '' }
})

const emit = defineEmits(['select'])

/** 收起后只留一行提示，方便专心看地图上的起点 */
const collapsed = ref(false)
</script>

<template>
  <section class="picker panel panel--solid" :class="{ 'picker--collapsed': collapsed }">
    <header class="picker__head">
      <div class="min-w-0">
        <p class="panel-title">选择长征部队</p>
        <p v-if="collapsed" class="picker__hint">点击地图上的起点标记，选择一支部队</p>
      </div>
      <button
        class="btn btn--ghost btn--sm"
        type="button"
        :title="collapsed ? '展开部队列表' : '收起，专心看地图'"
        @click="collapsed = !collapsed"
      >
        {{ collapsed ? '展开 ▾' : '收起 ▴' }}
      </button>
    </header>

    <template v-if="!collapsed">
      <p class="picker__lede">{{ SELECT_LEDE }}</p>

      <ul class="picker__list">
        <li v-for="army in armies" :key="army.id">
          <button
            class="picker__item"
            :class="{ 'is-active': army.id === activeId }"
            :style="{ '--card-color': army.color }"
            type="button"
            @click="emit('select', army.id)"
          >
            <span class="picker__bar" />
            <span class="picker__main">
              <span class="picker__name">
                {{ army.name }}
                <span v-if="army.alias" class="picker__alias">（{{ army.alias }}）</span>
              </span>
              <span class="picker__meta">
                <b>{{ START_LABEL[army.id] || army.startPlace }}</b>
                · {{ army.startDate }}
                · {{ army.duration }}
              </span>
              <span class="picker__note">{{ SPEC_NOTES[army.id] || army.summary }}</span>
            </span>
            <span class="picker__side">
              <span class="picker__enter">进入 →</span>
            </span>
          </button>
        </li>
      </ul>

      <p class="picker__foot">四支部队从不同起点出发，行程与遭遇各不相同。</p>
    </template>
  </section>
</template>

<style scoped>
.picker {
  display: flex;
  flex-direction: column;
  min-height: 0;
  padding: 12px 12px 12px;
}

.picker__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
  flex: none;
}

.picker__hint {
  margin: 4px 0 0;
  font-size: 11.5px;
  color: var(--color-mist-500);
}

.picker__lede {
  flex: none;
  margin: 9px 0 0;
  font-size: 12px;
  line-height: 1.75;
  color: #c3d0dd;
}

.picker__list {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  margin: 10px 0 0;
  padding: 0 2px 0 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 7px;
  scrollbar-width: thin;
  scrollbar-color: rgba(180, 152, 158, 0.35) transparent;
}

.picker__list::-webkit-scrollbar {
  width: 7px;
}

.picker__list::-webkit-scrollbar-thumb {
  background: rgba(180, 152, 158, 0.3);
  border-radius: 999px;
}

.picker__item {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: start;
  gap: 8px;
  width: 100%;
  padding: 9px 10px 9px 14px;
  border-radius: 10px;
  border: 1px solid var(--panel-border);
  background: linear-gradient(150deg, rgba(255, 255, 255, 0.055), rgba(255, 255, 255, 0.02));
  color: inherit;
  font-family: inherit;
  text-align: left;
  cursor: pointer;
  transition: border-color 0.18s ease, background 0.18s ease, transform 0.18s ease;
}

.picker__item:hover {
  border-color: var(--card-color, #d92b3a);
  transform: translateY(-1px);
}

.picker__item.is-active {
  border-color: var(--card-color, #d92b3a);
  background: linear-gradient(150deg, rgba(255, 255, 255, 0.11), rgba(255, 255, 255, 0.03));
}

/* 左侧部队主题色竖条 */
.picker__bar {
  position: absolute;
  left: 0;
  top: 8px;
  bottom: 8px;
  width: 3px;
  border-radius: 999px;
  background: var(--card-color, #d92b3a);
}

.picker__main {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.picker__name {
  font-size: 13.5px;
  font-weight: 700;
  line-height: 1.4;
}

.picker__alias {
  font-size: 11px;
  font-weight: 400;
  color: var(--color-mist-500);
}

.picker__meta {
  font-size: 11px;
  color: var(--color-mist-500);
}

.picker__meta b {
  color: var(--card-color, #d92b3a);
  font-weight: 600;
}

.picker__note {
  margin-top: 2px;
  font-size: 11.5px;
  line-height: 1.7;
  color: #aebccb;
}

/* 右侧：星级 + 明确的"进入"指示，让这一行看起来是可点击的入口 */
.picker__side {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 7px;
  padding-top: 2px;
}

.picker__enter {
  white-space: nowrap;
  font-size: 10.5px;
  font-weight: 700;
  letter-spacing: 0.02em;
  color: var(--card-color, #d92b3a);
}

.picker__item:hover .picker__enter {
  color: #fff;
}

.picker__foot {
  flex: none;
  margin: 9px 0 0;
  padding-top: 8px;
  border-top: 1px dashed rgba(180, 152, 158, 0.22);
  font-size: 11px;
  line-height: 1.6;
  color: var(--color-mist-600);
}
</style>
