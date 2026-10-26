<script setup>
import FlagCN from './FlagCN.vue'

defineProps({
  view: { type: String, default: 'home' },
  guestbookOpen: Boolean
})

const emit = defineEmits(['change', 'open-sources', 'open-guestbook'])

/** 顶部导航项。刻意不用图标：只用文字，避免堆砌装饰。 */
const ITEMS = [
  { id: 'home', label: '首页' },
  { id: 'armies', label: '部队介绍' },
  { id: 'journey', label: '探索地图' },
  { id: 'gallery', label: '长征图集' },
  { id: 'spirit', label: '长征精神' }
]
</script>

<template>
  <header class="nav" :class="{ 'nav--home': view === 'home' }">
    <button class="nav__brand" type="button" @click="emit('change', 'home')">
      <span class="nav__flag"><FlagCN /></span>
      <span class="nav__brandtext">
        <span class="nav__title">长征征途</span>
        <span class="nav__sub">红军长征资料</span>
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

    <div class="nav__tools">
      <button class="nav__side" :class="{ 'is-open': guestbookOpen }" type="button" :aria-expanded="guestbookOpen" aria-controls="guestbook-drawer" @click="emit('open-guestbook')">留言墙</button>
      <button class="nav__side" type="button" @click="emit('open-sources')">资料来源</button>
    </div>
  </header>
</template>

<style scoped>
.nav {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  gap: 28px;
  min-height: 72px;
  padding: 12px max(5%, calc((100% - 1180px) / 2));
  border-bottom: 1px solid rgba(204, 184, 143, 0.15);
  background: #171711;
  color: #e9e0cc;
  z-index: 30;
}
.nav__brand { display: flex; align-items: center; gap: 13px; padding: 0; border: 0; background: none; color: inherit; text-align: left; cursor: pointer; flex-shrink: 0; }
.nav__flag { display: block; width: 33px; height: 22px; flex: none; overflow: hidden; border-radius: 1px; }
.nav__brandtext { display: flex; flex-direction: column; gap: 5px; }
.nav__title { font-family: var(--font-serif); font-size: 22px; font-weight: 700; letter-spacing: 0.04em; line-height: 1.2; }
.nav--home .nav__title { color: #e16b52; font-weight: 800; }
.nav--home .nav__item.is-on { color: #e89570; font-weight: 700; }
.nav__sub { font-size: 10px; color: #a49b87; letter-spacing: 0.02em; }
.nav__items { display: flex; align-items: center; gap: 27px; margin-left: auto; }
.nav__item { position: relative; padding: 12px 0; border: 0; background: none; color: #b6af9e; font-size: 14px; letter-spacing: 0.05em; white-space: nowrap; cursor: pointer; transition: color 180ms; }
.nav__item::after { content: ''; position: absolute; bottom: 2px; left: 0; right: 0; height: 2px; background: #b74935; transform: scaleX(0); transition: transform 180ms; }
.nav__item:hover, .nav__item.is-on { color: #f1e7d1; }
.nav__item.is-on::after { transform: scaleX(1); }
.nav__tools { display: flex; align-items: center; gap: 18px; flex-shrink: 0; padding-left: 24px; border-left: 1px solid #cbb88933; }
.nav__side { padding: 8px 0; border: 0; background: none; color: #b7a47e; font-size: 12px; letter-spacing: 0.04em; white-space: nowrap; cursor: pointer; }
.nav__side:hover, .nav__side.is-open { color: #eed7a9; }
@media (max-width: 1100px) {
  .nav { gap: 20px; padding-inline: 32px; }
  .nav__items { gap: 20px; }
  .nav__tools { padding-left: 20px; gap: 14px; }
}
@media (max-width: 850px) {
  .nav { flex-wrap: wrap; gap: 12px; padding: 18px 24px 10px; }
  .nav__items { order: 3; width: 100%; margin: 0; justify-content: space-between; gap: 10px; }
  .nav__tools { margin-left: auto; }
}
</style>
