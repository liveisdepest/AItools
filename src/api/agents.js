import request from './index.js'

export function getSessionId () {
  const KEY = 'agent_session_id'
  let id = localStorage.getItem(KEY)
  if (!id) {
    id = (crypto.randomUUID?.() || `s_${Date.now()}_${Math.random().toString(16).slice(2)}`)
    localStorage.setItem(KEY, id)
  }
  return id
}

/** 智能体列表 + 模型配置状态 */
export function getAgentsApi () {
  return request.get('/agents')
}

/** 单个智能体 */
export function getAgentApi (slug) {
  return request.get(`/agents/${slug}`)
}

/** 上传文件（图片或文本），返回 { id, name, kind } */
export function uploadAgentFileApi (file) {
  const form = new FormData()
  form.append('file', file)
  return request.post('/agents/files', form, {
    headers: { 'x-session-id': getSessionId() },
    timeout: 60000,
  })
}

/** 运行智能体 */
export function runAgentApi (slug, payload) {
  return request.post(`/agents/${slug}/run`, payload, { timeout: 120000 })
}

/** 创建智能体 */
export function createAgentApi (payload) {
  return request.post('/agents', payload, { timeout: 30000 })
}
