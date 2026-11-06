const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const multer = require('multer')

const pool = require('../config/aiDb')
const llm = require('../services/llm')
const { camelize, parseJSONField } = require('../utils/case')
const { ok, fail, asyncHandler, str } = require('../utils/http')
const rateLimit = require('../utils/rateLimit')

const UPLOAD_DIR = path.join(__dirname, '..', 'uploads')
fs.mkdirSync(UPLOAD_DIR, { recursive: true })

const MAX_FILE_SIZE = 10 * 1024 * 1024
const MAX_FILES_PER_RUN = 5
const MAX_TEXT_CHARS = 12000

const TEXT_EXT = new Set([
  '.txt', '.md', '.markdown', '.json', '.csv', '.log',
  '.yml', '.yaml', '.js', '.ts', '.py', '.sql', '.html', '.css',
])

// ---------- 上传 ----------
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || '').slice(0, 12)
    cb(null, `${crypto.randomUUID()}${ext}`)
  },
})

const uploader = multer({ storage, limits: { fileSize: MAX_FILE_SIZE, files: 1 } })

/** 包一层，把 multer 的错误翻译成 400，而不是落到全局 500 */
function uploadSingle (req, res, next) {
  uploader.single('file')(req, res, (err) => {
    if (!err) return next()
    if (err.code === 'LIMIT_FILE_SIZE') {
      return fail(res, 400, `文件超过 ${MAX_FILE_SIZE / 1024 / 1024}MB 限制`)
    }
    return fail(res, 400, `上传失败：${err.message}`)
  })
}

function kindOf (file) {
  const ext = path.extname(file.originalname || '').toLowerCase()
  if (file.mimetype.startsWith('image/')) return 'image'
  if (TEXT_EXT.has(ext) || file.mimetype.startsWith('text/') || file.mimetype === 'application/json') return 'text'
  return 'other'
}

function normalizeAgent (row) {
  if (!row) return null
  const agent = camelize({
    ...row,
    temperature: Number(row.temperature || 0.7),
    capabilities: parseJSONField(row.capabilities, []),
    starter_prompts: parseJSONField(row.starter_prompts, []),
    run_count: Number(row.run_count || 0),
  })
  agent.isBuiltin = Boolean(agent.isBuiltin)
  return agent
}

// ---------- 接口 ----------

// GET /api/agents
exports.list = asyncHandler(async (req, res) => {
  const [rows] = await pool.query(
    `SELECT id, slug, name, tagline, description, icon, category,
            capabilities, starter_prompts, is_builtin, run_count, sort_order
     FROM agents
     WHERE is_published = 1
     ORDER BY sort_order DESC, id ASC`
  )

  return ok(res, {
    list: rows.map(normalizeAgent),
    llm: llm.publicStatus(),
  })
})

// GET /api/agents/:slug
exports.detail = asyncHandler(async (req, res) => {
  const slug = str(req.params.slug).slice(0, 64)
  const [rows] = await pool.query('SELECT * FROM agents WHERE slug = ? AND is_published = 1 LIMIT 1', [slug])
  if (rows.length === 0) return fail(res, 404, '智能体不存在')

  const agent = normalizeAgent(rows[0])
  delete agent.systemPrompt // 角色设定不给前端，避免被拿去套用

  return ok(res, { agent, llm: llm.publicStatus() })
})

/** 中文名生成不出可读 slug，退化成一个稳定短代码，用户可以在表单里改 */
function slugify (input) {
  const base = String(input || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48)
  return base || `agent-${Date.now().toString(36)}`
}

