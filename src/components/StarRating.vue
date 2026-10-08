<script setup>
import { computed } from 'vue'
import { starCells, starLabel } from '../utils/stars.js'

const props = defineProps({
  stars: { type: Number, default: 0 },
  size: { type: String, default: 'md' }, // sm | md | lg
  showValue: { type: Boolean, default: false }
})

const cells = computed(() => starCells(props.stars))
const label = computed(() => starLabel(props.stars))
const valueText = computed(() =>
  Number.isInteger(props.stars) ? String(props.stars) : Number(props.stars).toFixed(1)
)
</script>

<template>
  <span class="stars" :class="`stars--${size}`" role="img" :aria-label="label">
    <span v-for="(cell, i) in cells" :key="i" class="stars__cell" aria-hidden="true">
      <span class="stars__base">★</span>
      <span
        v-if="cell !== 'empty'"
        class="stars__clip"
        :style="{ width: cell === 'half' ? '50%' : '100%' }"
      >
        <span class="stars__fill">★</span>
      </span>
    </span>
    <span v-if="showValue" class="stars__value">{{ valueText }}</span>
  </span>
</template>

<style scoped>
.stars__value {
  margin-left: 6px;
  font-size: 0.72em;
  color: var(--color-gold-300);
  letter-spacing: 0.04em;
}
</style>
