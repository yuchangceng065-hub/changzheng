<script setup>
import { computed, onMounted, onUnmounted, ref, useId } from 'vue'

defineProps({
  title: { type: String, default: '留言墙' },
  compact: Boolean,
  prompt: { type: String, default: '写下让你印象深刻的故事，或读完后的感受。' }
})

const STORAGE_KEY = 'changzheng-guestbook-v1'
const MAX_RECORDS = 50
const MAX_BODY = 500
const MAX_NAME = 24
const fieldId = useId()
const nickname = ref('')
const body = ref('')
const records = ref([])
const errorMessage = ref('')
const statusMessage = ref('')
const storageProblem = ref(false)
const confirmClear = ref(false)
const remaining = computed(() => MAX_BODY - body.value.length)
const newestFirst = computed(() => [...records.value].reverse())
const timeFormat = new Intl.DateTimeFormat('zh-CN', {
  year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false
})

class GuestbookDataError extends Error {}

function readRecords() {
  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (raw === null) return []
  let stored
  try {
    stored = JSON.parse(raw)
  } catch {
    throw new GuestbookDataError()
  }
  if (!stored || stored.version !== 1 || !Array.isArray(stored.records) || stored.records.length > MAX_RECORDS) {
    throw new GuestbookDataError()
  }
  const ids = new Set()
  return stored.records.map((record) => {
    if (!record || typeof record.id !== 'string' || !record.id || record.id.length > 120 || ids.has(record.id)
      || typeof record.nickname !== 'string' || !record.nickname.trim() || record.nickname.length > MAX_NAME
      || typeof record.body !== 'string' || !record.body.trim() || record.body.length > MAX_BODY
      || typeof record.createdAt !== 'number' || !Number.isFinite(record.createdAt)
      || Number.isNaN(new Date(record.createdAt).getTime())) {
      throw new GuestbookDataError()
    }
    ids.add(record.id)
    return { id: record.id, nickname: record.nickname, body: record.body, createdAt: record.createdAt }
  })
}

function writeRecords(nextRecords) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, records: nextRecords }))
  records.value = nextRecords
  storageProblem.value = false
  errorMessage.value = ''
}

function showStorageError(error, action) {
  storageProblem.value = true
  statusMessage.value = ''
  const reason = error instanceof GuestbookDataError
    ? '留言数据无法读取，可以清空后重新记录。'
    : '浏览器未允许保存，或本机存储空间不足。请检查浏览器设置后重试。'
  errorMessage.value = `${action}${reason}${body.value ? '输入内容已保留。' : ''}`
}

function loadRecords() {
  try {
    records.value = readRecords()
    storageProblem.value = false
    errorMessage.value = ''
  } catch (error) {
    showStorageError(error, '')
  }
}

function submitMessage() {
  statusMessage.value = ''
  confirmClear.value = false
  const message = body.value.trim()
  const name = nickname.value.trim() || '访客'
  if (!message) {
    errorMessage.value = '请先写下你的感受。'
    return
  }
  if (message.length > MAX_BODY || name.length > MAX_NAME) {
    errorMessage.value = '留言最多500字，昵称最多24字。'
    return
  }
  try {
    const current = readRecords()
    const record = {
      id: globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      nickname: name,
      body: message,
      createdAt: Date.now()
    }
    writeRecords([...current, record].slice(-MAX_RECORDS))
    body.value = ''
    statusMessage.value = '留言已保存在当前浏览器。'
  } catch (error) {
    showStorageError(error, '留言未保存。')
  }
}

function deleteMessage(id) {
  confirmClear.value = false
  try {
    writeRecords(readRecords().filter((record) => record.id !== id))
    statusMessage.value = '这条留言已删除。'
  } catch (error) {
    showStorageError(error, '未能删除。')
  }
}

function clearMessages() {
  try {
    writeRecords([])
    confirmClear.value = false
    statusMessage.value = '留言已清空。'
  } catch (error) {
    showStorageError(error, '未能清空。')
  }
}

function handleStorageChange(event) {
  if (event.key === STORAGE_KEY || event.key === null) {
    confirmClear.value = false
    loadRecords()
  }
}

function displayTime(timestamp) {
  return timeFormat.format(new Date(timestamp))
}