// POST /api/agents —— 创建一个智能体
exports.create = asyncHandler(async (req, res) => {
  const body = req.body || {}

  const name = str(body.name).slice(0, 24)
  const tagline = str(body.tagline).slice(0, 60)
  const systemPrompt = String(body.systemPrompt || '').trim().slice(0, 8000)

  if (!name) return fail(res, 400, '名称不能为空')
  if (!tagline) return fail(res, 400, '一句话说明不能为空')
  if (systemPrompt.length < 20) return fail(res, 400, '角色设定至少写 20 个字，太短模型抓不住重点')

  const rawSlug = str(body.slug)
  if (rawSlug && !/^[a-z0-9][a-z0-9-]{2,63}$/.test(rawSlug)) {
    return fail(res, 400, '标识只能用小写字母、数字和短横线，3-64 位')
  }
  const slug = rawSlug || slugify(name)

  const capabilities = Array.isArray(body.capabilities)
    ? body.capabilities.filter((c) => c === 'file' || c === 'image')
    : []

  const starterPrompts = Array.isArray(body.starterPrompts)
    ? body.starterPrompts.map((s) => str(s)).filter(Boolean).slice(0, 6)
    : []

  const temperature = Math.min(1, Math.max(0, Number(body.temperature ?? 0.6) || 0.6))
  const isPublished = body.isPublished === false ? 0 : 1
  const icon = str(body.icon).slice(0, 8) || '🤖'
  const description = str(body.description).slice(0, 2000)

  const [duplicate] = await pool.query('SELECT id FROM agents WHERE slug = ? LIMIT 1', [slug])
  if (duplicate.length > 0) return fail(res, 409, `标识「${slug}」已被占用，换一个`)

  try {
    await pool.query(
      `INSERT INTO agents
         (slug, name, tagline, description, icon, category, system_prompt,
          temperature, max_tokens, capabilities, starter_prompts,
          is_builtin, is_published, sort_order)
       VALUES (?, ?, ?, ?, ?, 'custom', ?, ?, 2000, ?, ?, 0, ?, 10)`,
      [
        slug,
        name,
        tagline,
        description,
        icon,
        systemPrompt,
        temperature,
        JSON.stringify(capabilities),
        starterPrompts.length ? JSON.stringify(starterPrompts) : null,
        isPublished,
      ]
    )
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return fail(res, 409, '标识已被占用，换一个')
    throw err
  }

  const [rows] = await pool.query('SELECT * FROM agents WHERE slug = ? LIMIT 1', [slug])
  const agent = normalizeAgent(rows[0])
  delete agent.systemPrompt

  return ok(res, { agent }, '智能体已创建')
})

