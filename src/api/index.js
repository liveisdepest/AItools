import axios from 'axios'

// 全站共用的 axios 实例：baseURL 指向 /api，由 vite 代理到 8080
const request = axios.create({
  baseURL: '/api',
  timeout: 10000,
})

// 请求拦截器：有 token 就带上（登录接入后生效）
request.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
  },
  (error) => Promise.reject(error)
)

// 响应拦截器：直接返回业务响应体 { code, message, data }
request.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response) {
      const { status, data } = error.response
      if (status === 401 && error.config?.headers?.Authorization) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')

        // token 过期或服务端换了密钥：回登录页，并记住当前地址
        if (!window.location.pathname.startsWith('/login')) {
          const current = window.location.pathname + window.location.search
          window.location.href = `/login?redirect=${encodeURIComponent(current)}`
        }
      } else if (status === 500) {
        console.error('服务器内部错误')
      } else {
        console.error(data?.message || '请求失败')
      }
    }
    return Promise.reject(error)
  }
)

export default request
