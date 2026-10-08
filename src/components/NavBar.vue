<script setup>
import FlagCN from './FlagCN.vue'

defineProps({
  view: { type: String, default: 'home' }
})

const emit = defineEmits(['change', 'open-sources'])

/** 顶部导航项。刻意不用图标：只用文字，避免堆砌装饰。 */
const ITEMS = [
  { id: 'home', label: '首页' },
  { id: 'armies', label: '部队介绍' },
  { id: 'journey', label: '深度交互' },
  { id: 'gallery', label: '长征图集' },
  { id: 'spirit', label: '长征精神' }
]
</script>

<template>
  <header class="nav">
    <button class="nav__brand" type="button" @click="emit('change', 'home')">
      <span class="nav__flag"><FlagCN /></span>
      <span class="nav__brandtext">
        <span class="nav__title">长征征途</span>
        <span class="nav__sub">交互式长征地图叙事科普</span>
      </span>
    </button>

    <nav class="nav__items" aria-label="主导航">
      <button
        v-for="item in ITEMS"
        :key="item.id"
        class="nav__item"
        :class="{ 'is-on': view === item.id }"
        type="button"
        :aria-current="view === item.id ? 'page' : undefined"
        @click="emit('change', item.id)"
      >
        {{ item.label }}
      </button>
    </nav>

    <button class="nav__side" type="button" @click="emit('open-sources')">
      资料来源与注记
    </button>
  </header>
</template>

<style scoped>
.nav {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  padding: 10px 16px;
  border-bottom: 1px solid var(--panel-border);
  background: rgba(10, 5, 7, 0.72);
  backdrop-filter: blur(10px);
  z-index: 30;
}

.nav__brand {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0;
  border: none;
  background: none;
  color: inherit;
  font-family: inherit;
  text-align: left;
  cursor: pointer;
}

/* 品牌标识用国旗：严格 3:2，圆角与描边保证在小尺寸下也清晰 */
.nav__flag {
  flex: none;
  display: block;
  width: 37px;
  height: 24.7px;
  border-radius: 4px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.22);
  box-shadow: 0 5px 14px rgba(217, 43, 58, 0.3);
}

.nav__brandtext {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.nav__title {
  font-family: var(--font-serif);
  font-size: 17px;
  font-weight: 700;
  letter-spacing: 0.06em;
  line-height: 1.2;
}

.nav__sub {
  font-size: 10.5px;
  color: var(--color-mist-500);
}

.nav__items {
  display: flex;
  align-items: center;
  gap: 2px;
  margin-left: auto;
  flex-wrap: wrap;
}

.nav__item {
  padding: 6px 14px;
  border: none;
  border-radius: 999px;
  background: transparent;
  color: var(--color-mist-300);
  font-family: inherit;
  font-size: 13.5px;
  letter-spacing: 0.02em;
  cursor: pointer;
  transition: background 0.16s ease, color 0.16s ease;
}

.nav__item:hover {
  color: #fff;
  background: rgba(255, 255, 255, 0.07);
}

.nav__item.is-on {
  color: #fff;
  background: linear-gradient(180deg, rgba(217, 43, 58, 0.95), rgba(150, 22, 34, 0.95));
}

.nav__side {
  margin-left: 8px;
  padding: 6px 13px;
  border-radius: 999px;
  border: 1px solid var(--panel-border);
  background: rgba(255, 255, 255, 0.05);
  color: var(--color-mist-300);
  font-family: inherit;
  font-size: 12px;
  cursor: pointer;
  transition: background 0.16s ease, color 0.16s ease;
}

.nav__side:hover {
  background: rgba(255, 255, 255, 0.11);
  color: #fff;
}

@media (max-width: 720px) {
  .nav {
    gap: 10px;
    padding: 9px 12px;
  }

  .nav__sub {
    display: none;
  }

  .nav__items {
    order: 3;
    width: 100%;
    margin-left: 0;
    justify-content: flex-start;
  }

  .nav__item {
    padding: 5px 11px;
    font-size: 12.5px;
  }

  .nav__side {
    margin-left: auto;
    padding: 5px 11px;
    font-size: 11.5px;
  }
}
</style>
