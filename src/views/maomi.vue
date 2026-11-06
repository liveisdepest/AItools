
<template>
  <div class="cat-stage" :class="{ 'is-active': active }">
    <!-- 科技环 -->
    <div class="orbit orbit-outer"></div>
    <div class="orbit orbit-inner"></div>

    <!-- 装饰粒子 -->
    <span class="particle particle-a">✦</span>
    <span class="particle particle-b">✧</span>
    <span class="particle particle-c">·</span>
    <span class="particle particle-d">✦</span>

    <!-- 小猫 -->
    <div class="cat-float">
      <svg
        class="cat-svg"
        viewBox="0 0 320 340"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label="可爱的卡通小猫"
      >
        <defs>
          <linearGradient id="catFur" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#ffffff" />
            <stop offset="55%" stop-color="#e5eaf5" />
            <stop offset="100%" stop-color="#aebbd2" />
          </linearGradient>

          <linearGradient id="catDarkFur" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#8998b5" />
            <stop offset="100%" stop-color="#536582" />
          </linearGradient>

          <radialGradient id="catEye">
            <stop offset="0%" stop-color="#4ce6ff" />
            <stop offset="65%" stop-color="#248aff" />
            <stop offset="100%" stop-color="#153c92" />
          </radialGradient>

          <linearGradient id="collar" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#66f4ff" />
            <stop offset="100%" stop-color="#8b65ff" />
          </linearGradient>

          <filter id="catGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="5" />
          </filter>
        </defs>

        <!-- 发光阴影 -->
        <ellipse
          cx="160"
          cy="311"
          rx="83"
          ry="12"
          fill="#42cfff"
          opacity=".25"
          filter="url(#catGlow)"
        />

        <!-- 尾巴 -->
        <g class="cat-tail">
          <path
            d="M204 259 C270 278 287 227 259 201 C241 184 222 202 236 217"
            fill="none"
            stroke="#8998b5"
            stroke-width="35"
            stroke-linecap="round"
          />
          <path
            d="M204 259 C270 278 287 227 259 201 C241 184 222 202 236 217"
            fill="none"
            stroke="#dce4f1"
            stroke-width="25"
            stroke-linecap="round"
          />
          <path
            d="M254 199 Q267 208 264 222"
            fill="none"
            stroke="#8998b5"
            stroke-width="7"
            stroke-linecap="round"
          />
        </g>

        <!-- 身体 -->
        <ellipse
          cx="160"
          cy="246"
          rx="77"
          ry="66"
          fill="url(#catFur)"
        />

        <!-- 身体花纹 -->
        <path
          d="M113 205 Q133 220 116 241"
          fill="none"
          stroke="url(#catDarkFur)"
          stroke-width="12"
          stroke-linecap="round"
        />
        <path
          d="M153 190 Q172 209 154 226"
          fill="none"
          stroke="url(#catDarkFur)"
          stroke-width="12"
          stroke-linecap="round"
        />
        <path
          d="M193 205 Q211 220 196 238"
          fill="none"
          stroke="url(#catDarkFur)"
          stroke-width="12"
          stroke-linecap="round"
        />

        <!-- 双脚 -->
        <ellipse cx="124" cy="296" rx="32" ry="18" fill="#f5f7fc" />
        <ellipse cx="192" cy="296" rx="32" ry="18" fill="#f5f7fc" />

        <!-- 耳朵 -->
        <path
          d="M83 111 L75 36 Q74 20 91 32 L137 76 Z"
          fill="url(#catDarkFur)"
        />
        <path
          d="M94 89 L89 49 L116 77 Z"
          fill="#ffb9d0"
        />
        <path
          d="M181 76 L228 30 Q244 18 244 38 L237 117 Z"
          fill="url(#catDarkFur)"
        />
        <path
          d="M202 78 L232 47 L227 91 Z"
          fill="#ffb9d0"
        />

        <!-- 头部 -->
        <ellipse
          cx="160"
          cy="137"
          rx="101"
          ry="91"
          fill="url(#catFur)"
        />

        <!-- 额头花纹 -->
        <path
          d="M132 56 Q143 77 132 91"
          fill="none"
          stroke="#7e8da9"
          stroke-width="13"
          stroke-linecap="round"
        />
        <path
          d="M160 46 Q171 67 160 83"
          fill="none"
          stroke="#7e8da9"
          stroke-width="13"
          stroke-linecap="round"
        />
        <path
          d="M188 56 Q199 77 188 91"
          fill="none"
          stroke="#7e8da9"
          stroke-width="13"
          stroke-linecap="round"
        />

        <!-- 眼睛 -->
        <g class="cat-eye cat-eye-left">
          <ellipse cx="119" cy="137" rx="24" ry="29" fill="#fff" />
          <ellipse cx="122" cy="139" rx="18" ry="23" fill="url(#catEye)" />
          <ellipse cx="127" cy="132" rx="7" ry="9" fill="#fff" />
          <circle cx="114" cy="148" r="3" fill="#fff" opacity=".8" />
        </g>

        <g class="cat-eye cat-eye-right">
          <ellipse cx="201" cy="137" rx="24" ry="29" fill="#fff" />
          <ellipse cx="198" cy="139" rx="18" ry="23" fill="url(#catEye)" />
          <ellipse cx="203" cy="132" rx="7" ry="9" fill="#fff" />
          <circle cx="190" cy="148" r="3" fill="#fff" opacity=".8" />
        </g>

        <!-- 腮红 -->
        <ellipse cx="91" cy="167" rx="15" ry="7" fill="#ff9fbd" opacity=".55" />
        <ellipse cx="229" cy="167" rx="15" ry="7" fill="#ff9fbd" opacity=".55" />

        <!-- 鼻子 -->
        <path d="M153 164 Q160 158 167 164 Q160 174 153 164Z" fill="#ff8fab" />

        <!-- 嘴巴 -->
        <path
          d="M160 173 Q153 184 145 176 M160 173 Q167 184 175 176"
          fill="none"
          stroke="#65728c"
          stroke-width="3"
          stroke-linecap="round"
        />

        <!-- 胡须 -->
        <path
          d="M99 166 L65 158 M99 176 L66 180 M221 166 L255 158 M221 176 L254 180"
          stroke="#a2aec4"
          stroke-width="2"
          stroke-linecap="round"
        />

        <!-- 科技项圈 -->
        <path
          d="M103 211 Q160 234 217 211"
          fill="none"
          stroke="#263a64"
          stroke-width="13"
          stroke-linecap="round"
        />
        <path
          d="M103 211 Q160 234 217 211"
          fill="none"
          stroke="url(#collar)"
          stroke-width="5"
          stroke-linecap="round"
        />

        <!-- 猫爪徽章 -->
        <circle cx="160" cy="237" r="19" fill="#253b69" stroke="#69edff" stroke-width="2" />
        <g fill="#70edff">
          <ellipse cx="160" cy="239" rx="7" ry="6" />
          <circle cx="150" cy="231" r="4" />
          <circle cx="158" cy="226" r="4" />
          <circle cx="166" cy="226" r="4" />
          <circle cx="173" cy="232" r="4" />
        </g>

        <!-- 胸口装饰 -->
        <path
          d="M94 255 L104 266 L94 277 L84 266Z"
          fill="#7a79ff"
          stroke="#a9f6ff"
          stroke-width="2"
        />
      </svg>
    </div>

    <!-- 底部光环 -->
    <div class="platform"></div>
    <div class="cat-caption">
      <span class="status-dot"></span>
      <span>你的 AI 小伙伴</span>
      <span class="caption-paw">✦</span>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'

