<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useId, watch } from 'vue'
import { MUSIC } from '../data/music.js'

const props = defineProps({ videoPlaying: Boolean })

const panelId = `music-player-${useId()}`
const widget = ref(null)
const toggleButton = ref(null)
const audio = ref(null)
const expanded = ref(false)
const audioUrl = ref(MUSIC.src ? new URL(MUSIC.src, document.baseURI).href : '')
const trackName = ref(`${MUSIC.title} · ${MUSIC.artist}`)
const playing = ref(false)
const pending = ref(false)
const volume = ref(0.10)
const currentTime = ref(0)
const duration = ref(0)
const scrubbing = ref(false)
const progress = computed(() => duration.value ? Math.min(100, currentTime.value / duration.value * 100) : 0)
const fileError = ref(false)
const errorMessage = ref('')
const position = ref(null)
const dragging = ref(false)
const controlsOnRight = computed(() => position.value && position.value.x < 316)
const widgetStyle = computed(() => position.value ? { left: `${position.value.x}px`, top: `${position.value.y}px`, right: 'auto', bottom: 'auto' } : {})
let playbackRequest = 0
let awaitingInteraction = false
let dragOrigin = null
let suppressClick = false

const canPlay = computed(() => Boolean(audioUrl.value) && !fileError.value && !props.videoPlaying)
const canSeek = computed(() => Boolean(audioUrl.value) && Number.isFinite(duration.value) && duration.value > 0 && !fileError.value)

function formatTime(value) {
  if (!Number.isFinite(value) || value < 0) return '—:—'
  const seconds = Math.floor(value)
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const remainder = String(seconds % 60).padStart(2, '0')
  return hours ? `${hours}:${String(minutes).padStart(2, '0')}:${remainder}` : `${minutes}:${remainder}`
}

function pause() {
  playbackRequest += 1
  pending.value = false
  audio.value?.pause()
  playing.value = false
}

function releaseTrack() {
  pause()
  audioUrl.value = ''
  if (audio.value) {
    audio.value.removeAttribute('src')
    audio.value.load()
  }
  trackName.value = ''
  currentTime.value = 0
  duration.value = 0
  fileError.value = false
  errorMessage.value = ''
}

async function startPlayback(automatic = false) {
  if (!audioUrl.value) return
  if (!canPlay.value || !audio.value) return
  errorMessage.value = ''
  const request = ++playbackRequest
  const player = audio.value
  pending.value = true
  try {
    player.volume = volume.value
    await player.play()
    if (request !== playbackRequest) return
    if (props.videoPlaying) { pause(); return }
    playing.value = !player.paused
    awaitingInteraction = false
  } catch (error) {
    if (request !== playbackRequest) return
    playing.value = false
    if (automatic && error?.name === 'NotAllowedError') {
      awaitingInteraction = true
    } else if (!fileError.value) {
      errorMessage.value = error?.name === 'NotAllowedError'
        ? '浏览器暂未允许播放，请再点击一次播放。'
        : '音频未能播放，请点击重试。'
    }
  } finally {
    if (request === playbackRequest) pending.value = false
  }
}

function togglePlayback(event) {
  if (suppressClick && event.detail !== 0) { suppressClick = false; return }
  suppressClick = false
  awaitingInteraction = false
  if (playing.value || pending.value) pause()
  else startPlayback()
}

function onFirstInteraction(event) {
  if (!awaitingInteraction || !event.isTrusted || widget.value?.contains(event.target)) return
  if (event.type === 'keydown' && !['Enter', ' '].includes(event.key)) return
  if (event.target?.closest('video')) { awaitingInteraction = false; return }
  if (props.videoPlaying) return
  awaitingInteraction = false
  startPlayback(true)
}

function clampPosition(x, y) {
  return { x: Math.max(8, Math.min(window.innerWidth - 72, x)), y: Math.max(8, Math.min(window.innerHeight - 72, y)) }
}

function onResize() {
  if (position.value) position.value = clampPosition(position.value.x, position.value.y)
}

function startDrag(event) {
  if (event.button !== 0) return
  suppressClick = false
  const rect = widget.value.getBoundingClientRect()
  dragOrigin = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, left: rect.left, top: rect.top }
  event.currentTarget.setPointerCapture(event.pointerId)
}

