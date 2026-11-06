/**
 * JWT 鉴权中间件
 *
 * 三个用法：
 *   optionalAuth —— 有 token 就解析，没有也放行（用于允许匿名的接口）
 *   requireAuth  —— 没登录直接 401
 *   requireAdmin —— 还要求 role = admin
 */
const jwt = require('jsonwebtoken')

const DEV_SECRET = 'dev-only-secret-change-me'

function secret () {
  return process.env.JWT_SECRET || DEV_SECRET
}

function readPayload (req) {
  const header = req.headers.authorization || ''
  const [scheme, token] = header.split(' ')
  if (!token || scheme.toLowerCase() !== 'bearer') return null

  try {
    return jwt.verify(token, secret())
  } catch {
    return null
  }
}

function optionalAuth (req, res, next) {
  req.user = readPayload(req)
  next()
}

function requireAuth (req, res, next) {
  const user = readPayload(req)
  if (!user) return res.status(401).json({ code: 401, message: '请先登录' })
  req.user = user
  next()
}

function requireAdmin (req, res, next) {
  const user = readPayload(req)
  if (!user) return res.status(401).json({ code: 401, message: '请先登录' })
  if (user.role !== 'admin') return res.status(403).json({ code: 403, message: '需要管理员权限' })
  req.user = user
  next()
}

module.exports = { optionalAuth, requireAuth, requireAdmin, secret }
