const pool = require('../config/aiDb')
const { camelize } = require('../utils/case')
const { ok, asyncHandler } = require('../utils/http')

// GET /api/categories
// 返回两级树；现在数据都是一级分类，children 为空数组，前端不用判空
exports.getList = asyncHandler(async (req, res) => {
  const [rows] = await pool.query(
    `SELECT id, parent_id, slug, name, name_en, icon, description, sort_order, tool_count
     FROM categories
     WHERE is_active = 1
     ORDER BY sort_order DESC, id ASC`
  )

  const flat = camelize(rows)
  const byId = new Map(flat.map((item) => [item.id, { ...item, children: [] }]))
  const tree = []

  for (const item of byId.values()) {
    if (item.parentId && byId.has(item.parentId)) {
      byId.get(item.parentId).children.push(item)
    } else {
      tree.push(item)
    }
  }

  // 顺带给出总数，首页「共收录 N 个工具」直接可用
  const [[stat]] = await pool.query(
    `SELECT COUNT(*) AS total, SUM(is_featured = 1) AS featured
     FROM tools WHERE status = 'published'`
  )

  return ok(res, {
    list: tree,
    stats: {
      toolCount: Number(stat.total || 0),
      featuredCount: Number(stat.featured || 0),
    },
  })
})
