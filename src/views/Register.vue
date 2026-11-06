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
        <p class="auth-eyebrow">CREATE IDENTITY</p>
        <h1>
          建立你的<br />
          <span class="auth-grad">智能体身份</span>
        </h1>
        <p class="auth-desc">注册后可以创建自己的智能体、上传文件、保存调用记录。</p>
      </div>

      <div class="auth-cat">
        <MaomiCat />
      </div>

      <div class="auth-meta">
        <span><i class="auth-dot"></i>REGISTRY OPEN</span>
        <span>BCRYPT · 10</span>
        <span>v0.3</span>
      </div>
    </section>

    <section class="auth-panel">
      <form class="auth-card" @submit.prevent="submit">
        <div class="auth-card-head">
          <h2>创建账号</h2>
          <span class="auth-badge">SIGN UP</span>
        </div>

        <label class="auth-field">
          <span>用户名</span>
          <input
            v-model.trim="form.username"
            type="text"
            autocomplete="username"
            placeholder="3-32 位，中英文/数字/下划线"
          />
        </label>

        <label class="auth-field">
          <span>邮箱</span>
          <input
            v-model.trim="form.email"
            type="email"
            autocomplete="email"
            placeholder="you@example.com"
          />
        </label>

        <label class="auth-field">
          <span>密码</span>
          <div class="auth-input-row">
            <input
              v-model="form.password"
              :type="showPassword ? 'text' : 'password'"
              autocomplete="new-password"
              placeholder="至少 8 位"
            />
            <button type="button" class="auth-eye" @click="showPassword = !showPassword">
              {{ showPassword ? '隐藏' : '显示' }}
            </button>
          </div>
        </label>

        <label class="auth-field">
          <span>确认密码</span>
          <input
            v-model="form.confirm"
            :type="showPassword ? 'text' : 'password'"
            autocomplete="new-password"
            placeholder="再输一次"
          />
        </label>

        <p v-if="error" class="auth-error">{{ error }}</p>

        <button class="auth-submit" type="submit" :disabled="loading">
          <span v-if="loading" class="auth-spinner"></span>
          {{ loading ? '创建中…' : '创建账号' }}
        </button>

        <p class="auth-hint">第一个注册的账号会自动成为管理员。</p>

        <p class="auth-switch">
          已有账号？
          <router-link :to="{ path: '/login', query: route.query }">去登录</router-link>
        </p>
      </form>
    </section>
  </div>
</template>

<script setup>
import { inject, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import MaomiCat from './maomi.vue'
import { registerApi, saveSession } from '../api/auth.js'
import '../assets/ai.css'

const route = useRoute()
const router = useRouter()
const showToast = inject('showToast', () => {})

const form = reactive({ username: '', email: '', password: '', confirm: '' })
const loading = ref(false)
const error = ref('')
const showPassword = ref(false)

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function validate () {
  if (!/^[\w\u4e00-\u9fa5-]{3,32}$/.test(form.username)) {
    return '用户名 3-32 位，支持中英文、数字、下划线和短横线'
  }
  if (!EMAIL_RE.test(form.email)) return '邮箱格式不正确'
  if (form.password.length < 8) return '密码至少 8 位'
  if (form.password !== form.confirm) return '两次输入的密码不一致'
  return ''
}

async function submit () {
  error.value = validate()
  if (error.value) return

  loading.value = true
  try {
    const res = await registerApi({
      username: form.username,
      email: form.email,
      password: form.password,
    })
    if (res.code !== 200) throw new Error(res.message || '注册失败')

    saveSession(res.data.token, res.data.user)
    showToast(res.message || '注册成功')

    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/ai/agents'
    router.replace(redirect)
  } catch (err) {
    error.value = err.response?.data?.message || err.message || '注册失败，请稍后重试'
  } finally {
    loading.value = false
  }
}

document.title = '注册 · AI Toolbox'
</script>
