<template>
  <div class="auth-page">
    <div class="auth-grid" aria-hidden="true"></div>
    <div class="auth-glow auth-glow--a" aria-hidden="true"></div>
    <div class="auth-glow auth-glow--b" aria-hidden="true"></div>

    <section class="auth-showcase">
      <router-link to="/ai" class="auth-brand">
        <span class="ai-brand-dot"></span>
        AI TOOLBOX
      </router-link>

      <div class="auth-copy">
        <p class="auth-eyebrow">SECURE ACCESS</p>
        <h1>
          登录你的<br />
          <span class="auth-grad">智能体工作台</span>
        </h1>
        <p class="auth-desc">工具库、智能体、调用额度 —— 一个账号全部打通。</p>
      </div>

      <div class="auth-cat">
        <MaomiCat />
      </div>

      <div class="auth-meta">
        <span><i class="auth-dot"></i>NODE ONLINE</span>
        <span>JWT · 7D</span>
        <span>v0.3</span>
      </div>
    </section>

    <section class="auth-panel">
      <form class="auth-card" @submit.prevent="submit">
        <div class="auth-card-head">
          <h2>欢迎回来</h2>
          <span class="auth-badge">SIGN IN</span>
        </div>

        <label class="auth-field">
          <span>用户名 / 邮箱</span>
          <input
            v-model.trim="form.account"
            type="text"
            autocomplete="username"
            placeholder="admin 或 you@example.com"
          />
        </label>

        <label class="auth-field">
          <span>密码</span>
          <div class="auth-input-row">
            <input
              v-model="form.password"
              :type="showPassword ? 'text' : 'password'"
              autocomplete="current-password"
              placeholder="至少 8 位"
            />
            <button type="button" class="auth-eye" @click="showPassword = !showPassword">
              {{ showPassword ? '隐藏' : '显示' }}
            </button>
          </div>
        </label>

        <p v-if="error" class="auth-error">{{ error }}</p>

        <button class="auth-submit" type="submit" :disabled="loading">
          <span v-if="loading" class="auth-spinner"></span>
          {{ loading ? '验证中…' : '进入工作台' }}
        </button>

        <p class="auth-switch">
          还没有账号？
          <router-link :to="{ path: '/register', query: route.query }">创建一个</router-link>
        </p>
      </form>
    </section>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import MaomiCat from './maomi.vue'
import { loginApi, saveSession } from '../api/auth.js'
import '../assets/ai.css'

const route = useRoute()
const router = useRouter()

const form = reactive({ account: '', password: '' })
const loading = ref(false)
const error = ref('')
const showPassword = ref(false)

async function submit () {
  error.value = ''

  if (!form.account || !form.password) {
    error.value = '请输入账号和密码'
    return
  }

  loading.value = true
  try {
    const res = await loginApi({ account: form.account, password: form.password })
    if (res.code !== 200) throw new Error(res.message || '登录失败')

    saveSession(res.data.token, res.data.user)

    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/ai/agents'
    router.replace(redirect)
  } catch (err) {
    error.value = err.response?.data?.message || err.message || '登录失败，请稍后重试'
  } finally {
    loading.value = false
  }
}

document.title = '登录 · AI Toolbox'
</script>