function moveDrag(event) {
  if (!dragOrigin || event.pointerId !== dragOrigin.pointerId) return
  const dx = event.clientX - dragOrigin.x
  const dy = event.clientY - dragOrigin.y
  if (!dragging.value && Math.hypot(dx, dy) < 6) return
  dragging.value = true
  expanded.value = false
  position.value = clampPosition(dragOrigin.left + dx, dragOrigin.top + dy)
}

function endDrag(event) {
  if (!dragOrigin || event.pointerId !== dragOrigin.pointerId) return
  suppressClick = dragging.value || event.type === 'pointercancel'
  dragging.value = false
  dragOrigin = null
  if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
}

function lostDragCapture() {
  if (dragOrigin) { suppressClick = dragging.value; dragging.value = false; dragOrigin = null }
}

function updateMetadata() {
  const value = audio.value?.duration
  duration.value = Number.isFinite(value) && value > 0 ? value : 0
}

function updateTime() {
  const value = audio.value?.currentTime
  currentTime.value = Number.isFinite(value) ? value : 0
}

function onPlaying() {
  if (props.videoPlaying) { pause(); return }
  playing.value = true
  pending.value = false
}

watch(() => props.videoPlaying, active => { if (active) { awaitingInteraction = false; pause() } }, { flush: 'sync' })

function onAudioError() {
  if (!audioUrl.value || !audio.value?.error) return
  pause()
  fileError.value = true
  errorMessage.value = '音乐暂时无法播放，请检查音频文件。'
}

function seek(event) {
  if (!canSeek.value || !audio.value) return
  const value = Math.min(duration.value, Math.max(0, Number(event.target.value)))
  if (!Number.isFinite(value)) return
  try {
    audio.value.currentTime = value
    currentTime.value = value
  } catch {
    errorMessage.value = '暂时无法跳转，请等待音频加载后重试。'
  }
}

function changeVolume(event) {
  volume.value = Math.min(1, Math.max(0, Number(event.target.value)))
  if (audio.value) audio.value.volume = volume.value
}

function closePanel() {
  const returnFocus = widget.value?.contains(document.activeElement)
  expanded.value = false
  if (returnFocus) nextTick(() => toggleButton.value?.focus({ preventScroll: true }))
}

function onKeydown(event) {
  if (!expanded.value || event.key !== 'Escape' || event.defaultPrevented) return
  // 资料抽屉和图片层的关闭键优先交给它们处理。
  if (document.activeElement?.closest('[aria-modal="true"]')) return
  event.preventDefault()
  event.stopPropagation()
  closePanel()
}

function onOutsidePointer(event) {
  if (expanded.value && !widget.value?.contains(event.target)) expanded.value = false
}


onMounted(() => {
  if (audio.value) audio.value.volume = volume.value
  position.value = clampPosition(window.innerWidth - 87, window.innerHeight * 0.5 - 32)
  document.addEventListener('keydown', onKeydown)
  document.addEventListener('pointerdown', onOutsidePointer)
  document.addEventListener('click', onFirstInteraction)
  document.addEventListener('keydown', onFirstInteraction)
  window.addEventListener('resize', onResize)
  startPlayback(true)
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKeydown)
  document.removeEventListener('pointerdown', onOutsidePointer)
  document.removeEventListener('click', onFirstInteraction)
  document.removeEventListener('keydown', onFirstInteraction)
  window.removeEventListener('resize', onResize)
  awaitingInteraction = false
  releaseTrack()
})
function seekRing(event) {
  if (!canSeek.value || !audio.value) return
  const rect = event.currentTarget.getBoundingClientRect()
  const angle = (Math.atan2(event.clientY - rect.top - rect.height / 2, event.clientX - rect.left - rect.width / 2) + Math.PI / 2 + Math.PI * 2) % (Math.PI * 2)
  const value = angle / (Math.PI * 2) * duration.value
  try { audio.value.currentTime = value; currentTime.value = value } catch { errorMessage.value = '暂时无法跳转，请稍后重试。' }
}
function startScrub(event) {
  if (!canSeek.value) return
  event.preventDefault()
  scrubbing.value = true
  event.currentTarget.setPointerCapture(event.pointerId)
  seekRing(event)
}
function endScrub(event) {
  scrubbing.value = false
  if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
}
function ringKeydown(event) {
  if (!canSeek.value || !audio.value) return
  let value = currentTime.value
  if (['ArrowRight', 'ArrowUp'].includes(event.key)) value += 5
  else if (['ArrowLeft', 'ArrowDown'].includes(event.key)) value -= 5
  else if (event.key === 'Home') value = 0
  else if (event.key === 'End') value = duration.value
  else return
  event.preventDefault()
  audio.value.currentTime = Math.min(duration.value, Math.max(0, value))
  updateTime()
}
</script>

