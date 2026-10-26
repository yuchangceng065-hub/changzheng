export const SOURCES = [
  {
    id: 's-party-history',
    title: '《中国共产党历史》第一卷 · 1921—1949',
    publisher: '中共党史出版社',
  },
  {
    id: 's-longmarch-history',
    title: '《红军长征史》',
    publisher: '中共中央党史研究室著，中共党史出版社',
  },
  {
    id: 's-longmarch-archive',
    title: '《中国工农红军长征史料丛书》',
    publisher: '解放军出版社',
  },
  {
    id: 's-red1-history',
    title: '《中国工农红军第一方面军史》',
    publisher: '解放军出版社',
  },
  {
    id: 's-red2-history',
    title: '《中国工农红军第二方面军战史》',
    publisher: '解放军出版社',
  },
  {
    id: 's-red4-history',
    title: '《中国工农红军第四方面军战史》',
    publisher: '解放军出版社',
  },
  {
    id: 's-red25-history',
    title: '《中国工农红军第二十五军战史》',
    publisher: '解放军出版社',
  },
  {
    id: 's-dswxyjy',
    title: '中共中央党史和文献研究院',
    url: 'https://www.dswxyjy.org.cn/',
  },
  {
    id: 's-81',
    title: '中国军网 · 观文物·忆长征',
    url: 'https://photo.81.cn/zhuanti/gwwycz.htm',
  }
]

export function getSource(id) {
  return SOURCES.find(source => source.id === id)
}
