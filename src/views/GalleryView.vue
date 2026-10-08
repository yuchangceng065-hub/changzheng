<script setup>
import { computed, ref } from 'vue'
import EventArtwork from '../components/EventArtwork.vue'
import { ARMIES } from '../data/armies.js'
import { GALLERY } from '../data/gallery.js'

/** 图集条目引用的是历史节点 id，这里把节点对象取出来交给 EventArtwork 渲染 */
function nodeById(id) {
  for (const army of ARMIES) {
    const node = army.nodes.find((n) => n.id === id)
    if (node) return node
  }
  return null
}

const items = GALLERY.map((g) => ({ ...g, node: nodeById(g.nodeId) })).filter((g) => g.node)

const active = ref(null)
const activeItem = computed(() => items.find((i) => i.id === active.value) || null)

function open(item) {
  active.value = item.nodeId
}

function close() {
  active.value = null
}
</script>

<template>
  <main class="gallery">
    <header class="gallery__head">
      <h1 class="gallery__title serif">长征图集</h1>
      <p class="gallery__lede">
        按事件顺序编排，从出发、湘江、遵义、四渡赤水，到泸定桥、雪山、草地，直到最后的会师。
      </p>
      <p class="gallery__note">
        说明：当前图像为作品自绘的矢量插画（占位），可由作者替换为真实照片。
        替换方式见 <code>docs/配图清单.md</code>——图片放入 <code>public/art/</code> 并在
        <code>manifest.json</code> 中登记后，此处会自动显示照片。
      </p>
    </header>

    <ul class="gallery__grid">
      <li v-for="item in items" :key="item.nodeId">
        <button class="gcard" type="button" @click="open(item)">
          <EventArtwork :node="item.node" compact />
          <span class="gcard__body">
            <span class="gcard__title">{{ item.title }}</span>
            <span class="gcard__cap">{{ item.caption }}</span>
          </span>
        </button>
      </li>
    </ul>

    <!-- 大图查看 -->
    <div v-if="activeItem" class="modal-mask" @click.self="close">
      <div class="viewer panel panel--solid">
        <div class="viewer__head">
          <div>
            <h2 class="viewer__title serif">{{ activeItem.title }}</h2>
            <p class="viewer__place">
              {{ activeItem.node.place }} · {{ activeItem.node.date }}
            </p>
          </div>
          <button class="btn btn--ghost btn--sm" type="button" @click="close">✕</button>
        </div>

        <EventArtwork :node="activeItem.node" />

        <p class="viewer__cap">{{ activeItem.caption }}</p>
        <p class="viewer__brief">{{ activeItem.node.brief }}</p>
      </div>
    </div>
  </main>
</template>

<style scoped>
.gallery {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 30px 24px 44px;
}

.gallery__head {
  max-width: 900px;
  margin: 0 auto;
}

.gallery__title {
  margin: 0;
  font-size: 30px;
  font-weight: 700;
  letter-spacing: 0.08em;
}

.gallery__lede {
  margin: 14px 0 0;
  font-size: 14px;
  line-height: 2;
  color: #c8d5e2;
}

.gallery__note {
  margin: 12px 0 0;
  padding: 10px 12px;
  border-radius: var(--radius-sm);
  border: 1px dashed rgba(212, 175, 55, 0.4);
  background: rgba(212, 175, 55, 0.06);
  font-size: 11.5px;
  line-height: 1.8;
  color: #d8c9a4;
}

.gallery__note code {
  font-size: 11px;
  color: var(--color-gold-300);
}

.gallery__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 14px;
  max-width: 1180px;
  margin: 22px auto 0;
  padding: 0;
  list-style: none;
}

.gcard {
  display: flex;
  flex-direction: column;
  width: 100%;
  padding: 0;
  border-radius: var(--radius-md);
  border: 1px solid var(--panel-border);
  background: var(--panel-bg);
  color: inherit;
  font-family: inherit;
  text-align: left;
  cursor: pointer;
  overflow: hidden;
  transition: border-color 0.18s ease, transform 0.18s ease;
}

.gcard:hover {
  border-color: rgba(217, 43, 58, 0.6);
  transform: translateY(-2px);
}

.gcard__body {
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 11px 13px 13px;
}

.gcard__title {
  font-size: 14.5px;
  font-weight: 700;
  letter-spacing: 0.03em;
}

.gcard__cap {
  font-size: 12px;
  line-height: 1.75;
  color: var(--color-mist-500);
}

/* 大图查看 */
.viewer {
  width: min(760px, 100%);
  max-height: min(90vh, 940px);
  overflow: auto;
  padding: 16px;
  animation: rise-in 0.24s cubic-bezier(0.22, 1, 0.36, 1);
}

.viewer__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.viewer__title {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
}

.viewer__place {
  margin: 4px 0 0;
  font-size: 12px;
  color: var(--color-mist-500);
}

.viewer__cap {
  margin: 12px 0 0;
  font-size: 12.5px;
  line-height: 1.85;
  color: var(--color-mist-300);
}

.viewer__brief {
  margin: 8px 0 0;
  font-size: 13px;
  line-height: 1.9;
  color: #c8d5e2;
}

@media (max-width: 720px) {
  .gallery {
    padding: 20px 14px 30px;
  }

  .gallery__title {
    font-size: 24px;
  }
}
</style>
