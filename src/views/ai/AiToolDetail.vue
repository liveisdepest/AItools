<template>
  <div class="ai-page">
    <AiNav />

    <div v-if="offline" class="ai-banner">
      未连接后端，当前展示 <b>示例数据</b>。
    </div>

    <main class="ai-shell ai-detail">
      <div class="ai-crumb">
        <router-link to="/ai/tools">工具库</router-link>
        <span>/</span>
        <template v-if="tool">
          <router-link :to="{ path: '/ai/tools', query: { category: tool.categorySlug } }">
            {{ tool.categoryName }}
          </router-link>
          <span>/</span>
        </template>
        <span>{{ tool ? tool.name : '…' }}</span>
      </div>

      <div v-if="loading" class="ai-skeleton" style="height: 190px"></div>

      <div v-else-if="notFound" class="ai-empty">
        <span class="emoji">🫥</span>
        <h3>没有找到这个工具</h3>
        <p>可能已经下线，或者链接里的 slug 写错了。</p>
        <router-link to="/ai/tools" class="ai-btn ai-btn--ghost" style="margin-top: 14px">
          返回工具库
        </router-link>
      </div>

      <template v-else-if="tool">
        <header class="ai-detail-head">
          <div class="ai-detail-logo">
            <img
              v-if="logoSrc && !broken"
              :src="logoSrc"
              :alt="tool.name"
              referrerpolicy="no-referrer"
              @error="broken = true"
            />
            <span v-else>{{ letter }}</span>
          </div>

          <div class="ai-detail-main">
            <div class="ai-detail-title">
              <h1>{{ tool.name }}</h1>
              <span :class="pricingClass(tool.pricingType)">{{ pricingLabel(tool.pricingType) }}</span>
              <span v-if="tool.isFeatured" class="ai-badge ai-badge--trial">编辑精选</span>
            </div>

            <p class="ai-detail-tagline">{{ tool.tagline }}</p>

            <div class="ai-detail-actions">
              <a
                class="ai-btn ai-btn--primary"
                :href="tool.websiteUrl"
                target="_blank"
                rel="noopener noreferrer"
              >
                访问官网 ↗
              </a>
              <router-link to="/ai/tools" class="ai-btn ai-btn--ghost">返回列表</router-link>
            </div>
          </div>
        </header>

        <div class="ai-detail-body">
          <section class="ai-panel">
            <h2>简介</h2>
            <div class="ai-prose">
              <p v-for="(para, index) in paragraphs" :key="index">{{ para }}</p>
              <p v-if="!paragraphs.length" style="color: var(--ai-ink-faint)">暂无详细介绍。</p>
            </div>

            <template v-if="tool.tags && tool.tags.length">
              <h2 style="margin-top: 22px">标签</h2>
              <div class="ai-tag-row">
                <router-link
                  v-for="tag in tool.tags"
                  :key="tag.slug"
                  :to="{ path: '/ai/tools', query: { q: tag.name } }"
                  class="ai-tag"
                >
                  {{ tag.name }}
                </router-link>
              </div>
            </template>
          </section>

          <aside class="ai-panel">
            <h2>基本信息</h2>
            <dl class="ai-meta-list">
              <div class="ai-meta-item">
                <dt>分类</dt>
                <dd>{{ tool.categoryName || '—' }}</dd>
              </div>
              <div class="ai-meta-item">
                <dt>价格</dt>
                <dd>{{ tool.priceNote || pricingLabel(tool.pricingType) }}</dd>
              </div>
              <div class="ai-meta-item">
                <dt>平台</dt>
                <dd>{{ platformsText }}</dd>
              </div>
              <div class="ai-meta-item">
                <dt>中文支持</dt>
                <dd>{{ tool.supportsChinese ? '支持' : '一般' }}</dd>
              </div>
              <div class="ai-meta-item">
                <dt>免费试用</dt>
                <dd>{{ tool.hasFreeTrial ? '有' : '无' }}</dd>
              </div>
              <div class="ai-meta-item">
                <dt>评分</dt>
                <dd>{{ ratingText }}</dd>
              </div>
            </dl>
          </aside>
        </div>

        <section v-if="related.length" class="ai-section">
          <div class="ai-section-head">
            <h2>相关推荐</h2>
          </div>
          <div class="ai-grid">
            <ToolCard v-for="item in related" :key="item.slug" :tool="item" />
          </div>
        </section>
      </template>
    </main>

    <footer class="ai-footer">
      AI Toolbox · 数据来自人工整理，价格与功能以官网为准
    </footer>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import AiNav from '../../components/ai/AiNav.vue'
import ToolCard from '../../components/ai/ToolCard.vue'
import { getToolApi } from '../../api/ai.js'
import { demoTools } from '../../api/demo.js'
import {
  initialOf,
  logoOf,
  paragraphsOf,
  platformLabel,
  pricingClass,
  pricingLabel,
} from '../../utils/tool.js'
import '../../assets/ai.css'

const route = useRoute()

const tool = ref(null)
const related = ref([])
const loading = ref(true)
const notFound = ref(false)
const offline = ref(false)
const broken = ref(false)

const slug = computed(() => String(route.params.slug || ''))

const logoSrc = computed(() => (tool.value ? logoOf(tool.value) : ''))
const letter = computed(() => initialOf(tool.value?.name))
const paragraphs = computed(() => paragraphsOf(tool.value?.description))
const platformsText = computed(() => {
  const list = tool.value?.platforms || []
  return list.length ? list.map(platformLabel).join(' / ') : '—'
})
const ratingText = computed(() => {
  const avg = Number(tool.value?.ratingAvg || 0)
  if (!avg) return '暂无'
  const count = Number(tool.value?.ratingCount || 0)
  return `${avg.toFixed(1)} / 5${count ? `（${count} 人）` : ''}`
})

async function load () {
  loading.value = true
  notFound.value = false
  broken.value = false

  try {
    const res = await getToolApi(slug.value)
    if (res.code !== 200) throw new Error('bad response')

    tool.value = res.data
    related.value = res.data.related || []
    offline.value = false
  } catch {
    const found = demoTools.find((item) => item.slug === slug.value)
    if (!found) {
      notFound.value = true
      tool.value = null
      related.value = []
    } else {
      offline.value = true
      tool.value = found
      related.value = demoTools
        .filter((item) => item.categorySlug === found.categorySlug && item.slug !== found.slug)
        .slice(0, 3)
    }
  } finally {
    loading.value = false
    document.title = tool.value ? `${tool.value.name} · AI Toolbox` : 'AI Toolbox'
  }
}

watch(slug, load, { immediate: true })
</script>
