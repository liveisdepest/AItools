import request from './index.js'

export function registerApi (data) {
  return request.post('/auth/register', data)
}

export function loginApi (data) {
  return request.post('/auth/login', data)
}

export function meApi () {
  return request.get('/auth/me')
}

export function saveSession (token, user) {
  localStorage.setItem('token', token)
  localStorage.setItem('user', JSON.stringify(user))
}

export function clearSession () {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
}

export function currentUser () {
  try {
    const raw = localStorage.getItem('user')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function isLoggedIn () {
  return Boolean(localStorage.getItem('token'))
}
