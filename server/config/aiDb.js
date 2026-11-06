/**
 * 数据库连接池（ai_tools 库）
 *
 * 配置优先读 AI_DB_*，回落到 DB_*。
 */
const mysql = require('mysql2/promise')

const pool = mysql.createPool({
  host: process.env.AI_DB_HOST || process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.AI_DB_PORT || process.env.DB_PORT || 3306),
  user: process.env.AI_DB_USER || process.env.DB_USER || 'root',
  password: process.env.AI_DB_PASSWORD ?? process.env.DB_PASSWORD ?? '123456',
  database: process.env.AI_DB_NAME || 'ai_tools',
  waitForConnections: true,
  connectionLimit: Number(process.env.AI_DB_CONNECTION_LIMIT || 10),
  queueLimit: 0,
  charset: 'utf8mb4',
  // 让 DATETIME 原样返回 'YYYY-MM-DD HH:mm:ss'，不走 JS Date，避免时区偏移
  dateStrings: true,
  timezone: process.env.DB_TIMEZONE || '+08:00',
})

module.exports = pool
