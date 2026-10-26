/** 展开所有节点配图；同一图片只保留一张图集卡片，保留全部关联节点。 */
export function buildGalleryItems(armies, photosForNode) {
  const images = new Map()
  for (const army of armies) {
    for (const node of army.nodes) {
      for (const photo of photosForNode(node)) {
        const id = photo.contentHash || photo.url
        if (!id) continue
        let item = images.get(id)
        if (!item) {
          item = { id, photo, contexts: [] }
          images.set(id, item)
        }
        if (!item.contexts.some(context => context.node.id === node.id)) {
          item.contexts.push({ army, node, photo })
        }
      }
    }
  }
  return [...images.values()]
}
