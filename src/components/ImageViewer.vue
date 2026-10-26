<script setup>
import { computed, nextTick, onBeforeUnmount, ref, useId, watch } from 'vue'

const props = defineProps({
  open: { type: Boolean, default: false },
  photos: { type: Array, default: () => [] },
  index: { type: Number, default: 0 },
  title: { type: String, default: '' }
})
const emit = defineEmits(['close', 'change'])

const headingId = `image-viewer-${useId()}`
const dialog = ref(null)
const closeButton = ref(null)
const stage = ref(null)
const currentIndex = computed(() => Math.max(0, Math.min(props.photos.length - 1, Math.trunc(props.index) || 0)))
const photo = computed(() => props.photos[currentIndex.value])
const caption = computed(() => photo.value?.title || props.title || '图片')
const loading = ref(Boolean(photo.value?.url))
const failed = ref(false)
const naturalWidth = ref(0)
const naturalHeight = ref(0)
const scale = ref(1)
const fitting = ref(true)
const retryCount = ref(0)
const viewport = ref({ width: 0, height: 0 })
const fitScale = computed(() => {
  if (!naturalWidth.value || !naturalHeight.value) return 1
  return Math.min(
    Math.max(1, viewport.value.width - 40) / naturalWidth.value,
    Math.max(1, viewport.value.height - 40) / naturalHeight.value,
    1
  )
})
const imageWidth = computed(() => Math.max(1, Math.round(naturalWidth.value * scale.value)))
const imageHeight = computed(() => Math.max(1, Math.round(naturalHeight.value * scale.value)))
const imageStyle = computed(() => ({ width: `${imageWidth.value}px`, height: `${imageHeight.value}px` }))
const unavailable = computed(() => loading.value || failed.value || !photo.value)

let returnFocus = null
let previousOverflow = ''
let active = false
let resizeObserver = null

function resetImage() {
  loading.value = Boolean(photo.value?.url)
  failed.value = false
  naturalWidth.value = 0
  naturalHeight.value = 0
  fitting.value = true
  scale.value = 1
  if (stage.value) stage.value.scrollTo(0, 0)
}

function updateViewport() {
  if (!stage.value) return
  viewport.value = { width: stage.value.clientWidth, height: stage.value.clientHeight }
  if (fitting.value && naturalWidth.value) scale.value = fitScale.value
}

function fitImage() {
  fitting.value = true
  updateViewport()
  scale.value = fitScale.value
  nextTick(() => stage.value?.scrollTo(0, 0))
}

function imageLoaded(event) {
  naturalWidth.value = event.target.naturalWidth
  naturalHeight.value = event.target.naturalHeight
  loading.value = false
  failed.value = false
  fitImage()
}

function imageFailed() {
  loading.value = false
  failed.value = true
}

function retryImage() {
  resetImage()
  retryCount.value += 1
}

function setScale(nextScale) {
  if (unavailable.value || !stage.value) return
  const pane = stage.value
  const centerX = (pane.scrollLeft + pane.clientWidth / 2) / pane.scrollWidth
  const centerY = (pane.scrollTop + pane.clientHeight / 2) / pane.scrollHeight
  fitting.value = false
  scale.value = Math.min(6, Math.max(Math.min(0.1, fitScale.value), nextScale))
  nextTick(() => {
    if (!stage.value) return
    stage.value.scrollLeft = stage.value.scrollWidth * centerX - stage.value.clientWidth / 2
    stage.value.scrollTop = stage.value.scrollHeight * centerY - stage.value.clientHeight / 2
  })
}

function changeImage(step) {
  if (props.photos.length < 2) return
  emit('change', (currentIndex.value + step + props.photos.length) % props.photos.length)
}

function trapFocus(event) {
  const items = [...(dialog.value?.querySelectorAll('button:not([disabled]), a[href], summary, input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])') || [])]
    .filter((item) => item.getClientRects().length > 0)
  const first = items[0]
  const last = items[items.length - 1]
  if (!first) {
    event.preventDefault()
    dialog.value?.focus()
  } else if (event.shiftKey && (document.activeElement === first || !dialog.value.contains(document.activeElement))) {
    event.preventDefault()
    last.focus()
  } else if (!event.shiftKey && (document.activeElement === last || !dialog.value.contains(document.activeElement))) {
    event.preventDefault()
    first.focus()
  }
}

