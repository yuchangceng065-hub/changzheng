<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { photosFor, ensureArtworkManifest } from '../data/photoSource.js'
import ImageViewer from './ImageViewer.vue'

const props = defineProps({
  node: { type: Object, required: true },
  compact: { type: Boolean, default: false }
})
const images = computed(() => photosFor(props.node))
const imageIndex = ref(0)
const viewerOpen = ref(false)
const failed = ref(false)
const photo = computed(() => images.value[imageIndex.value])
watch(() => props.node.id, () => { imageIndex.value = 0; viewerOpen.value = false })
watch(() => photo.value?.url, () => { failed.value = false })
function changeImage(step) {
  imageIndex.value = (imageIndex.value + step + images.value.length) % images.value.length
}
onMounted(ensureArtworkManifest)
</script>

<template>
  <figure v-if="photo" class="artwork" :class="{ 'artwork--compact': compact }">
    <template v-if="compact">
      <img v-if="!failed" class="artwork__photo" :src="photo.url" :alt="photo.title || node.name" loading="lazy" @error="failed = true" />
      <p v-else class="artwork__error">图片暂时无法加载</p>
    </template>
    <button v-else class="artwork__open" type="button" :aria-label="`放大查看：${photo.title || node.name}`" @click="viewerOpen = true">
      <img v-if="!failed" class="artwork__photo" :src="photo.url" :alt="photo.title || node.name" loading="lazy" @error="failed = true" />
      <span v-else class="artwork__error">图片暂时无法加载，点击重试查看</span>
      <span class="artwork__zoom-hint">点击放大</span>
    </button>
    <template v-if="!compact">
      <div class="artwork__controls">
        <template v-if="images.length > 1">
          <button class="btn btn--ghost btn--sm" type="button" aria-label="上一张图片" @click="changeImage(-1)">‹</button>
          <span aria-live="polite">{{ imageIndex + 1 }} / {{ images.length }}</span>
          <button class="btn btn--ghost btn--sm" type="button" aria-label="下一张图片" @click="changeImage(1)">›</button>
        </template>
        <button class="artwork__view" type="button" @click="viewerOpen = true">放大查看</button>
      </div>
      <figcaption class="artwork__caption">
        <span class="artwork__title">{{ photo.title || node.name }}</span>
        <a v-if="photo.sourceLabel && photo.source" class="artwork__source" :href="photo.source" target="_blank" rel="noopener noreferrer">{{ photo.sourceLabel }}</a>
        <span v-else-if="photo.sourceLabel" class="artwork__source">{{ photo.sourceLabel }}</span>
        <a v-else-if="photo.source" class="artwork__source" :href="photo.source" target="_blank" rel="noopener noreferrer">图片出处</a>
      </figcaption>
    </template>
    <ImageViewer v-if="!compact" :open="viewerOpen" :photos="images" :index="imageIndex" :title="node.name" @close="viewerOpen = false" @change="imageIndex = $event" />
  </figure>
</template>

<style scoped>
.artwork { width: 100%; margin: 0; overflow: hidden; border: 1px solid var(--panel-border); border-radius: 3px; background: #16130f; }
.artwork__photo { display: block; width: 100%; height: clamp(190px, 30vh, 360px); object-fit: contain; }
.artwork__open { position: relative; display: block; width: 100%; margin: 0; padding: 0; color: inherit; background: transparent; border: 0; cursor: zoom-in; }
.artwork__open:focus-visible { outline: 2px solid var(--color-gold-300); outline-offset: -3px; }
.artwork__zoom-hint { position: absolute; right: 10px; bottom: 10px; padding: 3px 7px; color: #e8ddc3; background: rgb(18 16 12 / 80%); border: 1px solid rgb(218 195 145 / 30%); border-radius: 2px; font-size: 11px; opacity: .8; }
.artwork__open:hover .artwork__zoom-hint { opacity: 1; }
.artwork--compact { border: 0; border-radius: 0; }
.artwork--compact .artwork__photo { height: auto; aspect-ratio: 16 / 10; }
.artwork__controls { display: flex; align-items: center; gap: 9px; padding: 7px 10px; color: var(--color-mist-500); font-size: 11px; }
.artwork__view { margin-left: auto; padding: 3px 0; font: inherit; font-size: 11px; color: var(--color-gold-300); background: transparent; border: 0; cursor: pointer; text-decoration: underline; text-underline-offset: 3px; }
.artwork__caption { display: flex; flex-direction: column; gap: 4px; padding: 8px 11px 12px; font-size: 12px; line-height: 1.8; border-top: 1px solid var(--panel-border); }
.artwork__title { color: var(--color-gold-300); }
.artwork__source { color: var(--color-mist-100); font-size: 11px; }
.artwork__error { display: block; padding: 50px 12px; text-align: center; font-size: 12px; color: var(--color-mist-500); }
</style>
