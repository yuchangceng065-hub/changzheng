<script setup>
import PartyEmblem from '../components/PartyEmblem.vue'

/**
 * 长征精神的权威概括。
 * 说明：以下五条是对长征精神的通行概括，出处为纪念红军长征胜利六十周年大会上的讲话。
 * 作品不臆造引文；正式引用时请以正式出版的文献为准（见页面末尾的来源注记）。
 */
const SPIRIT = [
  {
    lead: '把全国人民和中华民族的根本利益看得高于一切',
    rest: '坚定革命的理想和信念，坚信正义事业必然胜利。',
    fact: '湘江战役后中央红军由 8.6 万余人锐减至 3 万余人，仍然继续北上，没有停下。'
  },
  {
    lead: '为了救国救民，不怕任何艰难险阻，不惜付出一切牺牲',
    rest: '',
    fact: '飞夺泸定桥 22 名突击队员攀踏铁索冲过火海；独树镇战斗中吴焕先手持大刀率部白刃突围。'
  },
  {
    lead: '坚持独立自主、实事求是，一切从实际出发',
    rest: '',
    fact: '遵义会议独立自主地总结第五次反“围剿”失败的经验教训，纠正军事上的错误。'
  },
  {
    lead: '顾全大局、严守纪律、紧密团结',
    rest: '',
    fact: '红四方面军广大指战员同张国焘的分裂主义错误作斗争，坚持北上方针，三过草地仍不散。'
  },
  {
    lead: '紧紧依靠人民群众，同人民群众生死相依、患难与共、艰苦奋斗',
    rest: '',
    fact: '彝海结盟使红军顺利通过彝区；巧渡金沙江时船工昼夜摆渡，7 天 7 夜送全军过江。'
  }
]

const SOURCES = [
  '《在纪念红军长征胜利六十周年大会上的讲话》——长征精神五条概括的出处。',
  '《中国共产党历史》第一卷（1921—1949），中共党史出版社。',
  '《中国工农红军长征史料丛书》，解放军出版社。'
]
</script>

<template>
  <main class="spirit">
    <header class="spirit__head">
      <!-- 党徽：金徽红底，与官方党徽的呈现方式一致 -->
      <span class="spirit__emblem"><PartyEmblem /></span>
      <h1 class="spirit__title serif">长征精神</h1>
      <p class="spirit__lede">
        长征留给后人的，不只是一条路线。它在极端艰难的条件下把一支队伍锤炼成型，
        也留下了一套被反复讲述的精神内涵。下面五条是对长征精神的通行概括，
        每一条后面都对应着四路红军真实走过的经历。
      </p>
    </header>

    <ol class="spirit__list">
      <li v-for="(s, i) in SPIRIT" :key="i" class="spirit__item">
        <span class="spirit__no">{{ i + 1 }}</span>
        <div class="spirit__body">
          <p class="spirit__text">
            <b>{{ s.lead }}</b>{{ s.rest ? '，' + s.rest : '' }}
          </p>
          <p class="spirit__fact">{{ s.fact }}</p>
        </div>
      </li>
    </ol>

    <section class="spirit__close">
      <h2 class="spirit__h2 serif">为什么今天还要讲长征</h2>
      <p class="spirit__p">
        长征的胜利，是方向和道路的胜利，也是意志和信念的胜利。四路红军出发时的处境各不相同，
        却都面对同一个问题：在看不到希望的时候，还走不走下去。他们的回答是继续走——
        翻过雪山、穿过草地、一次次从包围圈里冲出来，最终在陕甘会师。
      </p>
      <p class="spirit__p">
        今天已经不必再走那样的路，但“在困难面前不放弃、在分歧面前顾全大局、
        在群众中间找到力量”这几件事，仍然是需要一代代人重新回答的。
      </p>
    </section>

    <section class="spirit__sources">
      <h2 class="spirit__h2 serif">来源注记</h2>
      <ul>
        <li v-for="s in SOURCES" :key="s">{{ s }}</li>
      </ul>
      <p class="spirit__note">
        本页引文以正式出版的文献为准；作品不臆造引语与页码。完整来源清单见「资料来源与注记」。
      </p>
    </section>
  </main>
</template>

<style scoped>
.spirit {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 30px 24px 44px;
}

.spirit__head,
.spirit__list,
.spirit__close,
.spirit__sources {
  max-width: 860px;
  margin-left: auto;
  margin-right: auto;
}

/* 党徽：金徽红底，与官方党徽的呈现方式一致（红底圆角 + 金色图案） */
.spirit__emblem {
  display: grid;
  place-items: center;
  width: 56px;
  height: 56px;
  margin-bottom: 14px;
  border-radius: 12px;
  color: #f2c94c;
  background: linear-gradient(180deg, #c81f2c, #8f1622);
  box-shadow: 0 8px 20px rgba(200, 31, 44, 0.32);
}

.spirit__emblem :deep(svg) {
  width: 40px;
  height: 40px;
}

.spirit__title {
  margin: 0;
  font-size: 30px;
  font-weight: 700;
  letter-spacing: 0.08em;
}

.spirit__lede {
  margin: 14px 0 0;
  font-size: 14px;
  line-height: 2;
  color: #c8d5e2;
  text-align: justify;
}

.spirit__list {
  margin-top: 24px;
  padding: 0;
  list-style: none;
}

.spirit__item {
  position: relative;
  display: grid;
  grid-template-columns: 34px minmax(0, 1fr);
  gap: 12px;
  padding: 16px 0;
  border-top: 1px solid var(--panel-border);
}

.spirit__item:last-child {
  border-bottom: 1px solid var(--panel-border);
}

.spirit__no {
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 700;
  color: #1b1205;
  background: linear-gradient(180deg, var(--color-gold-300), var(--color-gold-400));
}

.spirit__text {
  margin: 0;
  font-size: 14.5px;
  line-height: 1.95;
  color: #e2eaf3;
}

.spirit__text b {
  font-weight: 700;
  color: #fff;
}

.spirit__fact {
  margin: 8px 0 0;
  padding-left: 11px;
  border-left: 2px solid rgba(217, 43, 58, 0.6);
  font-size: 12.5px;
  line-height: 1.9;
  color: var(--color-mist-500);
}

.spirit__close,
.spirit__sources {
  margin-top: 30px;
}

.spirit__h2 {
  margin: 0 0 10px;
  font-size: 19px;
  font-weight: 700;
  letter-spacing: 0.04em;
}

.spirit__p {
  margin: 0 0 10px;
  font-size: 13.5px;
  line-height: 2;
  color: #c8d5e2;
  text-align: justify;
}

.spirit__sources ul {
  margin: 0;
  padding-left: 18px;
  font-size: 12.5px;
  line-height: 1.9;
  color: var(--color-mist-500);
}

.spirit__note {
  margin: 12px 0 0;
  font-size: 11.5px;
  line-height: 1.8;
  color: var(--color-mist-600);
}

@media (max-width: 720px) {
  .spirit {
    padding: 20px 14px 30px;
  }

  .spirit__title {
    font-size: 24px;
  }
}
</style>
