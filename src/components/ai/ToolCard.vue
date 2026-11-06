<template>
  <router-link :to="`/ai/tools/${tool.slug}`" class="ai-card">
    <div class="ai-card-top">
      <div class="ai-logo">
        <img
          v-if="logoSrc && !broken"
          :src="logoSrc"
          :alt="tool.name"
          loading="lazy"
          referrerpolicy="no-referrer"
          @error="broken = true"
        />
        <span v-else>{{ letter }}</span>
      </div>

      <div class="ai-card-head">
        <span class="ai-card-name">{{ tool.name }}</span>
        <span :class="pricingClass(tool.pricingType)">{{ pricingLabel(tool.pricingType) }}</span>
      </div>
    </div>

    <p class="ai-card-tagline">{{ tool.tagline }}</p>

    <div class="ai-card-foot">
      <span class="ai-card-cat">{{ tool.categoryName || '未分类' }}</span>
      <span class="ai-card-go">详情 →</span>
    </div>
  </router-link>
</template>

<script setup>
import { computed, ref } from 'vue'
import { logoOf, initialOf, pricingLabel, pricingClass } from '../../utils/tool.js'

const props = defineProps({
  tool: { type: Object, required: true },
})

const broken = ref(false)
const logoSrc = computed(() => logoOf(props.tool))
const letter = computed(() => initialOf(props.tool.name))
</script>
