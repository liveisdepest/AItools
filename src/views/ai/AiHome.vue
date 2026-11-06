<template>
  <div class="ai-page">
    <AiNav />

    <div v-if="offline" class="ai-banner">
      未连接后端，当前展示 <b>示例数据</b>。启动 server 并执行 <code>npm run db:init</code> 后刷新即可看到真实数据。
    </div>

    <main class="ai-shell">
      <section class="ai-hero">
        <div class="ai-eyebrow">AI TOOL DIRECTORY</div>
        <h1>发现真正<span class="grad">好用</span>的 AI 工具</h1>
        <p>人工筛选、按场景分类，写清价格模式与适用人群。少踩坑，直接开始用。</p>

        <form class="ai-search-big" @submit.prevent="search">
          <input v-model="keyword" type="text" placeholder="试试「免费视频生成」「中文代码助手」…" />
          <button class="ai-btn ai-btn--primary" type="submit">搜索</button>
        </form>

        <div class="ai-stats">
          <span><b>{{ stats.toolCount }}</b>个工具</span>
          <span><b>{{ categories.length }}</b>个分类</span>
          <span><b>{{ stats.featuredCount }}</b>个编辑精选</span>
        </div>
      </section>

      <section class="ai-section">
        <div class="ai-section-head">
          <h2>按分类浏览</h2>
        </div>

        <div v-if="loading" class="ai-cats">
          <div v-for="i in 8" :key="i" class="ai-skeleton" style="height: 70px"></div>
        </div>
        <div v-else class="ai-cats">
          <router-link
            v-for="cat in categories"
            :key="cat.slug"
            :to="{ path: '/ai/tools', query: { category: cat.slug } }"
            class="ai-cat-card"
          >
            <span class="ai-cat-icon">{{ cat.icon || '✨' }}</span>
            <span class="ai-cat-text">
              <span class="ai-cat-name">{{ cat.name }}</span>
              <span class="ai-cat-count">{{ cat.toolCount }} 个工具</span>
            </span>
          </router-link>
        </div>
      </section>
    </main>

    <footer class="ai-footer">
      AI Toolbox · 数据来自人工整理，价格与功能以官网为准
    </footer>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import AiNav from '../../components/ai/AiNav.vue'
import { getCategoriesApi } from '../../api/ai.js'
import { demoCategories, demoStats } from '../../api/demo.js'
import '../../assets/ai.css'

const router = useRouter()

const keyword = ref('')
const loading = ref(true)
const offline = ref(false)
const categories = ref([])
const stats = ref({ toolCount: 0, featuredCount: 0 })

function search () {
  const q = keyword.value.trim()
  router.push({ path: '/ai/tools', query: q ? { q } : {} })
}

function useDemoData () {
  offline.value = true
  categories.value = demoCategories
  stats.value = demoStats
}

async function load () {
  loading.value = true
  try {
    const res = await getCategoriesApi()

    if (res.code !== 200) throw new Error('bad response')

    categories.value = res.data.list || []
    stats.value = res.data.stats || { toolCount: 0, featuredCount: 0 }
    offline.value = false
  } catch {
    useDemoData()
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  document.title = 'AI Toolbox · 发现好用的 AI 工具'
  load()
})
</script>
