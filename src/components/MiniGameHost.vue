<script setup>
import { computed } from 'vue'
import { getMiniGame, isImplemented, MINI_GAME_TYPES } from '../data/miniGames.js'

const props = defineProps({
  gameId: { type: String, required: true }
})

/**
 * 结果回传接口（已预留，当前无人调用）。
 * 玩法实现后调用：emit('finish', { passed: boolean, score: number })
 * 外部可据此给出行进加成、成就或史实小知识，本组件接口无需变更。
 */
const emit = defineEmits(['finish'])

const game = computed(() => getMiniGame(props.gameId))
const ready = computed(() => isImplemented(props.gameId))
const typeLabel = computed(() => (game.value && MINI_GAME_TYPES[game.value.type]) || '互动')
</script>

<template>
  <section v-if="game" class="minigame">
    <div class="minigame__head">
      <span class="minigame__badge">互动</span>
      <h4 class="minigame__title">{{ game.title }}</h4>
      <span class="tag">{{ typeLabel }}</span>
    </div>

    <p class="minigame__brief">{{ game.brief }}</p>

    <!-- 玩法实现位置：按 game.type 渲染，结束后 emit('finish', { passed, score }) -->
    <div v-if="ready" class="minigame__stage">
      <slot />
    </div>

    <div v-else class="minigame__pending">
      <button class="btn btn--sm" type="button" disabled>互动内容开发中</button>
      <span class="text-dim">接入点已预留 · {{ game.id }}</span>
    </div>
  </section>
</template>

<style scoped>
.minigame {
  padding: 12px 13px;
  border-radius: var(--radius-md);
  border: 1px dashed rgba(212, 175, 55, 0.42);
  background: rgba(212, 175, 55, 0.06);
}

.minigame__head {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.minigame__badge {
  padding: 1px 7px;
  border-radius: 999px;
  font-size: 10.5px;
  font-weight: 700;
  color: #1b1205;
  background: linear-gradient(180deg, var(--color-gold-300), var(--color-gold-400));
}

.minigame__title {
  margin: 0;
  font-size: 13px;
  font-weight: 700;
  color: #f0e2b8;
}

.minigame__brief {
  margin: 7px 0 0;
  font-size: 11.5px;
  line-height: 1.8;
  color: #d8c9a4;
}

.minigame__pending {
  display: flex;
  align-items: center;
  gap: 9px;
  flex-wrap: wrap;
  margin-top: 10px;
  font-size: 11px;
}

.minigame__stage {
  margin-top: 10px;
}
</style>
