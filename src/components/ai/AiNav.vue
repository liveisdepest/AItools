<template>
  <header class="ai-nav">
    <div class="ai-nav-inner">
      <router-link to="/ai" class="ai-brand">
        <span class="ai-brand-dot"></span>
        AI Toolbox
      </router-link>

      <nav class="ai-links">
        <router-link to="/ai" exact-active-class="active">首页</router-link>
        <router-link to="/ai/tools" active-class="active">工具库</router-link>
        <router-link to="/ai/agents" active-class="active">智能体</router-link>
      </nav>

      <form class="ai-search-mini" @submit.prevent="submit">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
        <input v-model="keyword" type="text" placeholder="搜索工具…" aria-label="搜索工具" />
      </form>

      <div class="ai-nav-actions">
        <template v-if="user">
          <span class="ai-nav-user">{{ user.username }}</span>
          <button type="button" class="ai-btn ai-btn--ghost ai-btn--sm" @click="logout">退出</button>
        </template>
        <router-link v-else to="/login" class="ai-btn ai-btn--primary ai-btn--sm">登录</router-link>
      </div>
    </div>
  </header>
</template>

<script setup>
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const keyword = ref('')
const user = ref(null)

function loadUser () {
  try {
    const raw = localStorage.getItem('user')
    user.value = raw ? JSON.parse(raw) : null
  } catch {
    user.value = null
  }
}

function logout () {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  user.value = null
  router.push('/login')
}

function submit () {
  const q = keyword.value.trim()
  router.push({ path: '/ai/tools', query: q ? { q } : {} })
}

// 地址栏里的关键词变化时同步到输入框（比如从首页大搜索框跳过来）
watch(
  () => route.query.q,
  (value) => {
    if (typeof value === 'string' && value !== keyword.value) keyword.value = value
  }
)

onMounted(() => {
  loadUser()
  if (typeof route.query.q === 'string') keyword.value = route.query.q
  window.addEventListener('storage', loadUser)
})

onBeforeUnmount(() => {
  window.removeEventListener('storage', loadUser)
})
</script>
