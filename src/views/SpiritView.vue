<script setup>
import { onBeforeUnmount, ref } from 'vue'
import PartyEmblem from '../components/PartyEmblem.vue'
import { SPIRIT_VIDEO } from '../data/spiritVideo.js'

const emit = defineEmits(['video-state'])
const video = ref(null)
const videoError = ref(false)
const videoUrl = `${import.meta.env.BASE_URL}${SPIRIT_VIDEO.src}`
onBeforeUnmount(() => {
  video.value?.pause()
  emit('video-state', false)
})

const spirit = [
  { title: '坚定理想信念', text: '把全国人民和中华民族的根本利益看得高于一切，坚定革命的理想和信念，坚信正义事业必然胜利。', fact: '湘江战役后的转折、雪山草地中的相互扶持，体现了红军将士对革命理想的坚守。' },
  { title: '不怕牺牲，英勇奋斗', text: '为了救国救民，不怕任何艰难险阻，不惜付出一切牺牲。', fact: '湘江战役、飞夺泸定桥、突破腊子口，留下了红军将士浴血奋战的足迹。' },
  { title: '独立自主，实事求是', text: '坚持独立自主、实事求是，一切从实际出发。', fact: '遵义会议开启了独立自主解决中国革命实际问题的新阶段。四渡赤水、巧渡金沙江展现了立足实际、灵活机动的军事指挥。' },
  { title: '顾全大局，严守纪律', text: '顾全大局、严守纪律、紧密团结。', fact: '红军坚持北上方针，维护团结统一，促成三大主力会师。' },
  { title: '紧紧依靠人民', text: '紧紧依靠人民群众，同人民群众生死相依、患难与共、艰苦奋斗。', fact: '半条被子的故事、彝海结盟，记录了红军与人民群众的深厚情谊。' }
]
</script>

<template>
  <main class="spirit">
    <header class="spirit__head">
      <div class="spirit__masthead"><span class="spirit__emblem"><PartyEmblem /></span><h1 class="spirit__title serif">长征精神</h1></div>
      <p class="spirit__lede">长征途中，红军将士以坚定的信念和艰苦的奋斗，铸就了伟大长征精神。</p>
    </header>
    <section class="spirit__video" aria-labelledby="spirit-video-title">
      <h2 id="spirit-video-title" class="serif">{{ SPIRIT_VIDEO.title }}</h2>
      <p class="spirit__speaker">本期讲师：{{ SPIRIT_VIDEO.speaker }}</p>
      <video ref="video" class="spirit__player" :src="videoUrl" controls playsinline preload="metadata" aria-labelledby="spirit-video-title"
        @play="emit('video-state', true)" @pause="emit('video-state', false)" @ended="emit('video-state', false)"
        @error="videoError = true; emit('video-state', false)">
        当前浏览器不支持视频播放。
      </video>
      <p v-if="videoError" class="spirit__video-error" role="alert">视频暂时无法播放，请重新加载页面。</p>
      <p class="spirit__video-source">视频来源：<a :href="SPIRIT_VIDEO.source" target="_blank" rel="noopener noreferrer">{{ SPIRIT_VIDEO.publisher }} ↗</a></p>
      <p class="spirit__summary"><strong>内容提要：</strong>{{ SPIRIT_VIDEO.summary }}</p>
    </section>
    <ol class="spirit__list">
      <li v-for="(item, index) in spirit" :key="item.title" class="spirit__item">
        <span class="spirit__no">{{ String(index + 1).padStart(2, '0') }}</span>
        <div>
          <h2 class="spirit__heading serif">{{ item.title }}</h2>
          <p class="spirit__text">{{ item.text }}</p>
          <p class="spirit__fact">{{ item.fact }}</p>
        </div>
      </li>
    </ol>
    <section class="spirit__today">
      <h2 class="serif">走好新的长征路</h2>
      <p>长征精神激励着一代代人。今天，我们仍需坚定目标、尊重实际，在困难中承担责任，在合作中相互支持。</p>
    </section>
    <section class="spirit__sources">
      <h2 class="serif">参考资料</h2>
      <ul>
        <li><a href="https://www.qstheory.cn/20260601/94c99cb8be5246ebad8e076fa58fb065/c.html" target="_blank" rel="noopener noreferrer">《弘扬长征精神 奋进新时代新征程》</a><span>求是网 · 来源：青海日报 · 2026年6月1日</span></li>
        <li><a href="https://www.12371.cn/special/zgjs/czjs/" target="_blank" rel="noopener noreferrer">伟大长征精神专题</a><span>共产党员网 · 习近平在纪念红军长征胜利80周年大会上的讲话</span></li>
      </ul>
    </section>
  </main>
</template>

<style scoped>
.spirit { flex: 1; min-height: 0; overflow-y: auto; padding: var(--page-padding); }
.spirit__head, .spirit__video, .spirit__list, .spirit__today, .spirit__sources { max-width: var(--reading-width); margin-inline: auto; }
.spirit__video { margin-bottom: 36px; padding-top: 26px; border-top: 1px solid var(--panel-border); }
.spirit__video h2 { margin: 0; color: var(--color-gold-300); font-size: 23px; font-weight: 600; line-height: 1.6; }
.spirit__speaker { margin: 12px 0 20px; color: var(--color-mist-300); font-size: 14px; }
.spirit__player { display: block; width: 100%; aspect-ratio: 16 / 9; max-height: 65vh; background: #090b09; object-fit: contain; }
.spirit__video-source { margin: 12px 0 0; color: var(--color-mist-500); font-size: 12px; }
.spirit__summary { margin: 16px 0 0; color: var(--color-mist-300); font-size: 14px; line-height: 2; }
.spirit__summary strong { color: var(--color-mist-100); font-weight: 500; }
.spirit__video-error { color: #e6a190; font-size: 13px; }
.spirit__masthead { display: flex; align-items: center; gap: 18px; }
.spirit__emblem { display: grid; place-items: center; width: 44px; height: 44px; background: #a9342b; border-radius: 3px; }
.spirit__emblem :deep(img) { width: 32px; height: 32px; }
.spirit__title { margin: 0; font-size: var(--page-title-size); font-weight: 500; }
.spirit__lede { margin: 18px 0 34px; font-size: 14px; line-height: 1.95; color: var(--color-mist-500); }
.spirit__list { padding: 0; list-style: none; }
.spirit__item { display: grid; grid-template-columns: 36px minmax(0, 1fr); gap: 18px; padding: 26px 0; border-top: 1px solid var(--panel-border); }
.spirit__no { padding-top: 4px; font: 18px Georgia, serif; color: var(--color-mist-600); }
.spirit__heading { margin: 0 0 12px; font-size: 22px; font-weight: 500; }
.spirit__text { margin: 0; font-size: 16px; line-height: 1.9; }
.spirit__fact { margin: 13px 0 0; font-size: 13px; line-height: 1.95; color: var(--color-mist-500); }
.spirit__today, .spirit__sources { margin-top: 22px; padding-top: 24px; border-top: 1px solid var(--panel-border); }
.spirit__today h2, .spirit__sources h2 { margin: 0 0 14px; font-size: 21px; font-weight: 500; }
.spirit__today p { margin: 0; color: var(--color-mist-300); font-size: 14px; line-height: 2; }
.spirit__sources ul { margin: 0; padding-left: 18px; font-size: 12px; line-height: 2; }
.spirit__sources li { margin-bottom: 12px; }
.spirit__sources span { display: block; color: var(--color-mist-500); }
</style>
