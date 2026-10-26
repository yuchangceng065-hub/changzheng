<script setup>
import { nextTick, ref, watch } from 'vue'
import { SOURCES } from '../data/sources.js'
import { MUSIC } from '../data/music.js'
import { SPIRIT_VIDEO } from '../data/spiritVideo.js'
const props = defineProps({ open: Boolean, baseMap: Object })
const emit = defineEmits(['close'])
const books = SOURCES.filter(source => !source.url)
const websites = SOURCES.filter(source => source.url)
const spiritSources = [
  { title: '弘扬长征精神 奋进新时代新征程', publisher: '求是网 · 青海日报 · 2026年6月1日', url: 'https://www.qstheory.cn/20260601/94c99cb8be5246ebad8e076fa58fb065/c.html' },
  { title: '伟大长征精神', publisher: '共产党员网', url: 'https://www.12371.cn/special/zgjs/czjs/' }
]
const closeButton = ref(null)
let opener
watch(() => props.open, async open => {
  if (open) {
    opener = document.activeElement
    await nextTick()
    closeButton.value?.focus()
  } else opener?.focus()
})
function trapFocus(event) {
  if (event.key !== 'Tab') return
  const controls = event.currentTarget.querySelectorAll('button, a[href]')
  const first = controls[0], last = controls[controls.length - 1]
  if (event.shiftKey && event.target === first) { event.preventDefault(); last.focus() }
  else if (!event.shiftKey && event.target === last) { event.preventDefault(); first.focus() }
}
</script>

<template>
  <template v-if="open">
    <div class="drawer-mask" @click="emit('close')" />
    <aside class="drawer" role="dialog" aria-modal="true" aria-labelledby="sources-title" @keydown="trapFocus">
      <header class="flex items-start justify-between gap-3 px-5 py-4">
        <h2 id="sources-title" class="serif text-xl">参考资料</h2>
        <button ref="closeButton" class="btn btn--ghost btn--sm" type="button" aria-label="关闭参考资料" @click="emit('close')">✕</button>
      </header>
      <div class="drawer__body scroll-area">
        <section>
          <h3 class="panel-title mb-2">纸质文献</h3>
          <div v-for="source in books" :key="source.id" class="source-item">
            <p class="source-title">{{ source.title }}</p>
            <p v-if="source.publisher" class="source-meta">{{ source.publisher }}</p>
          </div>
        </section>
        <section class="mt-5">
          <h3 class="panel-title mb-2">党史网站</h3>
          <a v-for="source in websites" :key="source.id" class="source-item source-link" :href="source.url" target="_blank" rel="noopener noreferrer">
            <span class="source-title">{{ source.title }}</span>
            <span class="source-meta">访问网站 <span aria-hidden="true">↗</span></span>
          </a>
        </section>
        <section class="mt-5">
          <h3 class="panel-title mb-2">长征精神</h3>
          <a v-for="source in spiritSources" :key="source.url" class="source-item source-link" :href="source.url" target="_blank" rel="noopener noreferrer">
            <span class="source-title">{{ source.title }} <span class="source-arrow" aria-hidden="true">↗</span></span>
            <span class="source-meta">{{ source.publisher }}</span>
          </a>
        </section>
        <section v-if="baseMap?.sources" class="mt-5">
          <h3 class="panel-title mb-2">地图</h3>
          <p v-if="baseMap.sources.sourceOnlineMapReviewNumber" class="source-title">天地图在线底图审图号：{{ baseMap.sources.sourceOnlineMapReviewNumber }}</p>
          <p class="source-meta">{{ baseMap.sources.sourceOnlineMapReviewScope }}</p>
          <p class="source-meta">{{ baseMap.sources.reviewStatus }}</p>
          <a v-if="baseMap.sources.sourceDocumentation" class="source-item source-link" :href="baseMap.sources.sourceDocumentation" target="_blank" rel="noopener noreferrer">
            <span class="source-title">底图官方来源说明 <span class="source-arrow" aria-hidden="true">↗</span></span>
            <span class="source-meta">{{ baseMap.sources.sourceNotice }}</span>
          </a>
          <a v-for="source in [baseMap.sources, baseMap.sources.terrain, baseMap.sources.coordinates].filter(Boolean)" :key="source.url" class="source-item source-link" :href="source.url" target="_blank" rel="noopener noreferrer">
            <span class="source-title">{{ source.title }} <span class="source-arrow" aria-hidden="true">↗</span></span>
            <span class="source-meta">{{ source.publisher }}<span v-if="source.license"> · {{ source.license }}</span></span>
          </a>
        </section>
        <section v-if="MUSIC.src" class="mt-5">
          <h3 class="panel-title mb-2">背景音乐</h3>
          <p class="source-title">{{ MUSIC.title }} · {{ MUSIC.artist }}</p>
          <p class="source-meta">{{ MUSIC.sourceLabel }}</p>
        </section>
        <section class="mt-5">
          <h3 class="panel-title mb-2">长征精神视频</h3>
          <a class="source-item source-link" :href="SPIRIT_VIDEO.source" target="_blank" rel="noopener noreferrer">
            <span class="source-title">{{ SPIRIT_VIDEO.title }} ↗</span>
            <span class="source-meta">本期讲师：{{ SPIRIT_VIDEO.speaker }}</span>
            <span class="source-meta">{{ SPIRIT_VIDEO.publisher }} · {{ SPIRIT_VIDEO.fileProvider }}</span>
          </a>
        </section>
      </div>
    </aside>
  </template>
</template>

<style scoped>
.source-title { display: block; margin: 0; font-size: 13px; line-height: 1.8; }
.source-meta { display: block; margin: 5px 0 0; color: var(--color-mist-500); font-size: 12px; line-height: 1.8; }
.source-link { display: block; color: var(--color-mist-100); text-decoration: none; }
.source-link:hover .source-title { color: var(--color-gold-300); text-decoration: underline; text-underline-offset: 4px; }
.source-arrow { margin-left: 4px; color: var(--color-gold-300); font-size: 12px; }
.source-review { display: block; margin-top: 7px; color: var(--color-gold-300); font-size: 12px; }
</style>
