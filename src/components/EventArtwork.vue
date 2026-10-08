<script setup>
import { computed, onMounted } from 'vue'
import { sceneFor, sceneTitle, sceneHint } from '../data/artwork.js'
import { photoFor, photoCreditFor, ensureArtworkManifest } from '../data/photoSource.js'

const props = defineProps({
  node: { type: Object, required: true },
  /** 紧凑模式：用于时间线等小尺寸位置，隐藏题注 */
  compact: { type: Boolean, default: false }
})

const scene = computed(() => sceneFor(props.node))
const title = computed(() => sceneTitle(scene.value))
const hint = computed(() => sceneHint(scene.value))

/**
 * 真实图片优先：public/art/manifest.json 中 reviewed=true 的条目，
 * 或节点数据里显式写的 photo 字段。都没有则回退到手绘插画。
 */
const photo = computed(() => photoFor(props.node))
const credit = computed(() => photoCreditFor(props.node))

onMounted(ensureArtworkManifest)
</script>

<template>
  <figure class="artwork" :class="{ 'artwork--compact': compact }">
    <img
      v-if="photo"
      class="artwork__photo"
      :src="photo"
      :alt="(credit && credit.title) || title"
      :title="credit && credit.source ? `出处：${credit.source}` : ''"
      loading="lazy"
    />
    <svg
      v-else
      class="artwork__svg"
      viewBox="0 0 320 180"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      :aria-label="`${title}（${hint}）`"
    >
      <defs>
        <!-- 天光：上暗下暖，地平线附近最亮，制造纵深 -->
        <linearGradient id="lmSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#12070e" />
          <stop offset="48%" stop-color="#2a1017" />
          <stop offset="100%" stop-color="#4d1e24" />
        </linearGradient>
        <!-- 光源光晕 -->
        <radialGradient id="lmSun" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#ffe6a8" stop-opacity="0.9" />
          <stop offset="30%" stop-color="#e8a03a" stop-opacity="0.4" />
          <stop offset="100%" stop-color="#d92b3a" stop-opacity="0" />
        </radialGradient>
        <!-- 大气透视：远景偏亮偏灰，近景偏暗偏实 -->
        <linearGradient id="lmFar" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#4a2b34" />
          <stop offset="100%" stop-color="#311b25" />
        </linearGradient>
        <linearGradient id="lmMid" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#311b25" />
          <stop offset="100%" stop-color="#20121a" />
        </linearGradient>
        <linearGradient id="lmNear" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#1b0e15" />
          <stop offset="100%" stop-color="#0b0508" />
        </linearGradient>
        <linearGradient id="lmWater" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#5a2f39" />
          <stop offset="100%" stop-color="#1a0e14" />
        </linearGradient>
        <linearGradient id="lmSnow" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#f4f8fc" />
          <stop offset="100%" stop-color="#8ba2b8" />
        </linearGradient>
        <linearGradient id="lmRock" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="#28161d" />
          <stop offset="100%" stop-color="#140a0f" />
        </linearGradient>
        <radialGradient id="lmFire" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#fff0bd" stop-opacity="0.95" />
          <stop offset="28%" stop-color="#f0a83c" stop-opacity="0.6" />
          <stop offset="100%" stop-color="#d92b3a" stop-opacity="0" />
        </radialGradient>
        <linearGradient id="lmMist" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#f2d9c4" stop-opacity="0" />
          <stop offset="100%" stop-color="#f2d9c4" stop-opacity="0.2" />
        </linearGradient>
        <radialGradient id="lmVig" cx="50%" cy="44%" r="76%">
          <stop offset="50%" stop-color="#000" stop-opacity="0" />
          <stop offset="100%" stop-color="#000" stop-opacity="0.6" />
        </radialGradient>
      </defs>

      <!-- 共用天光底 -->
      <rect x="0" y="0" width="320" height="180" fill="url(#lmSky)" />

      <!-- ==================== 出发 ==================== -->
      <g v-if="scene === 'depart'">
        <circle cx="252" cy="120" r="78" fill="url(#lmSun)" />
        <circle cx="252" cy="120" r="13" fill="#ffe6a8" opacity="0.55" />
        <!-- 远景山 -->
        <path d="M0 118 L30 96 L56 110 L88 84 L122 108 L152 92 L186 112 L216 94 L248 114 L282 98 L320 116 L320 180 L0 180 Z" fill="url(#lmFar)" />
        <rect x="0" y="112" width="320" height="18" fill="url(#lmMist)" opacity="0.6" />
        <!-- 中景山 -->
        <path d="M0 134 L38 114 L74 134 L112 112 L152 138 L192 116 L232 140 L272 120 L320 142 L320 180 L0 180 Z" fill="url(#lmMid)" />
        <!-- 河谷 -->
        <path d="M0 150 C56 144 96 158 152 151 C208 144 254 158 320 150 L320 180 L0 180 Z" fill="url(#lmWater)" />
        <g stroke="#8a4c58" stroke-width="1.1" fill="none" opacity="0.55">
          <path d="M6 156 C54 151 92 161 148 156" />
          <path d="M40 166 C92 161 130 171 190 166" />
        </g>
        <!-- 村舍 -->
        <g>
          <path d="M36 132 L52 122 L68 132 Z" fill="#3a222a" />
          <rect x="40" y="132" width="24" height="12" fill="#1e1117" />
          <rect x="47" y="135" width="5" height="6" fill="#e8c766" opacity="0.85" />
          <path d="M72 134 L86 125 L100 134 Z" fill="#3a222a" />
          <rect x="75" y="134" width="21" height="10" fill="#1e1117" />
          <rect x="82" y="137" width="4" height="5" fill="#e8c766" opacity="0.7" />
        </g>
        <!-- 近景地面 -->
        <path d="M0 160 C60 154 110 166 170 160 C230 154 280 166 320 160 L320 180 L0 180 Z" fill="url(#lmNear)" />
        <!-- 行军队列（前倾的行军姿态） -->
        <g fill="#0a0507">
          <g transform="translate(150,152) rotate(-4)"><circle cx="0" cy="-11" r="3" /><path d="M-2.9 -8.4 Q0 -9.6 2.9 -8.4 L3.5 -0.5 L-3.5 -0.5 Z" /><path d="M-1.7 -0.5 L-2.6 8.5" stroke="#0a0507" stroke-width="1.9" fill="none" stroke-linecap="round" /><path d="M1.7 -0.5 L2.6 8.5" stroke="#0a0507" stroke-width="1.9" fill="none" stroke-linecap="round" /></g>
          <g transform="translate(170,155) rotate(-3)"><circle cx="0" cy="-10" r="2.8" /><path d="M-2.7 -7.8 Q0 -8.9 2.7 -7.8 L3.3 -0.5 L-3.3 -0.5 Z" /><path d="M-1.6 -0.5 L-2.4 7.8" stroke="#0a0507" stroke-width="1.75" fill="none" stroke-linecap="round" /><path d="M1.6 -0.5 L2.4 7.8" stroke="#0a0507" stroke-width="1.75" fill="none" stroke-linecap="round" /></g>
          <g transform="translate(190,153) rotate(-5)"><circle cx="0" cy="-11" r="3" /><path d="M-2.9 -8.4 Q0 -9.6 2.9 -8.4 L3.5 -0.5 L-3.5 -0.5 Z" /><path d="M-1.7 -0.5 L-2.6 8.5" stroke="#0a0507" stroke-width="1.9" fill="none" stroke-linecap="round" /><path d="M1.7 -0.5 L2.6 8.5" stroke="#0a0507" stroke-width="1.9" fill="none" stroke-linecap="round" /></g>
          <g transform="translate(212,156) rotate(-3)"><circle cx="0" cy="-10" r="2.8" /><path d="M-2.7 -7.8 Q0 -8.9 2.7 -7.8 L3.3 -0.5 L-3.3 -0.5 Z" /><path d="M-1.6 -0.5 L-2.4 7.8" stroke="#0a0507" stroke-width="1.75" fill="none" stroke-linecap="round" /><path d="M1.6 -0.5 L2.4 7.8" stroke="#0a0507" stroke-width="1.75" fill="none" stroke-linecap="round" /></g>
        </g>
        <!-- 红旗 -->
        <path d="M232 118 L232 158" stroke="#c9a24a" stroke-width="2" />
        <path d="M233 119 C246 121 258 126 268 124 L266 136 C256 138 244 133 233 132 Z" fill="#d92b3a" />
        <path d="M233 119 C246 121 258 126 268 124" fill="none" stroke="#f0d08a" stroke-width="0.7" opacity="0.6" />
        <!-- 前景芦苇框景 -->
        <g stroke="#3d2a1c" stroke-width="2" stroke-linecap="round" opacity="0.95">
          <path d="M8 180 L4 138" /><path d="M20 180 L18 146" /><path d="M32 180 L34 152" />
          <path d="M312 180 L316 142" /><path d="M300 180 L302 150" />
        </g>
        <g fill="#6b4f2a" opacity="0.85">
          <ellipse cx="4" cy="135" rx="3" ry="7" /><ellipse cx="18" cy="143" rx="2.7" ry="6.4" />
          <ellipse cx="34" cy="149" rx="3" ry="7" /><ellipse cx="316" cy="139" rx="3" ry="7" />
          <ellipse cx="302" cy="147" rx="2.7" ry="6.4" />
        </g>
      </g>

      <!-- ==================== 抢渡江河 ==================== -->
      <g v-else-if="scene === 'river'">
        <circle cx="60" cy="66" r="42" fill="url(#lmSun)" opacity="0.55" />
        <!-- 对岸群山 -->
        <path d="M0 88 L28 68 L54 84 L86 62 L118 86 L148 68 L182 90 L214 72 L248 92 L282 74 L320 94 L320 118 L0 118 Z" fill="url(#lmFar)" />
        <rect x="0" y="84" width="320" height="24" fill="url(#lmMist)" opacity="0.7" />
        <!-- 对岸火光 -->
        <circle cx="286" cy="92" r="26" fill="url(#lmFire)" opacity="0.85" />
        <circle cx="286" cy="92" r="3.4" fill="#fff0bd" />
        <circle cx="34" cy="96" r="16" fill="url(#lmFire)" opacity="0.6" />
        <!-- 江面 -->
        <rect x="0" y="112" width="320" height="68" fill="url(#lmWater)" />
        <g stroke="#9a5765" stroke-width="1.15" fill="none" opacity="0.5">
          <path d="M0 122 C40 117 70 127 108 122 C146 117 178 127 216 122 C254 117 286 127 320 122" />
          <path d="M0 136 C44 131 74 141 112 136 C150 131 182 141 220 136 C258 131 290 141 320 136" />
          <path d="M0 152 C40 147 70 157 108 152 C146 147 178 157 216 152 C254 147 286 157 320 152" />
          <path d="M0 168 C44 163 74 173 112 168 C150 163 182 173 220 168 C258 163 290 173 320 168" />
        </g>
        <!-- 火光倒影 -->
        <path d="M276 112 L296 112 L292 168 L280 168 Z" fill="#e8a03a" opacity="0.14" />
        <!-- 主渡船 -->
        <g>
          <path d="M84 128 L162 128 L152 142 L94 142 Z" fill="#1a0e13" stroke="#c9a24a" stroke-width="1.2" />
          <path d="M84 128 L162 128" stroke="#e8c766" stroke-width="0.8" opacity="0.5" />
          <!-- 竹篙 -->
          <path d="M120 100 L132 130" stroke="#b98a4a" stroke-width="1.6" stroke-linecap="round" />
          <path d="M148 98 L142 128" stroke="#b98a4a" stroke-width="1.6" stroke-linecap="round" />
          <g fill="#0a0507">
            <g transform="translate(104,124)"><circle cx="0" cy="-10" r="2.9" /><path d="M-2.8 -7.7 Q0 -8.8 2.8 -7.7 L3.4 -0.4 L-3.4 -0.4 Z" /></g>
            <g transform="translate(126,122)"><circle cx="0" cy="-10" r="2.9" /><path d="M-2.8 -7.7 Q0 -8.8 2.8 -7.7 L3.4 -0.4 L-3.4 -0.4 Z" /></g>
            <g transform="translate(146,124)"><circle cx="0" cy="-9.6" r="2.7" /><path d="M-2.6 -7.5 Q0 -8.5 2.6 -7.5 L3.2 -0.4 L-3.2 -0.4 Z" /></g>
          </g>
        </g>
        <!-- 远处第二只船 -->
        <g opacity="0.65">
          <path d="M206 118 L252 118 L246 127 L212 127 Z" fill="#1a0e13" stroke="#c9a24a" stroke-width="0.9" />
          <path d="M228 102 L234 118" stroke="#b98a4a" stroke-width="1.2" />
          <g fill="#0a0507"><g transform="translate(222,114)"><circle cx="0" cy="-8" r="2.3" /><path d="M-2.2 -6.3 Q0 -7.2 2.2 -6.3 L2.7 -0.4 L-2.7 -0.4 Z" /></g></g>
        </g>
        <!-- 前景浪头 -->
        <path d="M0 176 C40 170 70 180 108 175 C146 170 178 180 216 175 C254 170 286 180 320 175 L320 180 L0 180 Z" fill="#0d0709" opacity="0.7" />
      </g>

      <!-- ==================== 铁索桥 ==================== -->
      <g v-else-if="scene === 'chains'">
        <circle cx="256" cy="88" r="62" fill="url(#lmFire)" opacity="0.8" />
        <!-- 崖壁（左右夹峙） -->
        <path d="M0 0 L84 0 L74 44 L82 92 L66 138 L72 180 L0 180 Z" fill="url(#lmRock)" />
        <path d="M320 0 L232 0 L244 40 L234 88 L250 134 L242 180 L320 180 Z" fill="url(#lmRock)" />
        <g stroke="#3d2229" stroke-width="1" opacity="0.7">
          <path d="M18 18 L46 34" /><path d="M14 58 L52 70" /><path d="M22 104 L58 112" /><path d="M16 146 L54 154" />
          <path d="M302 22 L272 38" /><path d="M306 62 L268 74" /><path d="M298 108 L262 116" /><path d="M304 150 L266 158" />
        </g>
        <!-- 谷底江水 -->
        <rect x="0" y="152" width="320" height="28" fill="url(#lmWater)" />
        <g stroke="#9a5765" stroke-width="1" fill="none" opacity="0.45">
          <path d="M0 160 C48 156 92 166 140 161 C188 156 232 166 280 161 C300 159 312 162 320 161" />
        </g>
        <!-- 十三根铁索（缆索下垂） -->
        <g stroke="#c6ab72" stroke-width="1.5" fill="none" opacity="0.92">
          <path d="M76 88 C130 106 190 106 244 88" />
          <path d="M76 96 C130 114 190 114 244 96" />
          <path d="M76 104 C130 122 190 122 244 104" />
          <path d="M76 112 C130 130 190 130 244 112" />
          <path d="M76 120 C130 138 190 138 244 120" />
        </g>
        <g stroke="#8f7a4e" stroke-width="0.9" fill="none" opacity="0.55">
          <path d="M76 92 C130 110 190 110 244 92" />
          <path d="M76 100 C130 118 190 118 244 100" />
          <path d="M76 108 C130 126 190 126 244 108" />
          <path d="M76 116 C130 134 190 134 244 116" />
        </g>
        <!-- 残存桥板 -->
        <g fill="#4a3324" stroke="#6b4c33" stroke-width="0.6">
          <rect x="78" y="86" width="22" height="6" rx="1.6" />
          <rect x="106" y="90" width="22" height="6" rx="1.6" />
          <rect x="134" y="94" width="18" height="6" rx="1.6" />
          <rect x="192" y="94" width="18" height="6" rx="1.6" />
          <rect x="218" y="90" width="22" height="6" rx="1.6" />
        </g>
        <!-- 攀索突击的战士 -->
        <g fill="#0a0507">
          <g transform="translate(150,102) rotate(-6)"><circle cx="0" cy="-10" r="3" /><path d="M-2.9 -7.7 Q0 -8.8 2.9 -7.7 L3.5 -0.4 L-3.5 -0.4 Z" /><path d="M-1.7 -0.4 L-2.6 9" stroke="#0a0507" stroke-width="1.9" fill="none" stroke-linecap="round" /><path d="M1.7 -0.4 L2.6 9" stroke="#0a0507" stroke-width="1.9" fill="none" stroke-linecap="round" /></g>
          <g transform="translate(172,106) rotate(-8)"><circle cx="0" cy="-10" r="2.9" /><path d="M-2.8 -7.7 Q0 -8.8 2.8 -7.7 L3.4 -0.4 L-3.4 -0.4 Z" /><path d="M-1.6 -0.4 L-2.5 9" stroke="#0a0507" stroke-width="1.85" fill="none" stroke-linecap="round" /><path d="M1.6 -0.4 L2.5 9" stroke="#0a0507" stroke-width="1.85" fill="none" stroke-linecap="round" /></g>
        </g>
        <!-- 桥头火光与掩体 -->
        <circle cx="252" cy="90" r="4" fill="#fff0bd" />
        <path d="M238 84 L262 84 L258 96 L242 96 Z" fill="#170b10" opacity="0.85" />
        <!-- 近景岩缘 -->
        <path d="M0 168 C36 154 66 166 96 158 L96 180 L0 180 Z" fill="#0b0508" />
      </g>

      <!-- ==================== 大雪山 ==================== -->
      <g v-else-if="scene === 'snow'">
        <rect x="0" y="0" width="320" height="120" fill="#20303f" opacity="0.45" />
        <circle cx="238" cy="46" r="52" fill="url(#lmSun)" opacity="0.6" />
        <!-- 雪峰（受光面 + 背光面） -->
        <path d="M0 152 L34 96 L54 118 L88 52 L116 104 L146 74 L176 126 L208 60 L240 112 L272 84 L320 148 L320 180 L0 180 Z" fill="#7d93aa" />
        <path d="M88 52 L116 104 L104 112 L92 92 L74 108 Z" fill="#e8f0f8" />
        <path d="M208 60 L240 112 L228 120 L214 100 L198 116 Z" fill="#e8f0f8" />
        <path d="M34 96 L54 118 L44 126 L36 112 L24 122 Z" fill="#dfe9f2" opacity="0.9" />
        <path d="M272 84 L292 108 L282 116 L274 100 L262 112 Z" fill="#dfe9f2" opacity="0.85" />
        <path d="M146 74 L166 96 L156 104 L148 88 L136 100 Z" fill="#e8f0f8" opacity="0.9" />
        <rect x="0" y="112" width="320" height="26" fill="url(#lmMist)" opacity="0.8" />
        <!-- 雪原 -->
        <path d="M0 148 C56 140 106 156 166 148 C226 140 276 156 320 148 L320 180 L0 180 Z" fill="#c3d2e0" opacity="0.55" />
        <path d="M0 162 C60 154 112 168 172 160 C232 152 282 168 320 160 L320 180 L0 180 Z" fill="#dfe9f2" opacity="0.35" />
        <!-- 风雪流线 -->
        <g stroke="#eef4fa" stroke-width="1.1" opacity="0.32" stroke-linecap="round">
          <path d="M34 34 L64 41" /><path d="M96 20 L126 27" /><path d="M168 30 L198 37" />
          <path d="M244 18 L274 25" /><path d="M204 52 L234 59" /><path d="M52 66 L82 73" />
        </g>
        <!-- 翻山的队伍（沿山脊小队列） -->
        <g fill="#0a0507">
          <g transform="translate(96,142) rotate(-6)"><circle cx="0" cy="-9.6" r="2.8" /><path d="M-2.7 -7.5 Q0 -8.5 2.7 -7.5 L3.3 -0.4 L-3.3 -0.4 Z" /><path d="M-1.6 -0.4 L-2.4 8" stroke="#0a0507" stroke-width="1.8" fill="none" stroke-linecap="round" /><path d="M1.6 -0.4 L2.4 8" stroke="#0a0507" stroke-width="1.8" fill="none" stroke-linecap="round" /></g>
          <g transform="translate(112,145) rotate(-4)"><circle cx="0" cy="-9.4" r="2.7" /><path d="M-2.6 -7.4 Q0 -8.4 2.6 -7.4 L3.2 -0.4 L-3.2 -0.4 Z" /><path d="M-1.5 -0.4 L-2.3 7.8" stroke="#0a0507" stroke-width="1.75" fill="none" stroke-linecap="round" /><path d="M1.5 -0.4 L2.3 7.8" stroke="#0a0507" stroke-width="1.75" fill="none" stroke-linecap="round" /></g>
          <g transform="translate(128,143) rotate(-7)"><circle cx="0" cy="-9.6" r="2.8" /><path d="M-2.7 -7.5 Q0 -8.5 2.7 -7.5 L3.3 -0.4 L-3.3 -0.4 Z" /><path d="M-1.6 -0.4 L-2.4 8" stroke="#0a0507" stroke-width="1.8" fill="none" stroke-linecap="round" /><path d="M1.6 -0.4 L2.4 8" stroke="#0a0507" stroke-width="1.8" fill="none" stroke-linecap="round" /></g>
          <g transform="translate(144,146) rotate(-5)"><circle cx="0" cy="-9.2" r="2.6" /><path d="M-2.5 -7.2 Q0 -8.2 2.5 -7.2 L3.1 -0.4 L-3.1 -0.4 Z" /><path d="M-1.5 -0.4 L-2.2 7.6" stroke="#0a0507" stroke-width="1.7" fill="none" stroke-linecap="round" /><path d="M1.5 -0.4 L2.2 7.6" stroke="#0a0507" stroke-width="1.7" fill="none" stroke-linecap="round" /></g>
        </g>
      </g>

      <!-- ==================== 穿越草地 ==================== -->
      <g v-else-if="scene === 'grass'">
        <circle cx="76" cy="60" r="46" fill="url(#lmSun)" opacity="0.4" />
        <!-- 远山淡影 -->
        <path d="M0 96 L48 82 L96 98 L148 84 L200 100 L252 86 L304 100 L320 94 L320 116 L0 116 Z" fill="#2a1820" opacity="0.75" />
        <rect x="0" y="92" width="320" height="30" fill="url(#lmMist)" opacity="0.9" />
        <!-- 草甸 -->
        <path d="M0 118 C70 112 130 126 200 118 C250 112 292 122 320 118 L320 180 L0 180 Z" fill="#221a18" />
        <path d="M0 140 C74 134 134 148 204 140 C254 134 294 144 320 140 L320 180 L0 180 Z" fill="#191313" />
        <!-- 沼泽水洼（带反光） -->
        <g>
          <ellipse cx="72" cy="146" rx="36" ry="8" fill="#3d222a" />
          <ellipse cx="196" cy="158" rx="46" ry="9" fill="#3d222a" />
          <ellipse cx="288" cy="140" rx="26" ry="6.4" fill="#3d222a" />
          <g stroke="#8a5560" stroke-width="0.9" fill="none" opacity="0.5">
            <path d="M42 146 C58 143 84 149 102 146" />
            <path d="M156 158 C176 155 214 161 236 158" />
          </g>
        </g>
        <!-- 苇丛 -->
        <g stroke="#5a4830" stroke-width="1.7" stroke-linecap="round" opacity="0.92">
          <path d="M18 138 L18 96" /><path d="M30 140 L26 104" /><path d="M42 138 L46 100" />
          <path d="M118 132 L114 92" /><path d="M130 134 L134 98" />
          <path d="M244 140 L240 100" /><path d="M256 142 L260 108" />
          <path d="M296 138 L292 104" /><path d="M308 140 L312 112" />
        </g>
        <g fill="#8a6b3a" opacity="0.85">
          <ellipse cx="18" cy="93" rx="2.7" ry="6.2" /><ellipse cx="26" cy="101" rx="2.4" ry="5.6" />
          <ellipse cx="46" cy="97" rx="2.7" ry="6.2" /><ellipse cx="114" cy="89" rx="2.5" ry="5.8" />
          <ellipse cx="134" cy="95" rx="2.7" ry="6.2" /><ellipse cx="240" cy="97" rx="2.5" ry="5.8" />
          <ellipse cx="260" cy="105" rx="2.7" ry="6.2" /><ellipse cx="292" cy="101" rx="2.4" ry="5.6" />
          <ellipse cx="312" cy="109" rx="2.7" ry="6.2" />
        </g>
        <!-- 涉水前行的队伍 -->
        <g fill="#0a0507">
          <g transform="translate(96,148) rotate(-5)"><circle cx="0" cy="-9.6" r="2.8" /><path d="M-2.7 -7.5 Q0 -8.5 2.7 -7.5 L3.3 -0.4 L-3.3 -0.4 Z" /><path d="M-1.6 -0.4 L-2.4 7.6" stroke="#0a0507" stroke-width="1.8" fill="none" stroke-linecap="round" /><path d="M1.6 -0.4 L2.4 7.6" stroke="#0a0507" stroke-width="1.8" fill="none" stroke-linecap="round" /></g>
          <g transform="translate(114,152) rotate(-3)"><circle cx="0" cy="-9.4" r="2.7" /><path d="M-2.6 -7.4 Q0 -8.4 2.6 -7.4 L3.2 -0.4 L-3.2 -0.4 Z" /><path d="M-1.5 -0.4 L-2.3 7.4" stroke="#0a0507" stroke-width="1.75" fill="none" stroke-linecap="round" /><path d="M1.5 -0.4 L2.3 7.4" stroke="#0a0507" stroke-width="1.75" fill="none" stroke-linecap="round" /></g>
          <g transform="translate(132,149) rotate(-6)"><circle cx="0" cy="-9.6" r="2.8" /><path d="M-2.7 -7.5 Q0 -8.5 2.7 -7.5 L3.3 -0.4 L-3.3 -0.4 Z" /><path d="M-1.6 -0.4 L-2.4 7.6" stroke="#0a0507" stroke-width="1.8" fill="none" stroke-linecap="round" /><path d="M1.6 -0.4 L2.4 7.6" stroke="#0a0507" stroke-width="1.8" fill="none" stroke-linecap="round" /></g>
          <g transform="translate(150,154) rotate(-3)"><circle cx="0" cy="-9" r="2.6" /><path d="M-2.5 -7.1 Q0 -8 2.5 -7.1 L3 -0.4 L-3 -0.4 Z" /><path d="M-1.4 -0.4 L-2.2 7.2" stroke="#0a0507" stroke-width="1.7" fill="none" stroke-linecap="round" /><path d="M1.4 -0.4 L2.2 7.2" stroke="#0a0507" stroke-width="1.7" fill="none" stroke-linecap="round" /></g>
        </g>
        <!-- 前景芦苇框景 -->
        <g stroke="#2e2114" stroke-width="2.4" stroke-linecap="round">
          <path d="M6 180 L2 128" /><path d="M22 180 L20 140" />
          <path d="M300 180 L304 132" /><path d="M316 180 L318 144" />
        </g>
        <g fill="#4a3a20" opacity="0.9">
          <ellipse cx="2" cy="124" rx="3.2" ry="7.4" /><ellipse cx="20" cy="136" rx="2.9" ry="6.8" />
          <ellipse cx="304" cy="128" rx="3.2" ry="7.4" /><ellipse cx="318" cy="140" rx="2.9" ry="6.8" />
        </g>
      </g>

      <!-- ==================== 重要会议 ==================== -->
      <g v-else-if="scene === 'hall'">
        <circle cx="160" cy="98" r="86" fill="url(#lmSun)" opacity="0.42" />
        <circle cx="160" cy="98" r="44" fill="url(#lmSun)" opacity="0.4" />
        <!-- 远处屋影 -->
        <path d="M0 108 L30 100 L60 110 L92 100 L124 112 L124 132 L0 132 Z" fill="#1e1117" opacity="0.8" />
        <path d="M196 112 L228 100 L260 112 L292 102 L320 112 L320 132 L196 132 Z" fill="#1e1117" opacity="0.8" />
        <!-- 主体建筑：重檐 -->
        <path d="M58 92 L160 52 L262 92 Z" fill="#33202a" />
        <path d="M58 92 L160 52 L262 92" fill="none" stroke="#8a6b3a" stroke-width="1.8" />
        <path d="M70 90 L160 58 L250 90 Z" fill="#3d2731" />
        <path d="M70 90 L160 58 L250 90" fill="none" stroke="#a8843f" stroke-width="1" opacity="0.8" />
        <rect x="76" y="92" width="168" height="62" fill="#241720" />
        <rect x="76" y="92" width="168" height="62" fill="none" stroke="#4a3238" stroke-width="1.2" />
        <!-- 檐下彩画 -->
        <g fill="#8a6b3a" opacity="0.65">
          <rect x="82" y="94" width="10" height="5" /><rect x="98" y="94" width="10" height="5" />
          <rect x="114" y="94" width="10" height="5" /><rect x="130" y="94" width="10" height="5" />
          <rect x="146" y="94" width="10" height="5" /><rect x="162" y="94" width="10" height="5" />
          <rect x="178" y="94" width="10" height="5" /><rect x="194" y="94" width="10" height="5" />
          <rect x="210" y="94" width="10" height="5" /><rect x="226" y="94" width="10" height="5" />
        </g>
        <!-- 亮窗：窗内可见与会者剪影 -->
        <g>
          <rect x="96" y="112" width="26" height="30" rx="2" fill="#e8c766" opacity="0.95" />
          <rect x="147" y="112" width="26" height="30" rx="2" fill="#f0d68a" />
          <rect x="198" y="112" width="26" height="30" rx="2" fill="#e8c766" opacity="0.95" />
          <g fill="#2a1418" opacity="0.85">
            <g transform="translate(104,140) scale(0.62)"><circle cx="0" cy="-10" r="3.4" /><path d="M-3.2 -7 Q0 -8.2 3.2 -7 L3.8 -0.4 L-3.8 -0.4 Z" /></g>
            <g transform="translate(115,141) scale(0.62)"><circle cx="0" cy="-10" r="3.4" /><path d="M-3.2 -7 Q0 -8.2 3.2 -7 L3.8 -0.4 L-3.8 -0.4 Z" /></g>
            <g transform="translate(155,140) scale(0.62)"><circle cx="0" cy="-10" r="3.4" /><path d="M-3.2 -7 Q0 -8.2 3.2 -7 L3.8 -0.4 L-3.8 -0.4 Z" /></g>
            <g transform="translate(166,141) scale(0.62)"><circle cx="0" cy="-10" r="3.4" /><path d="M-3.2 -7 Q0 -8.2 3.2 -7 L3.8 -0.4 L-3.8 -0.4 Z" /></g>
            <g transform="translate(206,140) scale(0.62)"><circle cx="0" cy="-10" r="3.4" /><path d="M-3.2 -7 Q0 -8.2 3.2 -7 L3.8 -0.4 L-3.8 -0.4 Z" /></g>
            <g transform="translate(217,141) scale(0.62)"><circle cx="0" cy="-10" r="3.4" /><path d="M-3.2 -7 Q0 -8.2 3.2 -7 L3.8 -0.4 L-3.8 -0.4 Z" /></g>
          </g>
          <!-- 门 -->
          <rect x="152" y="146" width="16" height="8" rx="1.4" fill="#3a222a" />
        </g>
        <!-- 台阶 -->
        <rect x="66" y="154" width="188" height="5" rx="2" fill="#33202a" />
        <rect x="56" y="159" width="208" height="5" rx="2" fill="#27181f" />
        <rect x="46" y="164" width="228" height="5" rx="2" fill="#1d1218" />
        <rect x="36" y="169" width="248" height="6" rx="2" fill="#150c11" />
        <!-- 前景树影框景 -->
        <path d="M0 0 C26 8 42 26 46 48 C50 70 40 88 22 96 C10 101 4 96 0 88 Z" fill="#0b0508" opacity="0.9" />
        <path d="M320 0 C296 10 282 30 278 52 C274 72 284 88 300 94 C310 98 316 94 320 86 Z" fill="#0b0508" opacity="0.9" />
      </g>

      <!-- ==================== 胜利会师 ==================== -->
      <g v-else-if="scene === 'join'">
        <circle cx="160" cy="76" r="92" fill="url(#lmSun)" opacity="0.5" />
        <path d="M0 120 L40 104 L82 122 L126 102 L172 124 L216 106 L260 126 L300 110 L320 120 L320 180 L0 180 Z" fill="url(#lmFar)" />
        <rect x="0" y="114" width="320" height="22" fill="url(#lmMist)" opacity="0.65" />
        <path d="M0 144 L52 132 L104 148 L158 134 L214 150 L268 138 L320 152 L320 180 L0 180 Z" fill="url(#lmMid)" />
        <!-- 两面旗交叉汇聚 -->
        <path d="M118 166 L104 46" stroke="#c9a24a" stroke-width="2.2" />
        <path d="M104 46 C122 50 140 58 152 56 L148 74 C136 76 118 68 103 66 Z" fill="#d92b3a" />
        <path d="M202 166 L216 46" stroke="#c9a24a" stroke-width="2.2" />
        <path d="M216 46 C198 50 180 58 168 56 L172 74 C184 76 202 68 217 66 Z" fill="#d92b3a" />
        <!-- 会合的人群（前后两排，制造纵深） -->
        <g fill="#150b10">
          <g transform="translate(120,150)"><circle cx="0" cy="-10" r="3" /><path d="M-2.9 -7.7 Q0 -8.8 2.9 -7.7 L3.5 -0.4 L-3.5 -0.4 Z" /></g>
          <g transform="translate(142,148)"><circle cx="0" cy="-10" r="3" /><path d="M-2.9 -7.7 Q0 -8.8 2.9 -7.7 L3.5 -0.4 L-3.5 -0.4 Z" /></g>
          <g transform="translate(178,148)"><circle cx="0" cy="-10" r="3" /><path d="M-2.9 -7.7 Q0 -8.8 2.9 -7.7 L3.5 -0.4 L-3.5 -0.4 Z" /></g>
          <g transform="translate(200,150)"><circle cx="0" cy="-10" r="3" /><path d="M-2.9 -7.7 Q0 -8.8 2.9 -7.7 L3.5 -0.4 L-3.5 -0.4 Z" /></g>
        </g>
        <g fill="#0a0507">
          <g transform="translate(132,158)"><circle cx="0" cy="-11" r="3.3" /><path d="M-3.1 -8.4 Q0 -9.6 3.1 -8.4 L3.8 -0.4 L-3.8 -0.4 Z" /><path d="M-1.8 -0.4 L-2.7 8.6" stroke="#0a0507" stroke-width="2" fill="none" stroke-linecap="round" /><path d="M1.8 -0.4 L2.7 8.6" stroke="#0a0507" stroke-width="2" fill="none" stroke-linecap="round" /></g>
          <g transform="translate(160,156)"><circle cx="0" cy="-11.6" r="3.5" /><path d="M-3.3 -8.8 Q0 -10 3.3 -8.8 L4 -0.4 L-4 -0.4 Z" /><path d="M-1.9 -0.4 L-2.9 9" stroke="#0a0507" stroke-width="2.1" fill="none" stroke-linecap="round" /><path d="M1.9 -0.4 L2.9 9" stroke="#0a0507" stroke-width="2.1" fill="none" stroke-linecap="round" /></g>
          <g transform="translate(188,158)"><circle cx="0" cy="-11" r="3.3" /><path d="M-3.1 -8.4 Q0 -9.6 3.1 -8.4 L3.8 -0.4 L-3.8 -0.4 Z" /><path d="M-1.8 -0.4 L-2.7 8.6" stroke="#0a0507" stroke-width="2" fill="none" stroke-linecap="round" /><path d="M1.8 -0.4 L2.7 8.6" stroke="#0a0507" stroke-width="2" fill="none" stroke-linecap="round" /></g>
        </g>
        <!-- 握手 -->
        <path d="M152 140 L168 140" stroke="#e8c766" stroke-width="2.6" stroke-linecap="round" />
        <!-- 前景山坡 -->
        <path d="M0 168 C48 158 96 172 148 164 C200 156 252 172 320 162 L320 180 L0 180 Z" fill="#0b0508" />
      </g>

      <!-- ==================== 民族团结（彝海结盟） ==================== -->
      <g v-else-if="scene === 'unity'">
        <circle cx="250" cy="44" r="44" fill="url(#lmSun)" opacity="0.4" />
        <circle cx="250" cy="44" r="14" fill="#f4ecd0" opacity="0.7" />
        <path d="M0 100 L40 84 L84 102 L130 82 L178 104 L226 86 L272 104 L320 88 L320 118 L0 118 Z" fill="url(#lmFar)" />
        <rect x="0" y="94" width="320" height="24" fill="url(#lmMist)" opacity="0.6" />
        <!-- 湖面 -->
        <rect x="0" y="116" width="320" height="64" fill="url(#lmWater)" />
        <g stroke="#9a5765" stroke-width="1" fill="none" opacity="0.42">
          <path d="M0 128 C50 123 90 133 140 128 C190 123 230 133 280 128 C300 126 312 129 320 128" />
          <path d="M0 144 C52 139 92 149 142 144 C192 139 232 149 282 144 C302 142 312 145 320 144" />
          <path d="M0 160 C50 155 90 165 140 160 C190 155 230 165 280 160 C300 158 312 161 320 160" />
        </g>
        <!-- 月光倒影 -->
        <path d="M240 116 L260 116 L256 172 L244 172 Z" fill="#f4ecd0" opacity="0.12" />
        <!-- 岸边两人相对、握手为盟 -->
        <g fill="#0a0507">
          <g transform="translate(126,124)"><circle cx="0" cy="-12" r="3.8" /><path d="M-3.6 -9.2 Q0 -10.6 3.6 -9.2 L4.4 -0.4 L-4.4 -0.4 Z" /><path d="M-2.1 -0.4 L-3.1 14" stroke="#0a0507" stroke-width="2.3" fill="none" stroke-linecap="round" /><path d="M2.1 -0.4 L3.1 14" stroke="#0a0507" stroke-width="2.3" fill="none" stroke-linecap="round" /></g>
          <g transform="translate(194,124)"><circle cx="0" cy="-12" r="3.8" /><path d="M-3.6 -9.2 Q0 -10.6 3.6 -9.2 L4.4 -0.4 L-4.4 -0.4 Z" /><path d="M-2.1 -0.4 L-3.1 14" stroke="#0a0507" stroke-width="2.3" fill="none" stroke-linecap="round" /><path d="M2.1 -0.4 L3.1 14" stroke="#0a0507" stroke-width="2.3" fill="none" stroke-linecap="round" /></g>
        </g>
        <path d="M136 110 L184 110" stroke="#e8c766" stroke-width="2.8" stroke-linecap="round" />
        <!-- 火把 -->
        <path d="M96 124 L90 172" stroke="#7a5a30" stroke-width="2.2" stroke-linecap="round" />
        <circle cx="97" cy="118" r="13" fill="url(#lmFire)" />
        <circle cx="97" cy="117" r="3.4" fill="#fff0bd" />
        <!-- 前景芦苇 -->
        <g stroke="#3a2a18" stroke-width="2" stroke-linecap="round">
          <path d="M10 180 L6 140" /><path d="M24 180 L22 150" />
          <path d="M300 180 L304 142" /><path d="M314 180 L316 152" />
        </g>
        <g fill="#59431f" opacity="0.85">
          <ellipse cx="6" cy="136" rx="2.8" ry="6.6" /><ellipse cx="22" cy="146" rx="2.5" ry="6" />
          <ellipse cx="304" cy="138" rx="2.8" ry="6.6" /><ellipse cx="316" cy="148" rx="2.5" ry="6" />
        </g>
      </g>

      <!-- ==================== 鏖战关隘 ==================== -->
      <g v-else-if="scene === 'pass'">
        <circle cx="160" cy="72" r="52" fill="url(#lmFire)" opacity="0.5" />
        <!-- 夹峙绝壁 -->
        <path d="M0 0 L100 0 L92 48 L100 96 L84 142 L90 180 L0 180 Z" fill="url(#lmRock)" />
        <path d="M320 0 L220 0 L230 44 L222 92 L238 138 L232 180 L320 180 Z" fill="url(#lmRock)" />
        <g stroke="#3d2229" stroke-width="1" opacity="0.65">
          <path d="M14 20 L54 34" /><path d="M10 62 L60 74" /><path d="M18 108 L64 118" /><path d="M12 150 L58 160" />
          <path d="M306 24 L266 38" /><path d="M310 66 L260 78" /><path d="M302 112 L256 122" /><path d="M308 154 L262 164" />
        </g>
        <!-- 隘口工事 -->
        <rect x="124" y="112" width="72" height="40" fill="#170c11" stroke="#4a3238" stroke-width="1.2" />
        <path d="M118 112 L202 112 L192 98 L128 98 Z" fill="#33202a" stroke="#4a3238" stroke-width="1" />
        <rect x="150" y="128" width="20" height="24" rx="2" fill="#0a0507" stroke="#8a6b3a" stroke-width="1" />
        <!-- 射击孔火光 -->
        <circle cx="196" cy="106" r="16" fill="url(#lmFire)" />
        <circle cx="196" cy="106" r="3" fill="#fff0bd" />
        <circle cx="124" cy="104" r="11" fill="url(#lmFire)" opacity="0.85" />
        <!-- 弹道 -->
        <g stroke="#ffd9a0" stroke-width="1.3" opacity="0.7" stroke-linecap="round">
          <path d="M84 74 L108 84" /><path d="M236 66 L212 76" /><path d="M160 54 L160 70" />
          <path d="M64 100 L92 100" /><path d="M256 96 L228 96" />
        </g>
        <!-- 仰攻的战士 -->
        <g fill="#0a0507">
          <g transform="translate(136,154) rotate(-4)"><circle cx="0" cy="-10" r="3" /><path d="M-2.9 -7.7 Q0 -8.8 2.9 -7.7 L3.5 -0.4 L-3.5 -0.4 Z" /><path d="M-1.7 -0.4 L-2.6 8.4" stroke="#0a0507" stroke-width="1.9" fill="none" stroke-linecap="round" /><path d="M1.7 -0.4 L2.6 8.4" stroke="#0a0507" stroke-width="1.9" fill="none" stroke-linecap="round" /></g>
          <g transform="translate(156,157) rotate(-2)"><circle cx="0" cy="-9.6" r="2.8" /><path d="M-2.7 -7.5 Q0 -8.5 2.7 -7.5 L3.3 -0.4 L-3.3 -0.4 Z" /><path d="M-1.6 -0.4 L-2.4 8" stroke="#0a0507" stroke-width="1.8" fill="none" stroke-linecap="round" /><path d="M1.6 -0.4 L2.4 8" stroke="#0a0507" stroke-width="1.8" fill="none" stroke-linecap="round" /></g>
          <g transform="translate(176,154) rotate(-5)"><circle cx="0" cy="-10" r="3" /><path d="M-2.9 -7.7 Q0 -8.8 2.9 -7.7 L3.5 -0.4 L-3.5 -0.4 Z" /><path d="M-1.7 -0.4 L-2.6 8.4" stroke="#0a0507" stroke-width="1.9" fill="none" stroke-linecap="round" /><path d="M1.7 -0.4 L2.6 8.4" stroke="#0a0507" stroke-width="1.9" fill="none" stroke-linecap="round" /></g>
        </g>
        <!-- 前景岩石 -->
        <path d="M0 172 C24 162 44 172 62 166 L62 180 L0 180 Z" fill="#0b0508" />
        <path d="M320 172 C296 160 276 172 258 166 L258 180 L320 180 Z" fill="#0b0508" />
      </g>

      <!-- ==================== 回旋运动战 ==================== -->
      <g v-else-if="scene === 'maneuver'">
        <rect x="0" y="0" width="320" height="180" fill="#140c11" />
        <circle cx="270" cy="34" r="46" fill="url(#lmSun)" opacity="0.3" />
        <!-- 等高线地形 -->
        <g fill="none" stroke="#3f2830" stroke-width="1.1">
          <path d="M0 112 C56 100 106 122 166 108 C226 94 276 116 320 106" />
          <path d="M0 126 C60 114 110 136 170 122 C230 108 280 130 320 120" />
          <path d="M0 140 C64 128 114 150 174 136 C234 122 284 144 320 134" />
          <path d="M0 154 C68 142 118 164 178 150 C238 136 288 158 320 148" />
          <path d="M0 168 C72 156 122 178 182 164 C242 150 292 172 320 162" />
          <path d="M0 98 C52 86 102 108 162 94 C222 80 272 102 320 92" />
        </g>
        <g fill="none" stroke="#542f38" stroke-width="0.8" opacity="0.6">
          <path d="M0 118 C58 107 108 129 168 115 C228 101 278 123 320 113" />
          <path d="M0 148 C66 136 116 158 176 144 C236 130 286 152 320 142" />
        </g>
        <!-- 往返穿插的四条箭头 -->
        <g fill="none" stroke="#d92b3a" stroke-width="2.6" stroke-linecap="round" opacity="0.95">
          <path d="M38 108 C94 66 158 96 206 60" />
          <path d="M206 60 C248 34 280 74 242 100" />
          <path d="M242 100 C198 130 126 100 80 128" />
          <path d="M80 128 C44 148 18 122 42 102" />
        </g>
        <g fill="#e8c766">
          <path d="M206 60 L192 58 L200 69 Z" />
          <path d="M242 100 L249 87 L235 90 Z" />
          <path d="M80 128 L92 134 L89 121 Z" />
          <path d="M42 102 L33 113 L47 112 Z" />
        </g>
        <!-- 部队点位 -->
        <g stroke="#d4af37" stroke-width="1">
          <g fill="#12070a"><circle cx="38" cy="108" r="5" /><circle cx="206" cy="60" r="5" /><circle cx="242" cy="100" r="5" /><circle cx="80" cy="128" r="5" /></g>
        </g>
        <g fill="#d92b3a">
          <circle cx="38" cy="108" r="1.6" /><circle cx="206" cy="60" r="1.6" /><circle cx="242" cy="100" r="1.6" /><circle cx="80" cy="128" r="1.6" />
        </g>
        <!-- 敌军封锁方向 -->
        <g stroke="#7a5560" stroke-width="1.4" stroke-dasharray="5 4" opacity="0.75">
          <path d="M196 0 L204 180" /><path d="M292 0 L286 180" />
        </g>
      </g>

      <!-- ==================== 长征胜利 ==================== -->
      <g v-else-if="scene === 'end'">
        <!-- 破晓光芒 -->
        <g fill="#e8c766" opacity="0.1">
          <path d="M160 104 L44 0 L112 0 Z" /><path d="M160 104 L208 0 L276 0 Z" />
          <path d="M160 104 L300 34 L320 74 Z" /><path d="M160 104 L20 34 L0 74 Z" />
        </g>
        <circle cx="160" cy="104" r="40" fill="url(#lmSun)" />
        <circle cx="160" cy="104" r="15" fill="#ffe6a8" opacity="0.55" />
        <!-- 远处高原 -->
        <path d="M0 118 L48 104 L98 120 L152 100 L206 122 L256 106 L306 124 L320 118 L320 180 L0 180 Z" fill="url(#lmFar)" />
        <rect x="0" y="112" width="320" height="22" fill="url(#lmMist)" opacity="0.6" />
        <path d="M0 142 L56 130 L114 146 L170 130 L228 148 L284 134 L320 144 L320 180 L0 180 Z" fill="url(#lmMid)" />
        <!-- 高台 -->
        <path d="M0 160 C60 150 112 166 172 156 C232 146 282 162 320 154 L320 180 L0 180 Z" fill="url(#lmNear)" />
        <!-- 大旗 -->
        <path d="M156 102 L156 172" stroke="#c9a24a" stroke-width="2.8" />
        <path d="M157 104 C178 108 200 118 218 114 L214 136 C196 140 176 130 157 126 Z" fill="#d92b3a" />
        <path d="M157 104 C178 108 200 118 218 114" fill="none" stroke="#f0d08a" stroke-width="0.9" opacity="0.65" />
        <!-- 抵达的队伍 -->
        <g fill="#0a0507">
          <g transform="translate(110,150) rotate(-4)"><circle cx="0" cy="-10" r="3" /><path d="M-2.9 -7.7 Q0 -8.8 2.9 -7.7 L3.5 -0.4 L-3.5 -0.4 Z" /><path d="M-1.7 -0.4 L-2.6 8.6" stroke="#0a0507" stroke-width="1.9" fill="none" stroke-linecap="round" /><path d="M1.7 -0.4 L2.6 8.6" stroke="#0a0507" stroke-width="1.9" fill="none" stroke-linecap="round" /></g>
          <g transform="translate(128,154) rotate(-2)"><circle cx="0" cy="-9.6" r="2.8" /><path d="M-2.7 -7.5 Q0 -8.5 2.7 -7.5 L3.3 -0.4 L-3.3 -0.4 Z" /><path d="M-1.6 -0.4 L-2.4 8.2" stroke="#0a0507" stroke-width="1.8" fill="none" stroke-linecap="round" /><path d="M1.6 -0.4 L2.4 8.2" stroke="#0a0507" stroke-width="1.8" fill="none" stroke-linecap="round" /></g>
          <g transform="translate(206,152) rotate(-5)"><circle cx="0" cy="-10" r="3" /><path d="M-2.9 -7.7 Q0 -8.8 2.9 -7.7 L3.5 -0.4 L-3.5 -0.4 Z" /><path d="M-1.7 -0.4 L-2.6 8.6" stroke="#0a0507" stroke-width="1.9" fill="none" stroke-linecap="round" /><path d="M1.7 -0.4 L2.6 8.6" stroke="#0a0507" stroke-width="1.9" fill="none" stroke-linecap="round" /></g>
          <g transform="translate(226,155) rotate(-3)"><circle cx="0" cy="-9.4" r="2.7" /><path d="M-2.6 -7.4 Q0 -8.4 2.6 -7.4 L3.2 -0.4 L-3.2 -0.4 Z" /><path d="M-1.5 -0.4 L-2.3 8" stroke="#0a0507" stroke-width="1.75" fill="none" stroke-linecap="round" /><path d="M1.5 -0.4 L2.3 8" stroke="#0a0507" stroke-width="1.75" fill="none" stroke-linecap="round" /></g>
        </g>
        <!-- 飞鸟 -->
        <g stroke="#0b0508" stroke-width="1.4" fill="none" opacity="0.7" stroke-linecap="round">
          <path d="M62 52 q5 -4 10 0 q5 -4 10 0" /><path d="M88 40 q4 -3 8 0 q4 -3 8 0" />
          <path d="M240 56 q4 -3 8 0 q4 -3 8 0" />
        </g>
      </g>

      <!-- ==================== 行军（兜底场景） ==================== -->
      <g v-else>
        <circle cx="70" cy="52" r="44" fill="url(#lmSun)" opacity="0.4" />
        <g fill="#e8eef4" opacity="0.55">
          <circle cx="52" cy="28" r="1.5" /><circle cx="86" cy="18" r="1.2" />
          <circle cx="126" cy="32" r="1.4" /><circle cx="168" cy="20" r="1.6" />
          <circle cx="212" cy="34" r="1.3" /><circle cx="252" cy="22" r="1.5" />
          <circle cx="290" cy="42" r="1.2" /><circle cx="196" cy="14" r="1" />
        </g>
        <!-- 层叠山脊 -->
        <path d="M0 118 L38 96 L74 116 L112 92 L152 120 L192 98 L232 122 L272 100 L320 124 L320 180 L0 180 Z" fill="url(#lmFar)" />
        <rect x="0" y="112" width="320" height="20" fill="url(#lmMist)" opacity="0.6" />
        <path d="M0 142 L46 126 L96 146 L148 128 L202 148 L254 132 L320 152 L320 180 L0 180 Z" fill="url(#lmMid)" />
        <path d="M0 162 C58 152 108 166 168 158 C228 150 280 164 320 156 L320 180 L0 180 Z" fill="url(#lmNear)" />
        <!-- 行军队列 -->
        <g fill="#0a0507">
          <g transform="translate(88,148) rotate(-5)"><circle cx="0" cy="-10" r="3" /><path d="M-2.9 -7.7 Q0 -8.8 2.9 -7.7 L3.5 -0.4 L-3.5 -0.4 Z" /><path d="M-1.7 -0.4 L-2.6 8.4" stroke="#0a0507" stroke-width="1.9" fill="none" stroke-linecap="round" /><path d="M1.7 -0.4 L2.6 8.4" stroke="#0a0507" stroke-width="1.9" fill="none" stroke-linecap="round" /></g>
          <g transform="translate(108,146) rotate(-6)"><circle cx="0" cy="-10" r="3" /><path d="M-2.9 -7.7 Q0 -8.8 2.9 -7.7 L3.5 -0.4 L-3.5 -0.4 Z" /><path d="M-1.7 -0.4 L-2.6 8.4" stroke="#0a0507" stroke-width="1.9" fill="none" stroke-linecap="round" /><path d="M1.7 -0.4 L2.6 8.4" stroke="#0a0507" stroke-width="1.9" fill="none" stroke-linecap="round" /></g>
          <g transform="translate(128,149) rotate(-4)"><circle cx="0" cy="-9.6" r="2.8" /><path d="M-2.7 -7.5 Q0 -8.5 2.7 -7.5 L3.3 -0.4 L-3.3 -0.4 Z" /><path d="M-1.6 -0.4 L-2.4 8" stroke="#0a0507" stroke-width="1.8" fill="none" stroke-linecap="round" /><path d="M1.6 -0.4 L2.4 8" stroke="#0a0507" stroke-width="1.8" fill="none" stroke-linecap="round" /></g>
          <g transform="translate(148,147) rotate(-7)"><circle cx="0" cy="-10" r="3" /><path d="M-2.9 -7.7 Q0 -8.8 2.9 -7.7 L3.5 -0.4 L-3.5 -0.4 Z" /><path d="M-1.7 -0.4 L-2.6 8.4" stroke="#0a0507" stroke-width="1.9" fill="none" stroke-linecap="round" /><path d="M1.7 -0.4 L2.6 8.4" stroke="#0a0507" stroke-width="1.9" fill="none" stroke-linecap="round" /></g>
          <g transform="translate(168,150) rotate(-3)"><circle cx="0" cy="-9.4" r="2.7" /><path d="M-2.6 -7.4 Q0 -8.4 2.6 -7.4 L3.2 -0.4 L-3.2 -0.4 Z" /><path d="M-1.5 -0.4 L-2.3 8" stroke="#0a0507" stroke-width="1.75" fill="none" stroke-linecap="round" /><path d="M1.5 -0.4 L2.3 8" stroke="#0a0507" stroke-width="1.75" fill="none" stroke-linecap="round" /></g>
        </g>
        <!-- 旗 -->
        <path d="M188 124 L188 160" stroke="#c9a24a" stroke-width="2" />
        <path d="M189 125 C202 127 214 132 224 130 L222 142 C212 144 200 139 189 138 Z" fill="#d92b3a" />
        <!-- 前景岩缘 -->
        <path d="M0 172 C30 162 56 174 84 166 L84 180 L0 180 Z" fill="#0b0508" />
        <path d="M320 174 C292 162 268 174 240 166 L240 180 L320 180 Z" fill="#0b0508" />
      </g>

      <!-- 统一暗角（置于所有场景之上，增强纵深） -->
      <rect x="0" y="0" width="320" height="180" fill="url(#lmVig)" />
    </svg>

    <!-- 明示这件配图是史料图片还是手绘插画，避免观众误把手绘当史料 -->
    <span v-if="!compact" class="artwork__kind">{{ photo ? '史料图片' : '手绘插画' }}</span>

    <figcaption v-if="!compact" class="artwork__cap">
      <span class="artwork__cap-title">
        {{ photo && credit && credit.title ? credit.title : title }}
      </span>
      <span class="artwork__cap-hint">
        <template v-if="photo && credit">
          {{ [credit.author, credit.license].filter(Boolean).join(' · ') || '出处见「资料来源」' }}
        </template>
        <template v-else>{{ hint }}</template>
      </span>
    </figcaption>
  </figure>