function onKeydown(event) {
  if (!props.open) return
  if (event.key === 'Escape') {
    event.preventDefault()
    event.stopPropagation()
    emit('close')
    return
  }
  if (event.key === 'Tab') {
    event.stopPropagation()
    trapFocus(event)
    return
  }
  if (event.altKey || event.ctrlKey || event.metaKey || event.target?.closest?.('input, textarea, select, [contenteditable="true"]')) return
  if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
    event.preventDefault()
    event.stopPropagation()
    changeImage(event.key === 'ArrowLeft' ? -1 : 1)
  } else if (event.key === '+' || event.key === '=') {
    event.preventDefault()
    event.stopPropagation()
    setScale(scale.value * 1.25)
  } else if (event.key === '-') {
    event.preventDefault()
    event.stopPropagation()
    setScale(scale.value / 1.25)
  }
}

async function activate() {
  if (active) return
  active = true
  returnFocus = document.activeElement
  previousOverflow = document.body.style.overflow
  document.body.style.overflow = 'hidden'
  document.addEventListener('keydown', onKeydown, true)
  await nextTick()
  if (!props.open) return
  closeButton.value?.focus()
  if (stage.value) {
    resizeObserver = new ResizeObserver(updateViewport)
    resizeObserver.observe(stage.value)
    updateViewport()
  }
}

function deactivate() {
  if (!active) return
  active = false
  resizeObserver?.disconnect()
  resizeObserver = null
  document.removeEventListener('keydown', onKeydown, true)
  document.body.style.overflow = previousOverflow
  const target = returnFocus
  returnFocus = null
  nextTick(() => { if (target?.isConnected) target.focus({ preventScroll: true }) })
}

watch(() => [props.open, currentIndex.value, photo.value?.url], () => {
  if (props.open) resetImage()
}, { flush: 'sync' })
watch(() => props.open, (open) => { if (open) activate(); else deactivate() }, { immediate: true, flush: 'post' })
onBeforeUnmount(deactivate)
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="image-viewer-mask" @click.self="emit('close')">
      <section ref="dialog" class="image-viewer" role="dialog" aria-modal="true" :aria-labelledby="headingId" tabindex="-1">
        <header class="image-viewer__header">
          <div class="image-viewer__heading">
            <h2 :id="headingId">{{ caption }}</h2>
            <span v-if="photos.length" class="image-viewer__count" aria-live="polite">{{ currentIndex + 1 }} / {{ photos.length }}</span>
          </div>
          <button ref="closeButton" class="image-viewer__close" type="button" aria-label="关闭图片" @click="emit('close')">×</button>
          <div class="image-viewer__toolbar">
            <div v-if="photos.length > 1" class="image-viewer__group">
              <button type="button" aria-label="上一张图片" @click="changeImage(-1)">‹ 上一张</button>
              <button type="button" aria-label="下一张图片" @click="changeImage(1)">下一张 ›</button>
            </div>
            <div class="image-viewer__group">
              <button type="button" aria-label="缩小图片" :disabled="unavailable || scale <= Math.min(0.1, fitScale)" @click="setScale(scale / 1.25)">−</button>
              <span class="image-viewer__scale" aria-live="polite">{{ unavailable ? '—' : `${Math.round(scale * 100)}%` }}</span>
              <button type="button" aria-label="放大图片" :disabled="unavailable || scale >= 6" @click="setScale(scale * 1.25)">＋</button>
              <button type="button" :disabled="unavailable" @click="fitImage">适合窗口</button>
              <button type="button" :disabled="unavailable" @click="setScale(1)">原始大小</button>
            </div>
            <a v-if="photo?.url" class="image-viewer__original" :href="photo.url" target="_blank" rel="noopener noreferrer">打开原图 ↗</a>
          </div>
        </header>

        <div ref="stage" class="image-viewer__stage" :aria-busy="loading" tabindex="0" aria-label="图片区域，放大后可滚动查看">
          <div v-if="photo?.url && !failed" class="image-viewer__canvas" :style="imageStyle">
            <img
              :key="`${currentIndex}:${photo.url}:${retryCount}`"
              :src="photo.url"
              :alt="caption"
              :style="imageStyle"
              :class="{ 'image-viewer__image--loading': loading }"
              draggable="false"
              @load="imageLoaded"
              @error="imageFailed"
            />
          </div>
          <p v-if="loading" class="image-viewer__status" role="status">正在加载图片…</p>
          <div v-else-if="failed || !photo?.url" class="image-viewer__status" role="status">
            <p>{{ photo?.url ? '图片暂时无法加载' : '暂无可查看的图片' }}</p>
            <button v-if="photo?.url" type="button" @click="retryImage">重新加载</button>
          </div>
        </div>

        <footer class="image-viewer__footer">
          <p class="image-viewer__hint">放大后滚动查看细节 · 左右方向键切图 · Esc 关闭</p>
          <p v-if="photo?.sourceLabel || photo?.source" class="image-viewer__source">
            <a v-if="photo.source" :href="photo.source" target="_blank" rel="noopener noreferrer">{{ photo.sourceLabel || '图片出处' }} ↗</a>
            <span v-else>{{ photo.sourceLabel }}</span>
          </p>
          <slot />
        </footer>
      </section>
    </div>
  </Teleport>