<template>
  <Teleport to="body">
    <div ref="widget" class="floating-music" :class="{ 'opens-right': controlsOnRight, 'is-dragging': dragging, 'near-top': position && position.y < 100 }" :style="widgetStyle" @mouseenter="() => { if (!dragging) expanded = true }" @mouseleave="() => { if (!scrubbing) expanded = false }">
      <audio ref="audio" :src="audioUrl || undefined" preload="metadata" loop @loadedmetadata="updateMetadata" @durationchange="updateMetadata" @timeupdate="updateTime" @playing="onPlaying" @pause="playing = false" @ended="playing = false" @error="onAudioError" />
      <div class="floating-music__ball">
        <svg class="music-ring" viewBox="0 0 64 64" role="slider" :tabindex="canSeek ? 0 : -1" aria-label="拖动圆环调整音乐进度" aria-valuemin="0" :aria-valuemax="duration || 1" :aria-valuenow="currentTime" :aria-valuetext="formatTime(currentTime)" :aria-disabled="!canSeek" @pointerdown="startScrub" @pointermove="event => { if (scrubbing) seekRing(event) }" @pointerup="endScrub" @pointercancel="endScrub" @lostpointercapture="scrubbing = false" @keydown="ringKeydown">
          <circle class="music-ring__hit" cx="32" cy="32" r="28" />
          <circle class="music-ring__progress" cx="32" cy="32" r="28" pathLength="100" :stroke-dasharray="progress + ' 100'" />
        </svg>
        <button ref="toggleButton" type="button" class="floating-music__toggle" :class="{ 'is-playing': playing }" :disabled="!audioUrl || fileError" :aria-disabled="props.videoPlaying" :aria-label="playing || pending ? '暂停音乐' : '播放音乐'" :title="props.videoPlaying ? '视频播放中，背景音乐已暂停' : `${trackName} · 点击播放或暂停，拖动可移动位置`" :aria-controls="panelId" @pointerdown="startDrag" @pointermove="moveDrag" @pointerup="endDrag" @pointercancel="endDrag" @lostpointercapture="lostDragCapture" @click="togglePlayback">
          <svg v-if="playing || pending" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5h3v14H7zM14 5h3v14h-3z" /></svg>
          <svg v-else-if="audioUrl" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 4.5v15l12-7.5z" /></svg>
          <svg v-else viewBox="0 0 24 24" class="music-note" aria-hidden="true"><path d="M9 17V6l10-2v11M9 9l10-2" /><ellipse cx="6" cy="17" rx="3" ry="2.5" /><ellipse cx="16" cy="15" rx="3" ry="2.5" /></svg>
        </button>
      </div>
      <div :id="panelId" class="floating-music__controls" :class="{ 'is-visible': (expanded || scrubbing) && !dragging }" :inert="!((expanded || scrubbing) && !dragging)" role="group" aria-label="音乐控制">
        <div class="music-seek">
          <input type="range" min="0" :max="duration || 1" step="0.1" :value="currentTime" :disabled="!canSeek" aria-label="音乐播放进度" @input="seek" />
          <span>{{ formatTime(currentTime) }} / {{ canSeek ? formatTime(duration) : '—:—' }}</span>
        </div>
        <div class="music-tools">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="m11 5-6 5H2v4h3l6 5V5Zm4 3a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14" /></svg>
          <input type="range" min="0" max="1" step="0.01" :value="volume" aria-label="音乐音量" :aria-valuetext="Math.round(volume * 100) + '%'" @input="changeVolume" />
          <output>{{ Math.round(volume * 100) }}%</output>
        </div>
      </div>
      <p v-if="errorMessage" class="music-feedback" role="status">{{ errorMessage }}</p>
    </div>
  </Teleport>
