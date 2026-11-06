/**
 * 统一响应格式，和现有接口保持一致：{ code, message, data }
 * 前端 src/api/index.js 的拦截器直接读 code 和 data，不用改。
 */

function ok (res, data = null, message = 'ok') {
  return res.json({ code: 200, message, data })
}

function fail (res, status, message, code) {
  return res.status(status).json({ code: code ?? status, message, data: null })
}

/**
 * 包一层，省掉每个 controller 里的 try/catch，异常统一交给 app.js 的错误中间件
 */
function asyncHandler (fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next)
}

/** 只接受字符串查询参数，数组/对象一律当空 */
function str (value) {
  return typeof value === 'string' ? value.trim() : ''
}

module.exports = { ok, fail, asyncHandler, str }
