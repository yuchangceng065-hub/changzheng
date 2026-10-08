<script setup>
import { computed } from 'vue'

/**
 * 中华人民共和国国旗（五星红旗）
 *
 * 几何规格严格按标准绘制，不做任何"近似"：
 *   旗面按 30 × 20 网格（宽 : 高 = 3 : 2）；
 *   大星中心 (5, 5)，外接圆半径 3；
 *   四颗小星中心分别为 (10, 2)、(12, 4)、(12, 7)、(10, 9)，外接圆半径 1；
 *   每颗小星都有一个角正对大星的中心。
 *
 * 因此本组件不可随意改比例或改星位——国旗法要求国旗按规定制作，
 * 比例与星位错误的旗面属于不规范使用。如需更大尺寸，请改使用处的 CSS 尺寸，
 * 不要改这里的 viewBox 与星位。
 *
 * 配色取标准数字色值：旗面红 #EE1C25，五角星黄 #FFDE00。
 */

/** 五角星路径：外接圆半径 R，rotationDeg 为整体旋转角（正值顺时针） */
function starPath(cx, cy, R, rotationDeg) {
  // 五角星内接半径比 = sin(18°) / sin(54°) ≈ 0.381966
  const inner = R * 0.381966
  const pts = []
  for (let i = 0; i < 10; i += 1) {
    const r = i % 2 === 0 ? R : inner
    // -90° 表示"尖角朝上"（SVG 的 y 轴向下）
    const angle = ((-90 + i * 36 + rotationDeg) * Math.PI) / 180
    pts.push([cx + r * Math.cos(angle), cy + r * Math.sin(angle)])
  }
  return `M${pts.map(([x, y]) => `${x.toFixed(4)},${y.toFixed(4)}`).join('L')}Z`
}

/** 大星：正立，尖角朝上 */
const BIG = { cx: 5, cy: 5, r: 3 }

/** 四颗小星：位置固定，各自旋转到"一角正对大星中心" */
const SMALL = [
  { cx: 10, cy: 2, r: 1 },
  { cx: 12, cy: 4, r: 1 },
  { cx: 12, cy: 7, r: 1 },
  { cx: 10, cy: 9, r: 1 }
]

const starPaths = computed(() => {
  const list = [starPath(BIG.cx, BIG.cy, BIG.r, 0)]
  for (const s of SMALL) {
    // 小星中心指向大星中心的方向角；加 90° 后即为需要旋转的角度
    const deg = (Math.atan2(BIG.cy - s.cy, BIG.cx - s.cx) * 180) / Math.PI + 90
    list.push(starPath(s.cx, s.cy, s.r, deg))
  }
  return list
})
</script>

<template>
  <svg
    class="flag-cn"
    viewBox="0 0 30 20"
    preserveAspectRatio="xMidYMid meet"
    role="img"
    aria-label="中华人民共和国国旗"
  >
    <rect x="0" y="0" width="30" height="20" fill="#ee1c25" />
    <path v-for="(d, i) in starPaths" :key="i" :d="d" fill="#ffde00" />
  </svg>
</template>

<style scoped>
.flag-cn {
  display: block;
  width: 100%;
  height: 100%;
}
</style>