</template>

<style scoped>
.artwork {
  position: relative;
  margin: 0;
  border-radius: 14px;
  overflow: hidden;
  border: 1px solid var(--panel-border);
  background: #0d0709;
  aspect-ratio: 16 / 9;
}

.artwork__svg,
.artwork__photo {
  display: block;
  width: 100%;
  height: 100%;
}

.artwork__photo {
  object-fit: cover;
}

.artwork__cap {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
  padding: 8px 10px 7px;
  background: linear-gradient(180deg, rgba(8, 4, 6, 0) 0%, rgba(8, 4, 6, 0.9) 60%);
  font-size: 10.5px;
}

.artwork__cap-title {
  color: var(--color-gold-300);
  font-weight: 600;
  letter-spacing: 0.04em;
}

.artwork__cap-hint {
  color: var(--color-mist-500);
  text-align: right;
}

.artwork__kind {
  position: absolute;
  top: 8px;
  right: 8px;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 10.5px;
  letter-spacing: 0.04em;
  color: #e8eef4;
  background: rgba(8, 4, 6, 0.7);
  border: 1px solid var(--panel-border);
  backdrop-filter: blur(6px);
}

.artwork--compact {
  border-radius: 10px;
}

.artwork--compact .artwork__cap {
  display: none;
}
</style>
