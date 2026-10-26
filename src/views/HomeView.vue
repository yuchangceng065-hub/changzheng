<script setup>
import { ARMIES } from '../data/armies.js'
import EventArtwork from '../components/EventArtwork.vue'

const emit = defineEmits(['navigate', 'open-map', 'enter-army', 'enter-node', 'open-sources'])
const coverUrl = `${import.meta.env.BASE_URL}images/long-march-cover.png`
const chapters = [
  { armyId: 'red1', id: 'r1-xiangjiang', title: '湘江战役', description: '中央红军突破第四道封锁线，付出巨大牺牲，长征面临严峻考验。' },
  { armyId: 'red1', id: 'r1-zunyi', title: '遵义会议', description: '中共中央政治局召开扩大会议，成为党和红军历史上生死攸关的转折点。' },
  { armyId: 'red1', id: 'r1-chishui4', title: '四渡赤水', description: '红军在川黔滇边境灵活机动，穿插于重兵之间，逐步掌握战略主动。' },
  { armyId: 'red1', id: 'r1-luding', title: '飞夺泸定桥', description: '红军夺取泸定桥，打开北上川西北的通道。' },
  { armyId: 'red1', id: 'r1-wuqi', title: '中央红军到达陕北', description: '1935年10月，中央红军到达吴起镇，结束历时一年的长征。' },
  { armyId: 'red4', id: 'r4-huining', date: '1936年10月', title: '三大主力会师', description: '1936年10月，红军三大主力在会宁、将台堡等地会师，长征胜利结束。' }
].map(chapter => ({ ...chapter, node: ARMIES.find(army => army.id === chapter.armyId).nodes.find(node => node.id === chapter.id) }))

</script>

<template>
  <main class="home">
    <section class="hero section-wrap" aria-labelledby="home-title">
      <img class="hero__cover" :src="coverUrl" alt="雪山与山路间的红军行军队伍主题插画" width="2720" height="1437" fetchpriority="high" decoding="async" />
      <div class="hero__copy">
        <p class="hero__years">1934—1936</p>
        <h1 id="home-title" class="serif">长征征途</h1>
        <p class="hero__subtitle serif">四路红军长征纪事</p>
        <p class="hero__description">按部队梳理行军路线、战役与会议，<br />结合沿途旧址、历史影像和文献，了解长征的经过。</p>
        <div class="hero__actions">
          <button class="primary-action" type="button" @click="emit('open-map')">查看长征地图</button>
          <button class="text-action" type="button" @click="emit('navigate', 'armies')">部队介绍</button>
        </div>
      </div>

    </section>

    <section class="routes section-wrap" aria-labelledby="routes-title">
      <div class="section-heading"><h2 id="routes-title" class="serif">行军路线</h2><p>选择部队，查看沿途事件。</p></div>
      <div class="routes__grid">
        <button v-for="army in ARMIES" :key="army.id" class="route" type="button" @click="emit('enter-army', army.id)">
          <span class="route__head"><span class="route__name serif">{{ army.name }}</span><span class="route__count">{{ army.nodes.length }} 个节点</span></span>
          <span class="route__dates">{{ army.startDate }} — {{ army.endDate }}</span>
          <span class="route__places">{{ army.startPlace }} <span aria-hidden="true">→</span> {{ army.endPlace.split(/[；（]/)[0] }}</span>
          <span class="route__bottom"><span class="route__link">查看路线</span></span>
        </button>
      </div>
    </section>

    <section class="chapters section-wrap" aria-labelledby="chapters-title">
      <div class="section-heading"><h2 id="chapters-title" class="serif">重要事件</h2><button class="text-action" type="button" @click="emit('navigate', 'gallery')">查看全部图片</button></div>
      <div class="chapters__grid">
        <button v-for="chapter in chapters" :key="chapter.id" class="chapter" type="button" @click="emit('enter-node', { armyId: chapter.armyId, nodeId: chapter.id })">
          <EventArtwork :node="chapter.node" compact />
          <span class="chapter__body"><span class="chapter__date">{{ chapter.date || chapter.node.date }}</span><span class="chapter__title serif">{{ chapter.title }}</span><span class="chapter__description">{{ chapter.description }}</span><span class="chapter__link">阅读事件</span></span>
        </button>
      </div>
    </section>

    <section class="spirit-banner section-wrap" aria-labelledby="spirit-title">
      <div><h2 id="spirit-title" class="serif">长征精神</h2><p>理想信念、独立自主、团结奋斗与军民情深，贯穿长征的艰苦历程。</p></div>
      <button class="text-action" type="button" @click="emit('navigate', 'spirit')">阅读专题</button>
    </section>
    <footer class="home-footer section-wrap"><span>长征征途 · 历史资料与路线图</span><button class="text-action" type="button" @click="emit('open-sources')">资料来源</button></footer>
  </main>
</template>

