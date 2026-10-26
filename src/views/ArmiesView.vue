<script setup>
import { ARMIES } from '../data/armies.js'

const emit = defineEmits(['enter-army'])
</script>

<template>
  <main class="armies">
    <header class="armies__head">
      <h1 class="armies__title serif">四路红军</h1>
      <p class="armies__lede">
        四支红军主力从不同根据地出发，经过艰苦转战，先后完成长征。
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
        <span class="army__count">{{ army.nodes.length }} 个历史节点</span>
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
          <span class="army__v">{{ army.duration.replace(/^历时/, '') }}</span>
        </div>
        <div class="army__fact">
          <span class="army__k">行程</span>
          <span class="army__v">{{ army.totalDistance.replace(/^行程/, '') }}</span>
        </div>
        <div class="army__fact">
          <span class="army__k">兵力</span>
          <span class="army__v">{{ army.strength }}</span>
        </div>
        <div class="army__fact">
          <span class="army__k">途经</span>
          <span class="army__v">{{ army.provinces.replace(/^(途经|转战)/, '') }}</span>
        </div>
      </div>

      <p class="army__summary">{{ army.summary }}</p>

      <p class="army__highlights"><span>主要事件</span>{{ army.highlights.join('、') }}</p>

      <div class="army__foot">
        <button class="btn" type="button" @click="emit('enter-army', army.id)">
          查看行军路线
        </button>
      </div>
    </article>
  </main>
</template>

<style scoped>
.armies { flex: 1; min-height: 0; overflow-y: auto; padding: var(--page-padding); }
.armies__head, .army { max-width: var(--reading-width); margin-inline: auto; }
.armies__title { margin: 0; font-size: var(--page-title-size); font-weight: 500; letter-spacing: .02em; }
.armies__lede { margin: 16px 0 34px; max-width: none; text-wrap: pretty; font-size: 14px; line-height: 1.95; color: var(--color-mist-500); }
.army { padding: 30px 0 34px; border-top: 1px solid var(--panel-border); }
.army__head { display: flex; align-items: baseline; gap: 15px; flex-wrap: wrap; }
.army__name { margin: 0; font-size: 25px; font-weight: 500; }
.army__count { margin-left: auto; font-size: 12px; color: var(--color-mist-600); }
.army__banner { width: 100%; color: var(--color-mist-600); font-size: 12px; line-height: 1.8; }
.army__facts { display: grid; grid-template-columns: 1fr 1fr; gap: 0 30px; margin-top: 20px; }
.army__fact { display: flex; align-items: baseline; gap: 18px; padding: 10px 0; border-bottom: 1px solid var(--panel-border); font-size: 13px; line-height: 1.85; }
.army__fact:nth-last-child(-n+2) { grid-column: 1 / -1; }
.army__k { flex: 0 0 28px; color: var(--color-mist-600); }
.army__v { color: var(--color-mist-300); }
.army__summary { margin: 24px 0 0; font-size: 14px; line-height: 2; color: var(--color-mist-300); }
.army__highlights { display: flex; align-items: baseline; gap: 18px; margin: 18px 0 0; font-size: 12px; line-height: 1.9; color: var(--color-mist-500); }
.army__highlights > span { color: var(--color-mist-600); white-space: nowrap; }
.army__foot { margin-top: 22px; }
</style>
