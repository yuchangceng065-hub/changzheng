<script setup>
import { nextTick, ref, watch } from 'vue'
import GuestbookPanel from './GuestbookPanel.vue'

const props = defineProps({ open: Boolean })
const emit = defineEmits(['close'])
const closeButton = ref(null)
let opener

watch(() => props.open, async open => {
  if (open) {
    opener = document.activeElement
    await nextTick()
    closeButton.value?.focus()
  } else opener?.focus?.()
})

function onKeydown(event) {
  if (event.key === 'Escape') {
    event.preventDefault()
    event.stopPropagation()
    emit('close')
    return
  }
  if (event.key !== 'Tab') return
  const controls = [...event.currentTarget.querySelectorAll('button, a[href], input, textarea, [tabindex="0"]')].filter(el => !el.disabled && el.getClientRects().length)
  const first = controls[0], last = controls.at(-1)
  if (event.shiftKey && event.target === first) { event.preventDefault(); last?.focus() }
  else if (!event.shiftKey && event.target === last) { event.preventDefault(); first?.focus() }
}
</script>

<template>
  <Teleport to="body">
    <div v-show="open" class="drawer-mask" @click="emit('close')" />
    <aside v-show="open" id="guestbook-drawer" class="drawer guestbook-drawer" role="dialog" aria-modal="true" aria-labelledby="guestbook-drawer-title" @keydown="onKeydown">
      <header class="guestbook-drawer__head">
        <h2 id="guestbook-drawer-title" class="serif">留言墙</h2>
        <button ref="closeButton" class="btn btn--ghost btn--sm" type="button" aria-label="关闭留言墙" @click="emit('close')">✕</button>
      </header>
      <div class="drawer__body scroll-area"><GuestbookPanel compact /></div>
    </aside>
  </Teleport>
</template>

<style scoped>
.guestbook-drawer { width: min(540px, 94vw); }
.guestbook-drawer__head { display: flex; align-items: center; justify-content: space-between; gap: 20px; padding: 22px 24px 10px; }
.guestbook-drawer__head h2 { margin: 0; font-size: 25px; font-weight: 700; }
</style>
