/**
 * 长征图集数据
 *
 * 说明：图集条目**引用已有的历史节点 id**，因此可以完全复用两套现成机制：
 *   1. 配图场景（`data/artwork.js` 按节点/类型自动匹配手绘场景）；
 *   2. 真实图片通道（`data/photoSource.js` 读 public/art/manifest.json，
 *      只有 reviewed === true 的图片才会显示）。
 *
 * 所以要把占位插画换成真实照片，**不需要改这个文件**：
 * 把图片放进 public/art/，在 manifest.json 里对应节点上登记并把 reviewed 改为 true 即可。
 * 详见 docs/配图清单.md。
 */

export const GALLERY = [
  {
    nodeId: 'r1-yudu',
    title: '于都出发',
    caption: '1934 年 10 月，中央红军主力从江西于都出发，开始战略转移。'
  },
  {
    nodeId: 'r1-xiangjiang',
    title: '血战湘江',
    caption: '1934 年 11 月末至 12 月初，红军在广西全州、兴安间与优势敌军殊死血战。'
  },
  {
    nodeId: 'r1-zunyi',
    title: '遵义会议',
    caption: '1935 年 1 月，党的历史上一个生死攸关的转折点。'
  },
  {
    nodeId: 'r1-chishui4',
    title: '四渡赤水',
    caption: '1935 年 1 月至 3 月，红军在赤水河两岸四次往返穿插，跳出重围。'
  },
  {
    nodeId: 'r1-jinshajiang',
    title: '巧渡金沙江',
    caption: '1935 年 5 月，全军依靠 7 只木船昼夜摆渡，渡过金沙江。'
  },
  {
    nodeId: 'r1-luding',
    title: '飞夺泸定桥',
    caption: '1935 年 5 月 29 日，22 名突击队员攀踏铁索夺取泸定桥。'
  },
  {
    nodeId: 'r1-jiajinshan',
    title: '翻越夹金山',
    caption: '1935 年 6 月，红军翻越长征途中第一座大雪山。'
  },
  {
    nodeId: 'r1-caodi',
    title: '穿越草地',
    caption: '1935 年 8 月，红军以惊人毅力走出遍布沼泽的松潘草地。'
  },
  {
    nodeId: 'r1-lazikou',
    title: '腊子口战役',
    caption: '1935 年 9 月，突破天险腊子口，打开北上通道。'
  },
  {
    nodeId: 'r1-wuqi',
    title: '到达吴起镇',
    caption: '1935 年 10 月 19 日，中央红军长征胜利结束。'
  },
  {
    nodeId: 'r26-ganzi',
    title: '甘孜会师',
    caption: '1936 年 6 至 7 月，红二、六军团与红四方面军在甘孜会合。'
  },
  {
    nodeId: 'r4-huining',
    title: '会宁会师',
    caption: '1936 年 10 月，红军三大主力会师，长征胜利结束。'
  }
]
