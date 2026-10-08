<script setup>
/**
 * 中国共产党党徽（镰刀和锤头）——**几何化简化示意**
 *
 * ⚠ 重要说明，请勿忽略：
 * 党徽的官方标准图案有精确的制图规范（见《中国共产党党徽党旗条例》）。
 * 本组件是**用基本图形拼出的清晰示意**，比例与官方标准图并不完全一致，
 * 只适合作为版面上的示意性标记。
 *
 * 正式提交（尤其是参赛、公开发布）前，请把 `public/symbols/party-emblem.svg`
 * 换成官方公布的标准矢量图，并把本组件的 `src` 指向它即可（见 docs/需求实现对照.md 的标识使用说明）。
 * 官方标准图可从中国政府网、共产党员网等权威渠道获取。
 *
 * 绘制方式：镰刀用一条粗圆弧（描边）表现刀身，加一小段刀柄；
 * 锤子用一条斜柄加一个垂直于柄的锤头矩形。两者在画面中部交叉。
 * 全部走描边 + 圆头，避免不规则填充在缩小时糊成一团。
 */
</script>

<template>
  <svg
    class="emblem"
    viewBox="0 0 100 100"
    preserveAspectRatio="xMidYMid meet"
    role="img"
    aria-label="中国共产党党徽（镰刀和锤头·简化示意）"
  >
    <g transform="translate(1,-12)">
      <!-- 镰刀刀身：外弧半径 40、内弧半径 56 的月牙形。
           注意两端**不收成针尖**：外弧止于 (40.7,76.9)、内弧止于 (44.5,72.3)，
           两点之间由闭合线段形成约 6 个单位宽的钝口。
           原因是收成针尖后末端细到会被抗锯齿吃掉，与刀柄之间会出现肉眼可见的断口
           （实测放大后断口有 6—14 像素）。钝口既符合镰刀的真实结构，也保证接得上。 -->
      <path d="M 40.7 76.9 A 40 40 0 0 1 82 28 A 56 56 0 0 0 44.5 72.3 Z" fill="currentColor" />
      <!-- 镰刀刀柄：从钝口中央接出，圆头端点与钝口重叠 -->
      <path
        d="M 42.6 74.6 L 51 97"
        fill="none"
        stroke="currentColor"
        stroke-width="11"
        stroke-linecap="round"
      />
      <!-- 锤柄：由右下向左上，与镰刀刀身交叉 -->
      <path
        d="M 72 72 L 36 34"
        fill="none"
        stroke="currentColor"
        stroke-width="9"
        stroke-linecap="round"
      />
      <!-- 锤头：垂直于锤柄 -->
      <rect
        x="15"
        y="23"
        width="34"
        height="14"
        rx="3"
        fill="currentColor"
        transform="rotate(-45 32 30)"
      />
    </g>
  </svg>
</template>

<style scoped>
.emblem {
  display: block;
  width: 100%;
  height: 100%;
}
</style>