<style scoped>
.home { flex: 1; min-width: 0; min-height: 0; overflow-y: auto; background: var(--color-ink-950); color: #dbc49d; }
.section-wrap { padding-inline: max(5%, calc((100% - 1180px) / 2)); }
.hero { position: relative; isolation: isolate; display: flex; align-items: center; min-height: clamp(480px, 52.83vw, 820px); padding-block: 56px; overflow: hidden; }
.hero__cover { position: absolute; inset: 0; z-index: -2; width: 100%; height: 100%; object-fit: cover; object-position: center; }
.hero::before { content: ''; position: absolute; inset: 0; z-index: -1; background: linear-gradient(90deg, rgba(9, 17, 16, .28), rgba(9, 17, 16, .12) 38%, transparent 64%); pointer-events: none; }
.hero__copy { width: 45%; max-width: 520px; }
.hero__years { margin: 0 0 24px; color: var(--color-gold-300); font: 15px Georgia, serif; letter-spacing: .06em; }
.hero h1 { margin: 0; color: #e66b52; font-size: clamp(54px, 5.5vw, 78px); line-height: 1.15; font-weight: 800; letter-spacing: .04em; text-shadow: 0 2px 14px #09111070; }
.hero__subtitle { margin: 18px 0 0; font-size: 24px; font-weight: 700; color: #dbc18c; }
.hero__description { margin: 24px 0; font-size: 14px; font-weight: 600; line-height: 1.95; color: #cdbd99; }
.hero__actions { display: flex; gap: 26px; align-items: center; }
.primary-action { border: 1px solid #a54834; border-radius: 3px; background: #913c2c; color: #f1d59c; font: inherit; font-weight: 700; font-size: 13px; padding: 12px 22px; cursor: pointer; }
.primary-action:hover { background: #a5523d; }
.text-action { border: 0; background: none; color: var(--color-gold-300); padding: 8px 0; font: inherit; font-size: 13px; cursor: pointer; text-underline-offset: 5px; }
.text-action:hover { text-decoration: underline; }
.section-heading { display: flex; align-items: baseline; justify-content: space-between; gap: 24px; margin-bottom: 24px; }
.section-heading h2, .spirit-banner h2 { margin: 0; color: #da785b; font-size: 27px; font-weight: 700; letter-spacing: .02em; }
.section-heading p { margin: 0; font-size: 13px; color: #766d5e; }
.routes { padding-block: 44px 48px; background: #e9e3d6; color: #302b22; }
.routes .section-heading h2 { color: #962e26; }
.routes__grid { display: grid; grid-template-columns: 1fr 1fr; column-gap: 40px; }
.route { display: flex; flex-direction: column; padding: 26px 0 23px; border: 0; border-top: 1px solid #c4b9a4; background: none; color: inherit; text-align: left; cursor: pointer; }
.route__head { display: flex; justify-content: space-between; gap: 15px; align-items: baseline; }
.route__name { color: #8e3329; font-size: 23px; font-weight: 700; }
.route__count { font-size: 11px; color: #766b5a; white-space: nowrap; }
.route__dates { margin-top: 12px; font-size: 12px; color: #766b5a; }
.route__places { margin-top: 8px; font-size: 14px; line-height: 1.7; }
.route__places > span { color: #9c8667; padding-inline: 8px; }
.route__bottom { display: flex; justify-content: space-between; gap: 20px; margin-top: 18px; color: #766b5a; font-size: 11px; line-height: 1.6; }
.route__link { color: #8f422f; white-space: nowrap; }
.route:hover .route__link { text-decoration: underline; text-underline-offset: 4px; }
.route:focus-visible { outline-color: #8f422f; }
.chapters { padding-block: 48px 52px; }
.chapters__grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 28px; }
.chapter { min-width: 0; padding: 0; border: 0; background: none; text-align: left; color: inherit; cursor: pointer; }
.chapter :deep(.artwork) { border-radius: 2px; border-color: var(--panel-border); }
.chapter__body { display: flex; flex-direction: column; padding-top: 15px; }
.chapter__date { color: var(--color-mist-600); font-size: 11px; }
.chapter__title { margin: 10px 0 12px; color: #d98062; font-size: 22px; font-weight: 700; }
.chapter__description { font-size: 13px; line-height: 1.9; color: var(--color-mist-500); }
.chapter__link { margin-top: 15px; font-size: 12px; color: var(--color-gold-300); }
.chapter:hover .chapter__link { text-decoration: underline; text-underline-offset: 4px; }
.spirit-banner { display: flex; align-items: center; justify-content: space-between; gap: 36px; padding-block: 34px; border-block: 1px solid var(--panel-border); }
.spirit-banner p { margin: 12px 0 0; font-size: 13px; line-height: 1.9; color: var(--color-mist-500); }
.spirit-banner .text-action { flex-shrink: 0; }
.home-footer { display: flex; align-items: center; justify-content: space-between; gap: 20px; padding-block: 22px; font-size: 11px; color: var(--color-mist-600); }
</style>
