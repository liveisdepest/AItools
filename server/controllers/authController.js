const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

const pool = require('../config/aiDb')
const { ok, fail, asyncHandler, str } = require('../utils/http')
const { secret } = require('../middleware/auth')

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const USERNAME_RE = /^[\w\u4e00-\u9fa5-]{3,32}$/

function signToken (user) {
  return jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    secret(),
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  )
}

function publicUser (row) {
  return {
    id: row.id,
    username: row.username,
    email: row.email,
    role: row.role,
    createdAt: row.created_at || null,
  }
}

// POST /api/auth/register
exports.register = asyncHandler(async (req, res) => {
  const username = str(req.body.username).slice(0, 32)
  const email = str(req.body.email).toLowerCase().slice(0, 128)
  const password = String(req.body.password || '')

  if (!USERNAME_RE.test(username)) {
    return fail(res, 400, '用户名 3-32 位，支持中英文、数字、下划线和短横线')
  }
  if (!EMAIL_RE.test(email)) return fail(res, 400, '邮箱格式不正确')
  if (password.length < 8) return fail(res, 400, '密码至少 8 位')

  const [duplicate] = await pool.query(
    'SELECT id FROM users WHERE username = ? OR email = ? LIMIT 1',
    [username, email]
  )
  if (duplicate.length > 0) return fail(res, 409, '用户名或邮箱已被注册')

  // 第一个注册的用户自动成为管理员
  const [[countRow]] = await pool.query('SELECT COUNT(*) AS total FROM users')
  const role = Number(countRow.total) === 0 ? 'admin' : 'user'

  const passwordHash = await bcrypt.hash(password, 10)
  const [result] = await pool.query(
    `INSERT INTO users (username, email, password_hash, role, last_login_at)
     VALUES (?, ?, ?, ?, NOW())`,
    [username, email, passwordHash, role]
  )

  const user = { id: result.insertId, username, email, role }

  return ok(res, { token: signToken(user), user: publicUser(user) }, role === 'admin' ? '注册成功，你已成为管理员' : '注册成功')
})

// POST /api/auth/login
exports.login = asyncHandler(async (req, res) => {
  const account = str(req.body.account || req.body.username).slice(0, 128)
  const password = String(req.body.password || '')

  if (!account || !password) return fail(res, 400, '请输入账号和密码')

  const [rows] = await pool.query(
    'SELECT * FROM users WHERE username = ? OR email = ? LIMIT 1',
    [account, account.toLowerCase()]
  )

  // 账号不存在和密码错误返回同一句话，避免被用来探测账号
  if (rows.length === 0) return fail(res, 401, '账号或密码不正确')

  const row = rows[0]
  if (Number(row.status) !== 1) return fail(res, 403, '账号已被禁用')

  const matched = await bcrypt.compare(password, row.password_hash)
  if (!matched) return fail(res, 401, '账号或密码不正确')

  await pool.query('UPDATE users SET last_login_at = NOW() WHERE id = ?', [row.id])

  return ok(res, { token: signToken(row), user: publicUser(row) }, '登录成功')
})

// GET /api/auth/me
exports.me = asyncHandler(async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM users WHERE id = ? LIMIT 1', [req.user.id])
  if (rows.length === 0) return fail(res, 401, '账号不存在')

  return ok(res, { user: publicUser(rows[0]) })
})
