<template>
  <div class="ai-page">
    <AiNav />

    <main class="ai-shell">
      <section class="ai-page-head">
        <div class="ai-page-head-row">
          <div>
            <h1 class="ai-page-title">智能体</h1>
            <p class="ai-page-sub">挑一个，把任务直接丢给它。每个都预设了角色和工作方式，不用自己写提示词。</p>
          </div>
          <router-link to="/ai/agents/new" class="ai-btn ai-btn--primary ai-btn--sm">
            ＋ 创建智能体
          </router-link>
        </div>
      </section>

      <div v-if="loading" class="ai-grid">
        <div v-for="i in 3" :key="i" class="ai-skeleton" style="height: 220px"></div>
      </div>

      <div v-else-if="error" class="ai-empty">
        <span class="emoji">🔌</span>
        <h3>没能加载智能体</h3>
        <p>{{ error }}</p>
        <button class="ai-btn ai-btn--ghost ai-btn--sm" style="margin-top: 14px" @click="load">重试</button>
      </div>

      <div v-else class="ai-agent-grid">
        <router-link
          v-for="agent in agents"
          :key="agent.slug"
          :to="`/ai/agents/${agent.slug}`"
          class="ai-agent-card"
        >
          <div class="ai-agent-icon">{{ agent.icon }}</div>
          <h3>{{ agent.name }}</h3>
          <p class="ai-agent-tagline">{{ agent.tagline }}</p>

          <div v-if="agent.capabilities.length" class="ai-agent-caps">
            <span v-if="agent.capabilities.includes('file')" class="ai-cap">📄 读文件</span>
            <span v-if="agent.capabilities.includes('image')" class="ai-cap">🖼️ 看图片</span>
          </div>

          <div class="ai-agent-foot">
            <span>已运行 {{ agent.runCount }} 次</span>
            <span class="ai-card-go">开始 →</span>
          </div>
        </router-link>
      </div>

      <div v-if="llm && !llm.configured" class="ai-hint">
        当前<strong>未配置模型 API Key</strong>，智能体返回的是示例回复。在
        <code>server/.env</code> 里填 <code>LLM_API_KEY</code> 后重启后端即可接真模型。
      </div>
    </main>

    <footer class="ai-footer">
      AI Toolbox · 智能体输出仅供参考，请自行核对关键信息
    </footer>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import AiNav from '../../components/ai/AiNav.vue'
import { getAgentsApi } from '../../api/agents.js'
import '../../assets/ai.css'

const agents = ref([])
const llm = ref(null)
const loading = ref(true)
const error = ref('')

async function load () {
  loading.value = true
  error.value = ''
  try {
    const res = await getAgentsApi()
    if (res.code !== 200) throw new Error(res.message || '接口返回异常')
    agents.value = res.data.list || []
    llm.value = res.data.llm || null
  } catch (err) {
    error.value = err.response?.data?.message || '后端没启动，或 /api/agents 不可用'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  document.title = '智能体 · AI Toolbox'
  load()
})
</script>
