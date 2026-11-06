const pool = require('../config/aiDb')
const { camelize, parseJSONField } = require('../utils/case')
const { parsePagination } = require('../utils/pagination')
const { ok, fail, asyncHandler, str } = require('../utils/http')

// 白名单：只允许这几个值，避免把任意字符串拼进 SQL
const PRICING_TYPES = ['free', 'freemium', 'paid', 'trial']
const PLATFORMS = ['web', 'ios', 'android', 'desktop', 'api', 'chrome']

// 排序白名单。绝不接受前端传字段名拼到 ORDER BY 里。
const SORTS = {
  recommend: 't.is_featured DESC, t.click_count DESC, t.id DESC',
  newest: 't.published_at DESC, t.id DESC',
  rating: 't.rating_avg DESC, t.rating_count DESC, t.id DESC',
  clicks: 't.click_count DESC, t.id DESC',
}

const SEARCH_MODE = (process.env.SEARCH_MODE || 'like').toLowerCase()

/** 列表页精简字段，别把 description 这种大字段带出来 */
const LIST_COLUMNS = `
  t.id, t.slug, t.name, t.tagline, t.logo_url, t.cover_url,
  t.website_url, t.pricing_type, t.price_note, t.platforms,
  t.supports_chinese, t.has_free_trial, t.rating_avg, t.rating_count,
  t.click_count, t.favorite_count, t.is_featured, t.published_at,
  c.slug AS category_slug, c.name AS category_name
`

function normalizeTool (row) {
  if (!row) return null
  const tool = camelize({
    ...row,
    platforms: parseJSONField(row.platforms, []),
    rating_avg: Number(row.rating_avg || 0),
    rating_count: Number(row.rating_count || 0),
    click_count: Number(row.click_count || 0),
    favorite_count: Number(row.favorite_count || 0),
  })
  tool.supportsChinese = Boolean(tool.supportsChinese)
  tool.hasFreeTrial = Boolean(tool.hasFreeTrial)
  tool.isFeatured = Boolean(tool.isFeatured)
  return tool
}

/**
 * 拼 WHERE 片段。返回 null 表示参数非法，调用方直接回 400。
 */
function buildFilters (query) {
  const where = ["t.status = 'published'"]
  const params = []

  const category = str(query.category)
  if (category) {
    where.push('c.slug = ?')
    params.push(category)
  }

  const pricing = str(query.pricing)
  if (pricing) {
    if (!PRICING_TYPES.includes(pricing)) return { error: `pricing 仅支持：${PRICING_TYPES.join(' / ')}` }
    where.push('t.pricing_type = ?')
    params.push(pricing)
  }

  const platform = str(query.platform)
  if (platform) {
    if (!PLATFORMS.includes(platform)) return { error: `platform 仅支持：${PLATFORMS.join(' / ')}` }
    where.push('JSON_CONTAINS(t.platforms, JSON_QUOTE(?))')
    params.push(platform)
  }

  if (str(query.featured) === '1') {
    where.push('t.is_featured = 1')
  }

  // 关键词：默认 LIKE，保证任何库都能跑；SEARCH_MODE=match 时走 ngram 全文索引
  const keyword = str(query.q).slice(0, 60)
  if (keyword) {
    if (SEARCH_MODE === 'match') {
      where.push('MATCH(t.name, t.tagline, t.description) AGAINST (? IN NATURAL LANGUAGE MODE)')
      params.push(keyword)
    } else {
      // 去掉 LIKE 通配符，避免用户输入 % 把全表捞出来
      const safe = keyword.replace(/[\\%_]/g, '')
      const like = `%${safe}%`
      where.push('(t.name LIKE ? OR t.tagline LIKE ? OR t.description LIKE ?)')
      params.push(like, like, like)
    }
  }

  return { whereSql: where.join(' AND '), params }
}

// GET /api/tools
exports.getList = asyncHandler(async (req, res) => {
  const filters = buildFilters(req.query)
  if (filters.error) return fail(res, 400, filters.error)

  const sort = str(req.query.sort) || 'recommend'
  if (!SORTS[sort]) {
    return fail(res, 400, `sort 仅支持：${Object.keys(SORTS).join(' / ')}`)
  }

  const { page, pageSize, offset } = parsePagination(req.query)
  const { whereSql, params } = filters

  const [countRows] = await pool.query(
    `SELECT COUNT(*) AS total
     FROM tools t
     LEFT JOIN categories c ON c.id = t.category_id
     WHERE ${whereSql}`,
    params
  )
  const total = Number(countRows[0].total)

  const [rows] = await pool.query(
    `SELECT ${LIST_COLUMNS}
     FROM tools t
     LEFT JOIN categories c ON c.id = t.category_id
     WHERE ${whereSql}
     ORDER BY ${SORTS[sort]}
     LIMIT ? OFFSET ?`,
    [...params, pageSize, offset]
  )

  const list = rows.map(normalizeTool)

  return ok(res, {
    list,
    total,
    page,
    pageSize,
    hasMore: offset + list.length < total,
  })
})

// GET /api/tools/:slug
exports.getDetail = asyncHandler(async (req, res) => {
  const slug = str(req.params.slug).slice(0, 96)
  if (!slug) return fail(res, 400, '缺少 slug')

  const [rows] = await pool.query(
    `SELECT t.*, c.slug AS category_slug, c.name AS category_name
     FROM tools t
     LEFT JOIN categories c ON c.id = t.category_id
     WHERE t.slug = ? AND t.status = 'published'
     LIMIT 1`,
    [slug]
  )
  if (rows.length === 0) return fail(res, 404, '工具不存在')

  const row = rows[0]
  const tool = normalizeTool(row)

  const [tagRows] = await pool.query(
    `SELECT g.id, g.slug, g.name
     FROM tool_tags tt
     JOIN tags g ON g.id = tt.tag_id
     WHERE tt.tool_id = ?
     ORDER BY g.tool_count DESC, g.id ASC`,
    [row.id]
  )

  const [shotRows] = await pool.query(
    `SELECT id, url, caption, sort_order
     FROM tool_screenshots
     WHERE tool_id = ?
     ORDER BY sort_order ASC, id ASC
     LIMIT 8`,
    [row.id]
  )

  // 相关推荐：优先按标签重合度，没有标签就走同分类
  let [relatedRows] = await pool.query(
    `SELECT t.id, t.slug, t.name, t.tagline, t.logo_url, t.pricing_type,
            COUNT(*) AS shared_tags
     FROM tool_tags a
     JOIN tool_tags b ON b.tag_id = a.tag_id AND b.tool_id <> a.tool_id
     JOIN tools t ON t.id = b.tool_id AND t.status = 'published'
     WHERE a.tool_id = ?
     GROUP BY t.id, t.slug, t.name, t.tagline, t.logo_url, t.pricing_type, t.click_count
     ORDER BY shared_tags DESC, t.click_count DESC
     LIMIT ?`,
    [row.id, 6]
  )

  if (relatedRows.length === 0 && row.category_id) {
    ;[relatedRows] = await pool.query(
      `SELECT id, slug, name, tagline, logo_url, pricing_type, 0 AS shared_tags
       FROM tools
       WHERE status = 'published' AND category_id = ? AND id <> ?
       ORDER BY click_count DESC, id DESC
       LIMIT ?`,
      [row.category_id, row.id, 6]
    )
  }

  return ok(res, {
    ...tool,
    tags: camelize(tagRows),
    screenshots: camelize(shotRows),
    related: camelize(relatedRows),
  })
})

exports.PRICING_TYPES = PRICING_TYPES
exports.PLATFORMS = PLATFORMS
exports.SORTS = SORTS