</template>

<style scoped>
.floating-music { position: fixed; right: 23px; top: calc(50% - 32px); z-index: 40; width: 64px; height: 64px; color: #dfc18d; font-family: var(--font-sans, sans-serif); }
.floating-music::before { content: ''; position: absolute; right: 60px; bottom: 0; width: 22px; height: 70px; }
.floating-music__ball { position: relative; width: 64px; height: 64px; }
.floating-music__toggle { position: absolute; inset: 10px; display: grid; place-items: center; border: 1px solid #a98a57; border-radius: 50%; background: #272219; color: #e7c28f; cursor: pointer; box-shadow: 0 3px 12px #0006; }
.floating-music__toggle.is-playing { background: #733a2a; }
.floating-music__toggle { touch-action: none; user-select: none; }
.floating-music.is-dragging, .floating-music.is-dragging .floating-music__toggle { cursor: grabbing; }
.floating-music.opens-right::before { right: auto; left: 60px; }
.floating-music.opens-right .floating-music__controls { right: auto; left: 76px; }
.floating-music.opens-right .music-feedback { right: auto; left: 0; text-align: left; }
.floating-music.near-top .music-feedback { bottom: auto; top: 72px; }
.floating-music__toggle svg { width: 21px; height: 21px; fill: currentColor; }
.floating-music__toggle .music-note { fill: none; stroke: currentColor; stroke-width: 1.6; stroke-linecap: round; stroke-linejoin: round; }
.music-ring { position: absolute; inset: 0; width: 64px; height: 64px; fill: none; touch-action: none; pointer-events: none; }
.music-ring__hit { stroke: #a98a575c; stroke-width: 6; pointer-events: stroke; cursor: ew-resize; }
.music-ring__progress { stroke: #d0ac6a; stroke-width: 3; transform: rotate(-90deg); transform-origin: center; stroke-linecap: round; }
.floating-music__controls { position: absolute; right: 76px; bottom: 7px; display: flex; flex-direction: column; gap: 7px; width: 228px; opacity: 0; visibility: hidden; pointer-events: none; transform: translateX(8px); transition: opacity .15s, transform .15s, visibility .15s; filter: drop-shadow(0 1px 3px #000); }
.floating-music__controls.is-visible { opacity: 1; visibility: visible; pointer-events: auto; transform: translateX(0); }
.floating-music input[type='range'] { display: block; width: 100%; height: 14px; margin: 0; accent-color: #d0ac6a; cursor: pointer; }
.floating-music input:disabled { opacity: .5; cursor: default; }
.music-seek { display: flex; align-items: center; gap: 10px; }
.music-seek input { flex: 1; min-width: 0; }
.music-seek span { color: #e2ceb0; font-size: 10px; font-variant-numeric: tabular-nums; white-space: nowrap; }
.music-tools { display: flex; align-items: center; gap: 9px; width: 154px; margin-left: auto; }
.music-tools output { flex: none; min-width: 27px; color: #e2ceb0; text-align: right; font-size: 10px; font-variant-numeric: tabular-nums; }
.music-tools > svg { width: 17px; height: 17px; flex: none; }
.music-tools input { flex: 1; min-width: 0; }
.music-tools button { display: grid; place-items: center; padding: 3px; border: 0; background: transparent; color: #e2c597; cursor: pointer; }
.music-tools button svg { width: 17px; height: 17px; }
.music-feedback { position: absolute; right: 0; bottom: 72px; width: 280px; margin: 0; color: #e9c6a5; text-align: right; font-size: 12px; line-height: 1.7; text-shadow: 0 1px 4px #000; }
.floating-music button:focus-visible, .floating-music input:focus-visible, .music-ring:focus-visible { outline: 2px solid #e5c38e; outline-offset: 3px; }
@media (prefers-reduced-motion: reduce) { .floating-music__controls { transition: none; } }
</style>
