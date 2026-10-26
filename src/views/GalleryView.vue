<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { ARMIES } from '../data/armies.js'
import { buildGalleryItems } from '../data/gallery.js'
import { ensureArtworkManifest, photosFor } from '../data/photoSource.js'
import ImageViewer from '../components/ImageViewer.vue'

const items = computed(() => buildGalleryItems(ARMIES, photosFor))
const selectedArmy = ref('all')
const query = ref('')
const loaded = ref(false)
const active = ref(null)
const selectedNode = ref(null)

const filters = computed(() => [
  { id: 'all', name: '全部', count: items.value.length },
  ...ARMIES.map(army => ({
    id: army.id, name: army.name,
    count: items.value.filter(item => item.contexts.some(context => context.army.id === army.id)).length
  }))
])
const visibleItems = computed(() => {
  const search = query.value.trim().toLocaleLowerCase()
  return items.value.filter(item => {
    const matchesArmy = selectedArmy.value === 'all' || item.contexts.some(context => context.army.id === selectedArmy.value)
    const text = [item.photo.title, ...item.contexts.flatMap(context => [context.army.name, context.node.name, context.node.place, context.photo.title])].join(' ').toLocaleLowerCase()
    return matchesArmy && (!search || text.includes(search))
  })
})
const activeItem = computed(() => items.value.find(item => item.id === active.value) || null)
const activePosition = computed(() => visibleItems.value.findIndex(item => item.id === active.value))
const context = computed(() => activeItem.value?.contexts.find(entry => entry.node.id === selectedNode.value)
  || activeItem.value?.contexts.find(entry => entry.army.id === selectedArmy.value)
  || activeItem.value?.contexts[0])
const activePhoto = computed(() => context.value?.photo || activeItem.value?.photo)
const viewerPhotos = computed(() => visibleItems.value.map(item => item.id === active.value ? activePhoto.value : item.photo))

watch(active, () => { selectedNode.value = null })

function open(item) {
  active.value = item.id
}
function close() {
  active.value = null
}
function showImage(index) {
  active.value = visibleItems.value[index]?.id || null
}
onMounted(async () => {
  await ensureArtworkManifest()
  loaded.value = true
})
</script>

<template>
  <main class="gallery">
    <header class="gallery__head">
      <div class="gallery__heading">
        <div>
          <h1 class="gallery__title serif">长征图集</h1>
          <p class="gallery__lede">四路红军沿途的旧址、文献、纪念设施与历史影像。</p>
        </div>
        <span class="gallery__total"><strong>{{ items.length }}</strong> 幅图片</span>
      </div>
      <p class="gallery__note">点击图片查看大图、图注和相关事件。</p>
      <div class="gallery__toolbar">
        <div class="gallery__filters" role="group" aria-label="按部队筛选图片">
          <button v-for="filter in filters" :key="filter.id" type="button" :aria-pressed="selectedArmy === filter.id"
            :class="{ 'is-active': selectedArmy === filter.id }" @click="selectedArmy = filter.id">
            {{ filter.name }} <span>{{ filter.count }}</span>
          </button>
        </div>
        <input v-model="query" class="gallery__search" type="search" aria-label="搜索节点或图注" placeholder="搜索节点或图注" />
      </div>
      <p class="gallery__result" aria-live="polite">展示 {{ visibleItems.length }} 幅图片</p>
    </header>

    <ul class="gallery__grid">
      <li v-for="item in visibleItems" :key="item.id">
        <button class="gcard" type="button" :aria-label="`查看图片：${item.photo.title || item.contexts[0].node.name}`" @click="open(item)">
          <span class="gcard__image">
            <img :src="item.photo.url" :alt="item.photo.title || item.contexts[0].node.name" loading="lazy" decoding="async" />
            <span v-if="item.contexts.length > 1" class="gcard__shared">{{ item.contexts.length }} 个关联节点</span>
          </span>
          <span class="gcard__body">
            <span class="gcard__event">{{ item.contexts[0].army.name }} · {{ item.contexts[0].node.name }}</span>
            <span class="gcard__title" :title="item.photo.title">{{ item.photo.title || item.contexts[0].node.name }}</span>
            <span class="gcard__date">{{ item.contexts[0].node.date }}</span>
          </span>
        </button>
      </li>
    </ul>
    <p v-if="!visibleItems.length" class="gallery__empty">
      {{ !loaded ? '正在加载图集…' : query || selectedArmy !== 'all' ? '没有找到匹配的图片，请调整搜索或筛选。' : '暂无配图。' }}
    </p>

    <ImageViewer :open="!!activeItem" :photos="viewerPhotos" :index="activePosition"
      :title="context?.node.name || '长征图集'" @close="close" @change="showImage">
      <template v-if="context">
        <div class="viewer__contexts">
          <span class="viewer__label">关联节点</span>
          <button v-for="entry in activeItem.contexts" :key="entry.node.id" type="button"
            :aria-pressed="context.node.id === entry.node.id" :style="{ '--army-color': entry.army.accent }"
            @click="selectedNode = entry.node.id">
            {{ entry.army.name }} · {{ entry.node.name }}
          </button>
        </div>
        <p class="viewer__place">{{ context.node.date }} · {{ context.node.place }}</p>
        <p class="viewer__brief">{{ context.node.brief }}</p>
        <details class="viewer__detail"><summary>事件详情</summary><p>{{ context.node.detail }}</p></details>
      </template>
    </ImageViewer>
  </main>
