import { ref } from 'vue'

export const photoManifest = ref({})
let manifestPromise
const resolvePath = relative => new URL(relative, document.baseURI).href

export function ensureArtworkManifest() {
  if (!manifestPromise) {
    manifestPromise = fetch(resolvePath('art/manifest.json'))
      .then(response => {
        if (!response.ok) throw new Error('图片清单加载失败')
        return response.json()
      })
      .then(data => { photoManifest.value = data.photos || {} })
      .catch(() => { manifestPromise = null })
  }
  return manifestPromise
}

export function photosFor(node) {
  if (!node) return []
  if (node.photo) return [{ url: resolvePath(node.photo), title: node.name }]
  const entry = photoManifest.value[node.id]
  if (!entry?.reviewed) return []
  return (entry.images || []).filter(image => image.file).map(image => ({
    ...image,
    title: image.title || node.name,
    url: resolvePath(`art/${image.file}`)
  }))
}
