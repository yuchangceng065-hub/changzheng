/**
 * 大事件配图（插画场景）注册表
 *
 * 背景与取舍：
 * 本作品不使用外部图片资源，插画全部是**手绘内联 SVG**（见 components/EventArtwork.vue）。
 * 这样做的好处：离线可用、无版权与来源风险、随主题配色统一、任意缩放不失真。
 *
 * 若日后要换成史料照片或美术稿，只需在节点数据上加 `photo` 字段
 * （例如 photo: 'art/luding.jpg'，图片放在 public/art/ 下），
 * EventArtwork 会自动优先渲染照片、回退到插画，无需改动组件逻辑。
 *
 * 场景归属按两级决定，优先级从高到低：
 *   1. ART_BY_NODE —— 针对具体节点的指定（如飞夺泸定桥用“铁索桥”场景）；
 *   2. ART_BY_KIND —— 按节点类型（battle / crossing / mountain ...）的兜底。
 * 这样新增节点无需逐个配图，也会自动得到与类型相符的插画。
 */

/** 全部可用场景 */
export const ART_SCENES = {
  depart: { title: '踏上征途', hint: '集结出发' },
  river: { title: '抢渡江河', hint: '突破封锁线' },
  chains: { title: '铁索强攻', hint: '飞夺泸定桥' },
  snow: { title: '翻越大雪山', hint: '空气稀薄的雪线' },
  grass: { title: '穿越草地', hint: '沼泽与饥寒' },
  hall: { title: '重要会议', hint: '决定方向的时刻' },
  join: { title: '胜利会师', hint: '两军会合' },
  unity: { title: '民族团结', hint: '彝海结盟' },
  pass: { title: '鏖战关隘', hint: '一夫当关' },
  maneuver: { title: '回旋运动战', hint: '穿插与迂回' },
  march: { title: '行军', hint: '翻山越岭' },
  end: { title: '长征胜利', hint: '到达落脚点' }
}

/** 按节点类型兜底 */
export const ART_BY_KIND = {
  start: 'depart',
  end: 'end',
  battle: 'pass',
  crossing: 'river',
  mountain: 'snow',
  grassland: 'grass',
  meeting: 'hall',
  join: 'join',
  turning: 'hall',
  march: 'march'
}

/**
 * 针对具体节点的指定场景
 * 只列“按类型兜底会不贴切”的节点，其余交给 ART_BY_KIND。
 */
export const ART_BY_NODE = {
  // 红一方面军
  'r1-xiangjiang': 'river', // 湘江战役：本质是在江边血战突围
  // 四渡赤水在数据里是四个独立节点（渡口与时间各不相同），四条都要登记
  'r1-chishui1': 'maneuver',
  'r1-chishui2': 'maneuver',
  'r1-chishui3': 'maneuver',
  'r1-chishui4': 'maneuver',
  'r1-wujiang': 'river',
  'r1-wujiang2': 'river',
  'r1-loushanguan': 'pass', // 娄山关：关隘攻防
  'r1-guiyang': 'maneuver', // 佯攻贵阳：调动敌军的运动战
  'r1-kunming': 'maneuver',
  'r1-jiaopingdu': 'river', // 巧渡金沙江
  'r1-yihai': 'unity', // 彝海结盟
  'r1-anshunchang': 'river', // 强渡大渡河
  'r1-luding': 'chains', // 飞夺泸定桥
  'r1-jiajinshan': 'snow',
  'r1-caodi': 'grass',
  'r1-baozuo': 'pass',
  'r1-lazikou': 'pass',
  'r1-wuqi': 'end',
  // 红25军
  'r25-dushuzhen': 'pass',
  'r25-yujiahe': 'pass',
  'r25-longde': 'snow', // 翻越六盘山
  'r25-sipocun': 'pass',
  'r25-yongping': 'end',
  // 红二、六军团
  'r26-wumengshan': 'maneuver', // 乌蒙山回旋战
  'r26-qianxuan': 'maneuver',
  'r26-shigu': 'river',
  'r26-zhongdian': 'snow',
  'r26-daxueshan': 'snow',
  'r26-jiawa': 'join',
  'r26-rongbacha': 'join',
  'r26-ganzi': 'join',
  'r26-caodi2': 'grass',
  'r26-panxian': 'hall',
  'r26-jiangtaibao': 'end',
  // 红四方面军
  'r4-jiadingjiang': 'river', // 强渡嘉陵江
  'r4-tianluyashan': 'pass',
  'r4-baizhangguan': 'pass',
  'r4-danglingshan': 'snow',
  'r4-zhuomudiao': 'hall',
  'r4-ganzi': 'join',
  'r4-caodi1': 'grass',
  'r4-caodi3': 'grass',
  'r4-huining': 'end'
}

/** 取节点对应的场景 id */
export function sceneFor(node) {
  if (!node) return 'march'
  if (ART_BY_NODE[node.id] && ART_SCENES[ART_BY_NODE[node.id]]) return ART_BY_NODE[node.id]
  if (node.art && ART_SCENES[node.art]) return node.art
  return ART_BY_KIND[node.kind] || 'march'
}

/** 场景标题（用于插画下方的题注与无障碍朗读） */
export function sceneTitle(scene) {
  return (ART_SCENES[scene] && ART_SCENES[scene].title) || '长征征途'
}

/** 场景副题（一句氛围说明） */
export function sceneHint(scene) {
  return (ART_SCENES[scene] && ART_SCENES[scene].hint) || ''
}
