<script setup>
import { ARMIES } from '../data/armies.js'

const emit = defineEmits(['enter-army'])
</script>

<template>
  <main class="armies">
    <header class="armies__head">
      <h1 class="armies__title serif">四路红军</h1>
      <p class="armies__lede">
        长征不是一支队伍的行程。红一方面军、红二十五军、红二方面军、红四方面军从不同根据地出发，
        走的是四条不同的路线，起点、终点、时间与遭遇都不相同。以下按部队分别说明。
      </p>
    </header>

    <article
      v-for="army in ARMIES"
      :key="army.id"
      class="army"
      :style="{ '--army-color': army.color }"
    >
      <div class="army__head">
        <h2 class="army__name serif">{{ army.name }}</h2>
        <span class="army__alias">{{ army.alias }}</span>
        <span class="army__banner">{{ army.banner }}</span>
      </div>

      <div class="army__facts">
        <div class="army__fact">
          <span class="army__k">出发</span>
          <span class="army__v">{{ army.startPlace }}，{{ army.startDate }}</span>
        </div>
        <div class="army__fact">
          <span class="army__k">到达</span>
          <span class="army__v">{{ army.endPlace }}，{{ army.endDate }}</span>
        </div>
        <div class="army__fact">
          <span class="army__k">历时</span>
          <span class="army__v">{{ army.duration }}</span>
        </div>
        <div class="army__fact">
          <span class="army__k">行程</span>
          <span class="army__v">{{ army.totalDistance }}</span>
        </div>
        <div class="army__fact">
          <span class="army__k">兵力</span>
          <span class="army__v">{{ army.strength }}</span>
        </div>
        <div class="army__fact">
          <span class="army__k">途经</span>
          <span class="army__v">{{ army.provinces }}</span>
        </div>
      </div>

      <p class="army__summary">{{ army.summary }}</p>

      <div class="army__tags">
        <span v-for="h in army.highlights" :key="h" class="army__tag">{{ h }}</span>
        <span class="army__count">共 {{ army.nodes.length }} 个历史节点</span>
      </div>

      <div class="army__foot">
        <button class="btn btn--primary" type="button" @click="emit('enter-army', army.id)">
          进入这支部队的地图
        </button>
        <span class="army__source">史实依据见「资料来源与注记」</span>
      </div>
    </article>
  </main>
</template>

<style scoped>
.armies {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 30px 24px 44px;
}

.armies__head,
.army {
  max-width: 900px;
  margin: 0 auto;
}

.armies__title {
  margin: 0;
  font-size: 30px;
  font-weight: 700;
  letter-spacing: 0.08em;
}

.armies__lede {
  margin: 14px 0 0;
  font-size: 14px;
  line-height: 2;
  color: #c8d5e2;
  text-align: justify;
}

.army {
  position: relative;
  margin-top: 26px;
  padding: 18px 20px 18px 22px;
  border-radius: var(--radius-lg);
  border: 1px solid var(--panel-border);
  background: var(--panel-bg);
  overflow: hidden;
}

/* 左侧部队主题色竖条 */
.army::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  background: var(--army-color, #d92b3a);
}

.army__head {
  display: flex;
  align-items: baseline;
  gap: 10px;
  flex-wrap: wrap;
}

.army__name {
  margin: 0;
  font-size: 21px;
  font-weight: 700;
  letter-spacing: 0.04em;
}

.army__alias {
  font-size: 12.5px;
  color: var(--army-color, #d92b3a);
}

.army__banner {
  width: 100%;
  font-size: 11.5px;
  color: var(--color-mist-600);
}

.army__facts {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
  gap: 1px;
  margin-top: 14px;
  border: 1px solid var(--panel-border);
  border-radius: var(--radius-sm);
  overflow: hidden;
  background: var(--panel-border);
}

.army__fact {
  display: flex;
  gap: 8px;
  padding: 9px 11px;
  background: #120a0e;
  font-size: 12.5px;
  line-height: 1.6;
}

.army__k {
  flex: none;
  color: var(--color-mist-600);
}

.army__v {
  color: #dbe5ef;
}

.army__summary {
  margin: 14px 0 0;
  font-size: 13.5px;
  line-height: 2;
  color: #c8d5e2;
  text-align: justify;
}

.army__tags {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  margin-top: 13px;
}

.army__tag {
  padding: 3px 9px;
  border-radius: 999px;
  border: 1px solid var(--panel-border);
  background: rgba(255, 255, 255, 0.04);
  font-size: 11.5px;
  color: var(--color-mist-300);
}

.army__count {
  margin-left: 2px;
  font-size: 11.5px;
  color: var(--color-mist-600);
}

.army__foot {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  margin-top: 16px;
  padding-top: 14px;
  border-top: 1px dashed rgba(180, 152, 158, 0.22);
}

.army__source {
  font-size: 11.5px;
  color: var(--color-mist-600);
}

@media (max-width: 720px) {
  .armies {
    padding: 20px 14px 30px;
  }

  .armies__title {
    font-size: 24px;
  }
}
</style>
