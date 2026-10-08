/**
 * 小游戏预留注册表
 *
 * ⚠ 本版本**不实现**任何小游戏玩法，只预留接入点与内容设定。
 * 这样做的意图：先把"哪些节点适合互动、玩法类型是什么"定下来，
 * 后续实现玩法时不必改动史实数据层，也不必改动详情卡组件。
 *
 * 未来实现步骤（三步，接口已经留好）：
 *   1. 在 components/MiniGameHost.vue 的 `ready` 分支里按 game.type 渲染玩法；
 *   2. 玩法结束时调用 emit('finish', { passed, score })，外部据此给反馈；
 *   3. 把下面对应条目的 implemented 改为 true —— 界面上的"开发中"占位
 *      会自动变成可进入状态，无需其他改动。
 */

/** 玩法类型 */
export const MINI_GAME_TYPES = {
  timing: '时序操作',
  resource: '资源分配',
  route: '路线选择',
  balance: '平衡取舍'
}

/** 预留的小游戏设定 */
export const MINI_GAMES = {
  'river-timing': {
    id: 'river-timing',
    title: '抢渡金沙江',
    type: 'timing',
    implemented: false,
    brief:
      '全军只有 7 只木船、36 名船工。在追兵抵达江岸之前安排昼夜摆渡——哪一支部队先走、什么时候不得不停，都要你来定。'
  },
  'bridge-assault': {
    id: 'bridge-assault',
    title: '飞夺泸定桥',
    type: 'timing',
    implemented: false,
    brief:
      '一昼夜奔袭 240 里之后，22 名突击队员要攀着 13 根铁索冲过火海。把握攀爬节奏与火力掩护的时机。'
  },
  'grassland-supply': {
    id: 'grassland-supply',
    title: '穿越草地',
    type: 'resource',
    implemented: false,
    brief:
      '粮食即将耗尽。把有限的青稞分给各部队，在沼泽、严寒与饥饿之间，带尽可能多的人走出草地。'
  },
  'maneuver-route': {
    id: 'maneuver-route',
    title: '四渡赤水',
    type: 'route',
    implemented: false,
    brief:
      '数十万敌军围追堵截。在赤水河两岸选择四次渡河的方向与时机，用机动把敌人甩在身后。'
  }
}

/**
 * 节点 → 预留小游戏
 * 只挂在史实上确实存在"决策感"的节点，不做成每个节点都弹游戏。
 */
export const MINI_GAME_BY_NODE = {
  'r1-jiaopingdu': 'river-timing',
  'r1-luding': 'bridge-assault',
  'r1-caodi': 'grassland-supply',
  'r1-chishui4': 'maneuver-route'
}

/** 取节点预留的小游戏 id（节点自带字段优先） */
export function gameIdFor(node) {
  if (!node) return ''
  return node.miniGame || MINI_GAME_BY_NODE[node.id] || ''
}

export function getMiniGame(id) {
  if (!id) return null
  return MINI_GAMES[id] || null
}

export function isImplemented(id) {
  const game = getMiniGame(id)
  return Boolean(game && game.implemented)
}
