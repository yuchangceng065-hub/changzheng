<script setup>
import FlagCN from '../components/FlagCN.vue'

const emit = defineEmits(['navigate'])

/** 入口卡片。只用文字，靠层级与留白区分，不堆装饰元素。 */
const ENTRIES = [
  {
    id: 'armies',
    title: '部队介绍',
    desc: '四路红军的番号、出发地与终点、行程与兵力，以及各自的经过。'
  },
  {
    id: 'journey',
    title: '深度交互',
    desc: '选择一支部队，沿地图逐站推进，在每一个关键节点上亲历事件、查阅史实依据。'
  },
  {
    id: 'gallery',
    title: '长征图集',
    desc: '按事件编排的图集：出发、湘江、遵义、泸定桥、雪山草地与会师。'
  },
  {
    id: 'spirit',
    title: '长征精神',
    desc: '长征精神的权威概括，以及它在四路红军行军中的具体体现。'
  }
]

const FACTS = [
  { k: '1934.10 — 1936.10', v: '历时两年' },
  { k: '四路红军', v: '分途出征' },
  { k: '二万五千里', v: '中央红军行程' },
  { k: '十余省', v: '辗转征战' }
]
</script>

<template>
  <main class="home">
    <section class="home__hero">
      <p class="home__eyebrow">
        <span class="home__flag"><FlagCN /></span>
        <span>红军长征</span>
      </p>
      <h1 class="home__title serif">长征征途</h1>
      <p class="home__lede">
        1934 年 10 月至 1936 年 10 月，中国工农红军第一方面军、第二十五军、第二方面军、第四方面军
        先后从各自的根据地出发，纵横十余省，翻雪山、过草地，冲破重重围追堵截，最终在陕甘地区胜利会师。
      </p>
      <p class="home__lede home__lede--dim">
        这里按四支部队分别整理了他们走过的路线与经历的事件。你可以先看介绍，也可以直接进入地图，
        跟着行军路线一站一站走完。
      </p>

      <div class="home__facts">
        <div v-for="f in FACTS" :key="f.k" class="home__fact">
          <span class="home__fact-k">{{ f.k }}</span>
          <span class="home__fact-v">{{ f.v }}</span>
        </div>
      </div>
    </section>

    <section class="home__entries">
      <button
        v-for="e in ENTRIES"
        :key="e.id"
        class="entry"
        type="button"
        @click="emit('navigate', e.id)"
      >
        <span class="entry__title">{{ e.title }}</span>
        <span class="entry__desc">{{ e.desc }}</span>
        <span class="entry__go">前往</span>
      </button>
    </section>
  </main>
</template>

<style scoped>
.home {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 34px 24px 40px;
}

.home__hero {
  max-width: 880px;
  margin: 0 auto;
}

.home__eyebrow {
  display: flex;
  align-items: center;
  gap: 9px;
  margin: 0;
  font-size: 12px;
  letter-spacing: 0.32em;
  color: var(--color-gold-400);
}

/* 首页的小国旗：同样严格 3:2 */
.home__flag {
  display: block;
  width: 30px;
  height: 20px;
  border-radius: 3px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.home__title {
  margin: 10px 0 0;
  font-size: 46px;
  font-weight: 700;
  letter-spacing: 0.1em;
  line-height: 1.15;
}

.home__lede {
  margin: 18px 0 0;
  max-width: 760px;
  font-size: 14.5px;
  line-height: 2;
  color: #c8d5e2;
  text-align: justify;
}

.home__lede--dim {
  margin-top: 10px;
  color: var(--color-mist-500);
}

.home__facts {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1px;
  margin-top: 26px;
  border: 1px solid var(--panel-border);
  border-radius: var(--radius-md);
  overflow: hidden;
  background: var(--panel-border);
}

.home__fact {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 13px 15px;
  background: #120a0e;
}

.home__fact-k {
  font-size: 14px;
  font-weight: 700;
  color: #e8eef4;
  letter-spacing: 0.02em;
}

.home__fact-v {
  font-size: 11.5px;
  color: var(--color-mist-500);
}

.home__entries {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
  gap: 12px;
  max-width: 880px;
  margin: 32px auto 0;
}

.entry {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px 16px 40px;
  border-radius: var(--radius-md);
  border: 1px solid var(--panel-border);
  background: linear-gradient(160deg, rgba(255, 255, 255, 0.055), rgba(255, 255, 255, 0.015));
  color: inherit;
  font-family: inherit;
  text-align: left;
  cursor: pointer;
  transition: border-color 0.18s ease, transform 0.18s ease;
}

.entry:hover {
  border-color: rgba(217, 43, 58, 0.62);
  transform: translateY(-2px);
}

.entry__title {
  font-size: 16px;
  font-weight: 700;
  letter-spacing: 0.04em;
}

.entry__desc {
  font-size: 12.5px;
  line-height: 1.8;
  color: var(--color-mist-500);
}

.entry__go {
  position: absolute;
  left: 16px;
  bottom: 15px;
  font-size: 11.5px;
  color: var(--color-gold-300);
  letter-spacing: 0.06em;
}

@media (max-width: 720px) {
  .home {
    padding: 22px 14px 30px;
  }

  .home__title {
    font-size: 32px;
  }

  .home__lede {
    font-size: 13.5px;
  }
}
</style>