defineProps({
  active: {
    type: Boolean,
    default: true
  }
})

// 自动眨眼
const blinking = ref(false)
let blinkTimer

onMounted(() => {
  const blink = () => {
    blinking.value = true
    blinkTimer = setTimeout(() => {
      blinking.value = false
      blinkTimer = setTimeout(blink, 2200 + Math.random() * 2600)
    }, 150)
  }

  blinkTimer = setTimeout(blink, 1800)
})

onBeforeUnmount(() => {
  clearTimeout(blinkTimer)
})
</script>

<style scoped>
.cat-stage {
  --cyan: #67eaff;
  position: relative;
  isolation: isolate;
  width: min(100%, 480px);
  aspect-ratio: 1 / 1;
  margin: 0 auto;
  display: grid;
  place-items: center;
  overflow: hidden;
}

/* 外部环形 */
.orbit {
  position: absolute;
  border: 1px solid rgba(103, 234, 255, 0.25);
  border-radius: 50%;
  pointer-events: none;
}

.orbit-outer {
  width: 88%;
  height: 42%;
  transform: rotate(-18deg);
  box-shadow: 0 0 24px rgba(63, 179, 255, 0.12);
  animation: orbit-rotate 12s linear infinite;
}

.orbit-inner {
  width: 69%;
  height: 69%;
  border-color: rgba(154, 113, 255, 0.3);
  border-style: dashed;
  animation: orbit-rotate 24s linear infinite reverse;
}

