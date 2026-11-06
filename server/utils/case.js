/**
 * 数据库是 snake_case，接口统一输出 camelCase，转换只在这一层做。
 */

function isPlainObject (value) {
  return (
    value !== null &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    !(value instanceof Date) &&
    !Buffer.isBuffer(value)
  )
}

function toCamelKey (key) {
  return key.replace(/_([a-z0-9])/g, (_, c) => c.toUpperCase())
}

function camelize (value) {
  if (Array.isArray(value)) return value.map(camelize)
  if (!isPlainObject(value)) return value

  const out = {}
  for (const [key, val] of Object.entries(value)) {
    out[toCamelKey(key)] = camelize(val)
  }
  return out
}

/**
 * JSON 列在 mysql2 里可能是字符串也可能是已解析对象，统一成数组
 */
function parseJSONField (value, fallback = []) {
  if (value === null || value === undefined) return fallback
  if (typeof value === 'string') {
    try {
      return JSON.parse(value)
    } catch {
      return fallback
    }
  }
  return value
}

module.exports = { camelize, toCamelKey, parseJSONField, isPlainObject }
