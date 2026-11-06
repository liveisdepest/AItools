/**
 * 极简 .env 加载器（不引入 dotenv，避免多一个依赖）
 * 规则：KEY=VALUE，支持 # 注释、单双引号包裹；已存在的环境变量优先，不覆盖
 */
const fs = require('fs')
const path = require('path')

function loadEnv (file = path.join(__dirname, '..', '.env')) {
  if (!fs.existsSync(file)) return
  const text = fs.readFileSync(file, 'utf8')

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) continue

    const eq = line.indexOf('=')
    if (eq === -1) continue

    const key = line.slice(0, eq).trim()
    let value = line.slice(eq + 1).trim()

    const quoted =
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    if (quoted) value = value.slice(1, -1)

    if (process.env[key] === undefined) process.env[key] = value
  }
}

module.exports = loadEnv