.cat-float {
  z-index: 2;
  width: 80%;
  animation: cat-float 3.6s ease-in-out infinite;
}

.cat-svg {
  display: block;
  width: 100%;
  overflow: visible;
  filter: drop-shadow(0 10px 25px rgba(62, 174, 255, 0.18));
}

.cat-tail {
  transform-origin: 220px 250px;
  animation: tail-wag 2.4s ease-in-out infinite;
}

.cat-eye {
  transform-box: fill-box;
  transform-origin: center;
  animation: blink 5s infinite;
}

.particle {
  position: absolute;
  color: var(--cyan);
  font-size: 22px;
  text-shadow: 0 0 15px var(--cyan);
  animation: sparkle 2.4s ease-in-out infinite;
}

.particle-a { left: 12%; top: 34%; }
.particle-b { right: 13%; top: 25%; animation-delay: .7s; }
.particle-c { right: 17%; bottom: 26%; font-size: 36px; animation-delay: 1.2s; }
.particle-d { left: 22%; bottom: 18%; font-size: 14px; animation-delay: .4s; }

.platform {
  position: absolute;
  bottom: 10%;
  width: 58%;
  height: 9%;
  border: 1px solid rgba(92, 220, 255, 0.35);
  border-radius: 50%;
  background: radial-gradient(ellipse, rgba(73, 167, 255, .17), transparent 70%);
  box-shadow: 0 0 24px rgba(66, 190, 255, .15);
}

.cat-caption {
  position: absolute;
  z-index: 3;
  bottom: 3%;
  display: flex;
  align-items: center;
  gap: 8px;
  color: #c9eaff;
  font-size: 12px;
  letter-spacing: 2px;
  white-space: nowrap;
}

.status-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #64f4c6;
  box-shadow: 0 0 10px #64f4c6;
}

.caption-paw {
  color: #a995ff;
}

@keyframes cat-float {
  0%, 100% { transform: translateY(0) rotate(-1deg); }
  50% { transform: translateY(-10px) rotate(1deg); }
}

@keyframes tail-wag {
  0%, 100% { transform: rotate(-4deg); }
  50% { transform: rotate(8deg); }
}

@keyframes orbit-rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes sparkle {
  0%, 100% { opacity: .35; transform: scale(.8); }
  50% { opacity: 1; transform: scale(1.2); }
}

@keyframes blink {
  0%, 94%, 100% { transform: scaleY(1); }
  96% { transform: scaleY(.08); }
}

@media (prefers-reduced-motion: reduce) {
  .cat-float,
  .cat-tail,
  .orbit,
  .particle,
  .cat-eye {
    animation: none !important;
  }
}
</style>
