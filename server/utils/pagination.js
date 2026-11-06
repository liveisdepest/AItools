/**
 * 分页参数解析：page 从 1 开始，pageSize 上限 50，防止被人一页拉走整库。
 */
const DEFAULT_PAGE_SIZE = 20
const MAX_PAGE_SIZE = 50

function toInt (value, fallback, min, max) {
  const n = Number.parseInt(value, 10)
  if (!Number.isFinite(n)) return fallback
  if (n < min) return min
  if (n > max) return max
  return n
}

function parsePagination (query = {}) {
  const page = toInt(query.page, 1, 1, 100000)
  const pageSize = toInt(query.pageSize ?? query.page_size, DEFAULT_PAGE_SIZE, 1, MAX_PAGE_SIZE)

  return {
    page,
    pageSize,
    offset: (page - 1) * pageSize,
  }
}

module.exports = { parsePagination, DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE }
