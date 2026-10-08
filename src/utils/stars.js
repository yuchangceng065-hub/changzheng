/**
 * 难度星级工具
 * 支持半星：4.5 → 四颗实心 + 一颗半星
 */

/** 把数值星级拆成 5 个格子：'full' | 'half' | 'empty' */
export function starCells(stars) {
  const value = Number(stars) || 0
  const cells = []
  for (let i = 1; i <= 5; i += 1) {
    if (value >= i) cells.push('full')
    else if (value >= i - 0.5) cells.push('half')
    else cells.push('empty')
  }
  return cells
}

/** 无障碍朗读文本 */
export function starLabel(stars) {
  const value = Number(stars) || 0
  const text = Number.isInteger(value) ? String(value) : value.toFixed(1)
  return `难度 ${text} 星（满分 5 星）`
}

/** 纯文本星级（用于列表、标题等） */
export function starText(stars) {
  return starCells(stars)
    .map((c) => (c === 'full' ? '★' : c === 'half' ? '⯨' : '☆'))
    .join('')
}