</template>

<style scoped>
.gallery { flex: 1; min-height: 0; overflow-y: auto; padding: var(--page-padding); }
.gallery__head, .gallery__grid { max-width: var(--content-width); margin-left: auto; margin-right: auto; }
.gallery__heading { display: flex; justify-content: space-between; align-items: center; gap: 24px; }
.gallery__title { margin: 0; font-size: var(--page-title-size); font-weight: 500; letter-spacing: .02em; }
.gallery__lede { margin: 12px 0 0; font-size: 14px; line-height: 1.8; color: var(--color-mist-300); }
.gallery__total { color: var(--color-mist-500); white-space: nowrap; font-size: 13px; }
.gallery__total strong { margin-right: 6px; font-family: var(--font-serif); font-size: 28px; font-weight: 400; color: var(--color-gold-300); }
.gallery__note { margin: 16px 0 22px; font-size: 12px; color: var(--color-mist-500); line-height: 1.8; }
.gallery__toolbar { display: flex; align-items: center; flex-wrap: wrap; gap: 16px; justify-content: space-between; padding-top: 18px; border-top: 1px solid var(--panel-border); }
.gallery__filters { display: flex; gap: 8px; flex-wrap: wrap; }
.gallery__filters button { border: 1px solid var(--panel-border); border-radius: 5px; padding: 8px 12px; font: inherit; font-size: 12px; color: var(--color-mist-300); background: transparent; cursor: pointer; }
.gallery__filters button span { margin-left: 6px; opacity: .7; font-size: 11px; }
.gallery__filters button.is-active { color: #f7e4c5; background: #563126; border-color: #9c6450; }
.gallery__search { width: 208px; border: 1px solid var(--panel-border); border-radius: 5px; background: #211e18; color: var(--color-mist-100); padding: 9px 12px; font: inherit; font-size: 12px; }
.gallery__search::placeholder { color: var(--color-mist-600); }
.gallery__result { font-size: 11px; color: var(--color-mist-600); margin: 14px 0 0; }
.gallery__grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 18px; padding: 0; margin-top: 20px; list-style: none; }
.gcard { display: flex; flex-direction: column; width: 100%; height: 100%; padding: 0; border-radius: 3px; border: 1px solid var(--panel-border); background: var(--panel-bg); color: inherit; font: inherit; text-align: left; cursor: pointer; overflow: hidden; transition: border-color .18s, transform .18s; }
.gcard:hover { border-color: var(--color-gold-400); background: #27231d; }
.gcard__image { position: relative; display: block; flex: 0 0 auto; width: 100%; aspect-ratio: 4 / 3; overflow: hidden; background: #100e0c; }
.gcard__image img { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: contain; }
.gcard__shared { position: absolute; right: 8px; bottom: 8px; padding: 3px 7px; border: 1px solid #76654c; border-radius: 4px; background: #211e18e8; color: #dcc89f; font-size: 10px; }
.gcard__body { display: flex; flex-direction: column; gap: 8px; padding: 13px 15px 16px; }
.gcard__event { font-size: 12px; color: var(--color-gold-300); line-height: 1.5; }
.gcard__title { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; font-size: 14px; font-weight: 500; line-height: 1.7; }
.gcard__date { margin-top: auto; font-size: 12px; color: var(--color-mist-600); }
.gallery__empty { text-align: center; padding: 60px; font-size: 14px; color: var(--color-mist-500); }
.viewer__contexts { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; padding-top: 16px; border-top: 1px solid var(--panel-border); }
.viewer__label { font-size: 11px; color: var(--color-mist-600); margin-right: 4px; }
.viewer__contexts button { font: inherit; font-size: 11px; padding: 6px 9px; border: 1px solid var(--panel-border); border-radius: 4px; background: transparent; color: var(--color-mist-300); cursor: pointer; }
.viewer__contexts button[aria-pressed="true"] { color: var(--army-color); border-color: var(--army-color); }
.viewer__place { margin: 14px 0 6px; font-size: 11px; color: var(--color-mist-500); }
.viewer__brief { margin: 0; font-size: 13px; line-height: 1.9; color: var(--color-mist-300); }
.viewer__detail { margin-top: 12px; font-size: 12px; color: var(--color-mist-500); line-height: 1.9; }
.viewer__detail summary { cursor: pointer; color: var(--color-gold-300); }
.viewer__detail p { white-space: pre-line; }
</style>