// POST /api/agents/files
exports.upload = asyncHandler(async (req, res) => {
  const file = req.file
  if (!file) return fail(res, 400, '没有收到文件')

  const kind = kindOf(file)
  if (kind === 'other') {
    fs.unlink(file.path, () => {})
    return fail(res, 400, '暂不支持该文件类型，请上传图片或文本类文件（txt / md / json / csv / log）')
  }

  let extracted = null
  if (kind === 'text') {
    extracted = await fs.promises.readFile(file.path, 'utf8').catch(() => '')
    extracted = extracted.slice(0, 100000)
  }

  const sessionId = (str(req.headers['x-session-id']) || str(req.body?.sessionId)).slice(0, 64) || null
  const id = crypto.randomUUID()

  await pool.query(
    `INSERT INTO agent_files (id, session_id, original_name, stored_name, mime, size, kind, extracted_text)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, sessionId, file.originalname, file.filename, file.mimetype, file.size, kind, extracted]
  )

  return ok(res, {
    id,
    name: file.originalname,
    kind,
    size: file.size,
    mime: file.mimetype,
    preview: extracted ? extracted.slice(0, 200) : null,
  })
})

/** 把磁盘上的图片转成 data URL，直接塞给多模态模型 */
function toDataUrl (file) {
  const buffer = fs.readFileSync(path.join(UPLOAD_DIR, file.stored_name))
  return `data:${file.mime};base64,${buffer.toString('base64')}`
}

// POST /api/agents/:slug/run
exports.run = asyncHandler(async (req, res) => {
  const slug = str(req.params.slug).slice(0, 64)
  const body = req.body || {}

  const message = str(body.message).slice(0, 8000)
  const fileIds = Array.isArray(body.fileIds) ? body.fileIds.slice(0, MAX_FILES_PER_RUN).map(String) : []
  const sessionId = str(body.sessionId).slice(0, 64) || null

  if (!message && fileIds.length === 0) return fail(res, 400, '请输入内容或上传文件')

  // 按天限流：登录用户额度高，匿名只能少量试用，防止模型额度被刷
  const quotaKey = req.user ? `u:${req.user.id}` : `ip:${req.ip}`
  const quotaLimit = req.user
    ? Number(process.env.AGENT_DAILY_LIMIT || 50)
    : Number(process.env.AGENT_ANON_DAILY_LIMIT || 10)
  const quota = rateLimit.consume(quotaKey, quotaLimit)

  if (!quota.allowed) {
    return fail(
      res,
      429,
      req.user
        ? `今天已用完 ${quotaLimit} 次额度，明天再来`
        : `匿名用户每天 ${quotaLimit} 次，登录后额度更高`
    )
  }

  const [agentRows] = await pool.query(
    'SELECT * FROM agents WHERE slug = ? AND is_published = 1 LIMIT 1',
    [slug]
  )
  if (agentRows.length === 0) return fail(res, 404, '智能体不存在')
  const agent = agentRows[0]

  let files = []
  if (fileIds.length > 0) {
    const [rows] = await pool.query('SELECT * FROM agent_files WHERE id IN (?)', [fileIds])
    files = rows
  }

  const textFiles = files.filter((f) => f.kind === 'text')
  const imageFiles = files.filter((f) => f.kind === 'image')

  // 历史消息只保留最近 10 轮，且只认 user / assistant
  const history = (Array.isArray(body.history) ? body.history : [])
    .filter((m) => m && typeof m.content === 'string' && (m.role === 'user' || m.role === 'assistant'))
    .slice(-10)
    .map((m) => ({ role: m.role, content: m.content.slice(0, 4000) }))

  // 文本文件直接拼进 prompt；图片走多模态 content 数组
  let userText = message
  if (textFiles.length > 0) {
    userText += textFiles
      .map((f) => `\n\n--- 文件：${f.original_name} ---\n${(f.extracted_text || '').slice(0, MAX_TEXT_CHARS)}`)
      .join('')
  }

  let userContent = userText
  if (imageFiles.length > 0) {
    userContent = [{ type: 'text', text: userText || '请看下面的图片并分析。' }]
    for (const file of imageFiles) {
      userContent.push({ type: 'image_url', image_url: { url: toDataUrl(file) } })
    }
  }

  const messages = [
    { role: 'system', content: agent.system_prompt },
    ...history,
    { role: 'user', content: userContent },
  ]

  const defaultModel = llm.readConfig().model
  const visionModel = llm.readConfig().visionModel
  const model = imageFiles.length > 0
    ? (visionModel || agent.model || defaultModel)
    : (agent.model || defaultModel)

  const startedAt = Date.now()
  let result
  try {
    result = await llm.chat({
      messages,
      model,
      temperature: Number(agent.temperature || 0.7),
      maxTokens: Number(agent.max_tokens || 2000),
    })
  } catch (err) {
    const latency = Date.now() - startedAt
    await pool
      .query(
        `INSERT INTO agent_runs (agent_id, session_id, status, model, latency_ms, error_message)
         VALUES (?, ?, 'error', ?, ?, ?)`,
        [agent.id, sessionId, model, latency, String(err.message).slice(0, 500)]
      )
      .catch(() => {})

    return fail(res, err.status || 502, String(err.message).slice(0, 300))
  }

  const latencyMs = Date.now() - startedAt

  // 落库失败不影响本次回复
  let runId = null
  try {
    const [runResult] = await pool.query(
      `INSERT INTO agent_runs
         (agent_id, session_id, status, model, prompt_tokens, completion_tokens, latency_ms, mock)
       VALUES (?, ?, 'ok', ?, ?, ?, ?, ?)`,
      [
        agent.id,
        sessionId,
        result.model,
        result.usage.prompt_tokens,
        result.usage.completion_tokens,
        latencyMs,
        result.mock ? 1 : 0,
      ]
    )
    runId = runResult.insertId

    const attachments = files.map((f) => ({ id: f.id, name: f.original_name, kind: f.kind }))
    await pool.query(
      'INSERT INTO agent_messages (run_id, role, content, attachments) VALUES (?, ?, ?, ?)',
      [runId, 'user', userText.slice(0, 8000), attachments.length ? JSON.stringify(attachments) : null]
    )
    await pool.query(
      'INSERT INTO agent_messages (run_id, role, content) VALUES (?, ?, ?)',
      [runId, 'assistant', result.content]
    )
    await pool.query('UPDATE agents SET run_count = run_count + 1 WHERE id = ?', [agent.id])
  } catch (err) {
    console.error('[agent] 落库失败:', err.message)
  }

  return ok(res, {
    reply: result.content,
    model: result.model,
    mock: result.mock,
    usage: result.usage,
    latencyMs,
    runId,
  })
})

exports.UPLOAD_DIR = UPLOAD_DIR
exports.uploadSingle = uploadSingle