</template>

<style scoped>
.image-viewer-mask { position: fixed; inset: 0; z-index: 200; display: grid; place-items: center; padding: 22px; background: rgb(0 0 0 / 86%); }
.image-viewer { display: grid; grid-template-rows: auto minmax(0, 1fr) auto; width: min(1560px, 100%); height: calc(100dvh - 44px); min-height: 0; overflow: hidden; color: #e9e4d8; background: #1e1b15; border: 1px solid #514b3d; border-radius: 4px; box-shadow: 0 16px 70px rgb(0 0 0 / 50%); }
.image-viewer__header { position: relative; padding: 16px 22px 12px; border-bottom: 1px solid #454032; }
.image-viewer__heading { display: flex; align-items: baseline; gap: 15px; padding-right: 44px; }
.image-viewer__heading h2 { margin: 0; font-family: var(--font-serif, serif); font-size: 19px; font-weight: 600; line-height: 1.5; }
.image-viewer__count { flex: none; color: #b2aa97; font-size: 12px; font-variant-numeric: tabular-nums; }
.image-viewer button, .image-viewer__original { min-height: 32px; padding: 5px 11px; color: #e5decd; background: #2c281f; border: 1px solid #514b3c; border-radius: 3px; font: inherit; font-size: 12px; line-height: 1.5; text-decoration: none; cursor: pointer; }
.image-viewer button:hover:not(:disabled), .image-viewer__original:hover { color: #fff4d0; background: #3c3527; border-color: #a18a52; }
.image-viewer button:disabled { opacity: .35; cursor: default; }
.image-viewer :focus-visible { outline: 2px solid #d3b770; outline-offset: 3px; }
.image-viewer .image-viewer__close { position: absolute; top: 12px; right: 15px; width: 36px; height: 36px; padding: 0; border: 0; background: transparent; color: #c8c0ae; font-size: 29px; line-height: 1; }
.image-viewer__toolbar { display: flex; flex-wrap: wrap; align-items: center; gap: 10px 20px; margin-top: 12px; }
.image-viewer__group { display: flex; align-items: center; gap: 6px; }
.image-viewer__scale { min-width: 48px; text-align: center; color: #c5bca7; font-size: 12px; font-variant-numeric: tabular-nums; }
.image-viewer__original { margin-left: auto; }
.image-viewer__stage { position: relative; min-height: 0; overflow: auto; overscroll-behavior: contain; background: #0e0d0b; scrollbar-color: #77705f #222019; scrollbar-width: auto; }
.image-viewer__canvas { display: grid; place-items: center; min-width: 100%; min-height: 100%; }
.image-viewer__canvas img { display: block; max-width: none; object-fit: contain; }
.image-viewer__image--loading { visibility: hidden; }
.image-viewer__status { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 14px; margin: 0; color: #bbb19a; font-size: 14px; }
.image-viewer__status p { margin: 0; }
.image-viewer__footer { max-height: 22vh; overflow: auto; padding: 11px 22px 14px; border-top: 1px solid #454032; font-size: 12px; line-height: 1.8; }
.image-viewer__hint { margin: 0; color: #a59c88; font-size: 11px; }
.image-viewer__source { margin: 5px 0 0; color: #c6bca6; }
.image-viewer__source a { color: #d1bd83; text-underline-offset: 3px; }
@media (max-height: 650px) { .image-viewer-mask { padding: 10px; } .image-viewer { height: calc(100dvh - 20px); } .image-viewer__header { padding-top: 9px; padding-bottom: 9px; } .image-viewer__toolbar { margin-top: 7px; } .image-viewer__footer { padding-top: 7px; padding-bottom: 7px; } }
</style>
