<template>
  <div class="ai-page">
    <AiNav />

    <div v-if="offline" class="ai-banner">
      未连接后端，当前展示 <b>示例数据</b>，筛选与分页在本地模拟。
    </div>

    <main class="ai-shell">
      <section class="ai-page-head">
        <h1 class="ai-page-title">工具库</h1>
        <p class="ai-page-sub">
          共 <b>{{ total }}</b> 个工具<template v-if="q">，关键词「{{ q }}」</template>
          <button v-if="hasFilters" class="ai-clear" @click="clearAll">清空筛选</button>
        </p>
      </section>

      <div class="ai-filters">
        <div class="ai-filter-row">
          <span class="ai-filter-label">分类</span>
          <button
            class="ai-chip"
            :class="{ 'is-active': !category }"
            @click="applyFilter({ category: '' })"
          >
            全部
          </button>
          <button
            v-for="cat in categories"
            :key="cat.slug"
            class="ai-chip"
            :class="{ 'is-active': category === cat.slug }"
            @click="applyFilter({ category: category === cat.slug ? '' : cat.slug })"
          >
            {{ cat.name }}
          </button>
        </div>

        <div class="ai-filter-row">
          <span class="ai-filter-label">价格</span>
          <button
            v-for="opt in PRICING_OPTIONS"
            :key="opt.value"
            class="ai-chip"
            :class="{ 'is-active': pricing === opt.value }"
            @click="applyFilter({ pricing: pricing === opt.value ? '' : opt.value })"
          >
            {{ opt.label }}
          </button>
        </div>

        <div class="ai-filter-row">
          <span class="ai-filter-label">平台</span>
          <button
            v-for="opt in PLATFORM_OPTIONS"
            :key="opt.value"
            class="ai-chip"
            :class="{ 'is-active': platform === opt.value }"
            @click="applyFilter({ platform: platform === opt.value ? '' : opt.value })"
          >
            {{ opt.label }}
          </button>
        </div>
      </div>

      <div class="ai-result-bar">
        <span>
          找到 {{ total }} 个结果<template v-if="total > pageSize"> · 每页 {{ pageSize }} 个</template>
        </span>
        <label>
          排序
          <select :value="sort" @change="applyFilter({ sort: $event.target.value })">
            <option v-for="opt in SORT_OPTIONS" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </option>
          </select>
        </label>
      </div>

      <div v-if="loading" class="ai-grid">
        <div v-for="i in 6" :key="i" class="ai-skeleton"></div>
      </div>

      <div v-else-if="list.length" class="ai-grid">
        <ToolCard v-for="tool in list" :key="tool.slug" :tool="tool" />
      </div>

      <div v-else class="ai-empty">
        <span class="emoji">🔍</span>
        <h3>没有符合条件的工具</h3>
        <p>换个关键词或减少筛选条件试试。</p>
        <p v-if="offline" style="margin-top: 10px">
          当前是示例数据，仅 {{ demoTools.length }} 条；接入后端后会有全部工具。
        </p>
      </div>

      <div v-if="!loading && total > pageSize" class="ai-pager">
        <button type="button" :disabled="page <= 1" @click="goPage(page - 1)">← 上一页</button>
        <span>第 {{ page }} / {{ totalPages }} 页 · 共 {{ total }} 个</span>
        <button type="button" :disabled="!hasMore" @click="goPage(page + 1)">下一页 →</button>
      </div>
    </main>

    <footer class="ai-footer">
      AI Toolbox · 数据来自人工整理，价格与功能以官网为准
    </footer>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AiNav from '../../components/ai/AiNav.vue'
import ToolCard from '../../components/ai/ToolCard.vue'
import { getCategoriesApi, getToolsApi } from '../../api/ai.js'
import { demoCategories, demoTools } from '../../api/demo.js'
import { SORT_OPTIONS } from '../../utils/tool.js'
import '../../assets/ai.css'

const PRICING_OPTIONS = [
  { value: 'free', label: '免费' },
  { value: 'freemium', label: '免费+付费' },
  { value: 'paid', label: '付费' },
  { value: 'trial', label: '试用' },
]

const PLATFORM_OPTIONS = [
  { value: 'web', label: '网页' },
  { value: 'desktop', label: '桌面端' },
  { value: 'api', label: 'API' },
  { value: 'ios', label: 'iOS' },
  { value: 'android', label: 'Android' },
  { value: 'chrome', label: '浏览器插件' },
]

const pageSize = 12

const route = useRoute()
const router = useRouter()

const loading = ref(true)
const offline = ref(false)
const list = ref([])
const total = ref(0)
const categories = ref([])

function qs (key) {
  const v = route.query[key]
  return typeof v === 'string' ? v : ''
}

const q = computed(() => qs('q'))
const category = computed(() => qs('category'))
const pricing = computed(() => qs('pricing'))
const platform = computed(() => qs('platform'))
const sort = computed(() => qs('sort') || 'recommend')
const page = computed(() => Math.max(1, Number(route.query.page) || 1))

const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pageSize)))
const hasMore = computed(() => page.value < totalPages.value)
const hasFilters = computed(() => Boolean(category.value || pricing.value || platform.value || q.value))

function applyFilter (patch) {
  const next = { ...route.query, ...patch }
  delete next.page
  for (const key of Object.keys(next)) {
    if (next[key] === '' || next[key] === null || next[key] === undefined) delete next[key]
  }
  router.push({ path: '/ai/tools', query: next })
}

function clearAll () {
  router.push({ path: '/ai/tools' })
}

function goPage (target) {
  router.push({ path: '/ai/tools', query: { ...route.query, page: String(target) } })
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

/** 后端不可用时的本地筛选，保证界面仍可操作 */
function localFallback () {
  offline.value = true
  const keyword = q.value.toLowerCase()

  const filtered = demoTools.filter((tool) => {
    if (category.value && tool.categorySlug !== category.value) return false
    if (pricing.value && tool.pricingType !== pricing.value) return false
    if (platform.value && !(tool.platforms || []).includes(platform.value)) return false
    if (keyword && !`${tool.name} ${tool.tagline}`.toLowerCase().includes(keyword)) return false
    return true
  })

  const sorted = [...filtered]
  if (sort.value === 'newest') sorted.reverse()
  if (sort.value === 'clicks') sorted.sort((a, b) => (b.clickCount || 0) - (a.clickCount || 0))
  if (sort.value === 'rating') sorted.sort((a, b) => (b.ratingAvg || 0) - (a.ratingAvg || 0))

  total.value = sorted.length
  list.value = sorted.slice((page.value - 1) * pageSize, page.value * pageSize)
}

async function load () {
  loading.value = true
  try {
    const res = await getToolsApi({
      category: category.value || undefined,
      pricing: pricing.value || undefined,
      platform: platform.value || undefined,
      q: q.value || undefined,
      sort: sort.value,
      page: page.value,
      pageSize: pageSize,
    })

    if (res.code !== 200) throw new Error('bad response')

    list.value = res.data.list || []
    total.value = res.data.total || 0
    offline.value = false
  } catch {
    localFallback()
  } finally {
    loading.value = false
  }

  document.title = q.value ? `${q.value} · 工具库 | AI Toolbox` : '工具库 | AI Toolbox'
}

async function loadCategories () {
  try {
    const res = await getCategoriesApi()
    categories.value = res.data?.list || []
  } catch {
    categories.value = demoCategories
  }
}

watch(() => route.query, load, { immediate: true })

onMounted(loadCategories)
</script>