onMounted(() => {
  loadRecords()
  window.addEventListener('storage', handleStorageChange)
})
onUnmounted(() => window.removeEventListener('storage', handleStorageChange))
</script>

<template>
  <section class="guestbook" :class="{ 'guestbook--drawer': compact }" :aria-label="compact ? title : undefined" :aria-labelledby="compact ? undefined : `${fieldId}-title`">
    <header class="guestbook__head">
      <h2 v-if="!compact" :id="`${fieldId}-title`" class="serif">{{ title }}</h2>
      <p>{{ prompt }}</p>
    </header>

    <div class="guestbook__columns">
      <form class="guestbook__form" novalidate @submit.prevent="submitMessage">
        <label :for="`${fieldId}-nickname`">昵称<span class="guestbook__optional">可选</span></label>
        <input
          :id="`${fieldId}-nickname`"
          v-model="nickname"
          type="text"
          :maxlength="MAX_NAME"
          placeholder="访客"
          autocomplete="nickname"
        />

        <label :for="`${fieldId}-body`">你的感受</label>
        <textarea
          :id="`${fieldId}-body`"
          v-model="body"
          :maxlength="MAX_BODY"
          :aria-describedby="`${fieldId}-count ${fieldId}-privacy`"
          rows="6"
          required
          placeholder="在这里写下留言……"
        />
        <div class="guestbook__submit-row">
          <span :id="`${fieldId}-count`" class="guestbook__count">还可输入{{ remaining }}字</span>
          <button class="btn btn--primary" type="submit">保存留言</button>
        </div>
        <p :id="`${fieldId}-privacy`" class="guestbook__privacy">留言仅保存在当前浏览器，最多保留最近50条。清理浏览器数据后会删除。</p>
        <p v-if="errorMessage" class="guestbook__error" role="alert">{{ errorMessage }}</p>
        <p v-if="statusMessage" class="guestbook__status" role="status">{{ statusMessage }}</p>
      </form>

      <div class="guestbook__entries">
        <div class="guestbook__entries-head">
          <h3>最新留言<span v-if="records.length">{{ records.length }}</span></h3>
          <button
            v-if="records.length || storageProblem"
            type="button"
            class="guestbook__text-button"
            :aria-expanded="confirmClear"
            :aria-controls="`${fieldId}-clear`"
            @click="confirmClear = !confirmClear"
          >清空留言</button>
        </div>
        <div v-if="confirmClear" :id="`${fieldId}-clear`" class="guestbook__confirm">
          <p>清空当前浏览器中的全部留言？此操作无法撤销。</p>
          <div>
            <button type="button" class="btn btn--sm" @click="confirmClear = false">取消</button>
            <button type="button" class="btn btn--sm btn--primary" @click="clearMessages">确认清空</button>
          </div>
        </div>
        <ol v-if="records.length" class="guestbook__list">
          <li v-for="record in newestFirst" :key="record.id" class="guestbook__entry">
            <div class="guestbook__byline">
              <span class="guestbook__name">{{ record.nickname }}</span>
              <time :datetime="new Date(record.createdAt).toISOString()">{{ displayTime(record.createdAt) }}</time>
            </div>
            <p>{{ record.body }}</p>
            <button
              class="guestbook__text-button guestbook__delete"
              type="button"
              :aria-label="`删除${record.nickname}于${displayTime(record.createdAt)}保存的留言`"
              @click="deleteMessage(record.id)"
            >删除</button>
          </li>
        </ol>
        <p v-else class="guestbook__empty">{{ storageProblem ? '暂时无法读取留言。' : '还没有留言，写下第一条感受吧。' }}</p>
      </div>
    </div>
  </section>
</template>

