const express = require('express')
const router = express.Router()
const aiDb = require('../config/aiDb')
const { ok, fail, asyncHandler } = require('../utils/http')

// GET /api/health —— 用来确认 ai_tools 库连得上，前端联调先打这个
router.get(
  '/health',
  asyncHandler(async (req, res) => {
    try {
      await aiDb.query('SELECT 1')
      return ok(res, { status: 'up', database: 'ai_tools' })
    } catch (err) {
      return fail(res, 503, `数据库不可用：${err.code || err.message}`)
    }
  })
)

module.exports = router
