/**
 * 极简的内存限流（按天计数）
 *
 * 用于控制智能体调用次数，防止模型额度被刷。
 * 单进程内存足够；以后多实例部署再换 Redis。
 */
const buckets = new Map()

function today () {
  return new Date().toISOString().slice(0, 10)
}

function consume (key, limit) {
  const day = today()
  const bucketKey = `${key}|${day}`
  const used = (buckets.get(bucketKey) || 0) + 1
  buckets.set(bucketKey, used)

  // 简单清理：表太大时把非今天的键删掉
  if (buckets.size > 10000) {
    for (const existing of buckets.keys()) {
      if (!existing.endsWith(day)) buckets.delete(existing)
    }
  }

  return {
    allowed: used <= limit,
    used,
    limit,
    remaining: Math.max(0, limit - used),
  }
}

module.exports = { consume }
