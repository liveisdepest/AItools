import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  { path: '/', redirect: '/ai' },

  // 认证
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue'),
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('../views/Register.vue'),
  },

  // 工具库
  {
    path: '/ai',
    name: 'AiHome',
    component: () => import('../views/ai/AiHome.vue'),
  },
  {
    path: '/ai/tools',
    name: 'AiTools',
    component: () => import('../views/ai/AiTools.vue'),
  },
  {
    path: '/ai/tools/:slug',
    name: 'AiToolDetail',
    component: () => import('../views/ai/AiToolDetail.vue'),
  },

  // 智能体
  {
    path: '/ai/agents',
    name: 'AiAgents',
    component: () => import('../views/ai/AiAgents.vue'),
  },
  {
    // 必须放在 /:slug 之前，否则 "new" 会被当成 slug
    path: '/ai/agents/new',
    name: 'AiAgentBuilder',
    component: () => import('../views/ai/AgentBuilder.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/ai/agents/:slug',
    name: 'AiAgentRun',
    component: () => import('../views/ai/AiAgentRun.vue'),
  },

  // 老链接（/home、/projects 等）统一回首页，避免出现空白页
  { path: '/:pathMatch(.*)*', redirect: '/ai' },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to) => {
  const token = localStorage.getItem('token')

  // 已登录就别再进登录/注册页
  if (token && (to.name === 'Login' || to.name === 'Register')) {
    const redirect = typeof to.query.redirect === 'string' ? to.query.redirect : '/ai'
    return { path: redirect }
  }

  // 需要登录的页面，带上原地址，登录后跳回去
  if (!token && to.meta.requiresAuth) {
    return { path: '/login', query: { redirect: to.fullPath } }
  }

  return true
})

export default router