<style scoped>
.guestbook { max-width: var(--reading-width); margin: 34px auto 0; padding-top: 28px; border-top: 1px solid var(--panel-border); }
.guestbook__head h2 { margin: 0; color: var(--color-gold-300); font-size: 25px; font-weight: 600; }
.guestbook__head p { margin: 12px 0 24px; color: var(--color-mist-500); font-size: 14px; line-height: 1.8; }
.guestbook__columns { display: grid; grid-template-columns: minmax(300px, 0.9fr) minmax(0, 1.1fr); gap: 44px; }
.guestbook__form { display: flex; flex-direction: column; align-items: stretch; }
.guestbook__form label { margin: 0 0 9px; font-size: 14px; color: var(--color-mist-300); }
.guestbook__optional { margin-left: 9px; font-size: 12px; color: var(--color-mist-600); }
.guestbook__form input, .guestbook__form textarea { width: 100%; border: 1px solid var(--panel-border-strong); border-radius: 3px; background: rgba(0, 0, 0, 0.14); color: var(--color-mist-100); padding: 11px 12px; font: inherit; font-size: 14px; line-height: 1.8; }
.guestbook__form input { max-width: 240px; margin-bottom: 20px; }
.guestbook__form textarea { resize: vertical; min-height: 146px; max-height: 420px; }
.guestbook__form input::placeholder, .guestbook__form textarea::placeholder { color: var(--color-mist-600); opacity: 1; }
.guestbook__form input:focus-visible, .guestbook__form textarea:focus-visible, .guestbook button:focus-visible { outline: 2px solid var(--color-gold-400); outline-offset: 3px; }
.guestbook__submit-row { display: flex; align-items: center; justify-content: space-between; gap: 14px; margin-top: 12px; }
.guestbook__count, .guestbook__privacy { color: var(--color-mist-500); font-size: 12px; }
.guestbook__privacy { margin: 14px 0 0; line-height: 1.8; }
.guestbook__error, .guestbook__status { margin: 12px 0 0; font-size: 13px; line-height: 1.8; }
.guestbook__error { color: #ffaaa0; }
.guestbook__status { color: var(--color-gold-300); }
.guestbook__entries { min-width: 0; border-left: 1px solid var(--panel-border); padding-left: 34px; }
.guestbook__entries-head { display: flex; justify-content: space-between; align-items: center; gap: 16px; margin-bottom: 17px; }
.guestbook__entries-head h3 { margin: 0; font-size: 15px; font-weight: 500; color: var(--color-mist-300); }
.guestbook__entries-head h3 span { margin-left: 9px; color: var(--color-mist-600); font-size: 12px; font-weight: 400; }
.guestbook__text-button { padding: 4px 0; border: 0; background: transparent; color: var(--color-mist-500); font: inherit; font-size: 12px; text-decoration: underline; text-underline-offset: 4px; cursor: pointer; }
.guestbook__text-button:hover { color: var(--color-gold-300); }
.guestbook__list { max-height: 420px; overflow-y: auto; scrollbar-gutter: stable; margin: 0; padding: 0 10px 0 0; list-style: none; }
.guestbook__entry { padding: 17px 0 13px; border-bottom: 1px solid var(--panel-border); }
.guestbook__entry:first-child { padding-top: 0; }
.guestbook__byline { display: flex; align-items: baseline; flex-wrap: wrap; justify-content: space-between; gap: 7px 14px; }
.guestbook__name { font-size: 14px; color: var(--color-gold-300); overflow-wrap: anywhere; }
.guestbook__byline time { color: var(--color-mist-600); font-size: 11px; }
.guestbook__entry > p { margin: 10px 0 6px; font-size: 14px; line-height: 1.9; color: var(--color-mist-300); white-space: pre-wrap; overflow-wrap: anywhere; }
.guestbook__delete { display: block; margin-left: auto; }
.guestbook__empty { margin: 30px 0; font-size: 13px; line-height: 1.9; color: var(--color-mist-600); }
.guestbook__confirm { margin: 0 0 20px; padding: 12px 0 16px; border-top: 1px solid var(--panel-border); border-bottom: 1px solid var(--panel-border); }
.guestbook__confirm p { margin: 0 0 12px; font-size: 13px; line-height: 1.8; color: var(--color-mist-300); }
.guestbook__confirm > div { display: flex; gap: 9px; justify-content: flex-end; }
@media (max-width: 1120px) {
  .guestbook__columns { gap: 26px; }
  .guestbook__entries { padding-left: 24px; }
}
</style>

<style scoped>
.guestbook--drawer { margin: 0; padding: 0; border: 0; }
.guestbook--drawer .guestbook__head p { margin-top: 0; }
.guestbook--drawer .guestbook__columns { grid-template-columns: minmax(0, 1fr); gap: 28px; }
.guestbook--drawer .guestbook__entries { border-left: 0; border-top: 1px solid var(--panel-border); padding: 24px 0 0; }
.guestbook--drawer .guestbook__list { max-height: none; overflow: visible; padding-right: 0; }
</style>
