/**
 * 初始化 ai_tools 库：按文件名顺序执行 db/*.sql
 *
 *   npm run db:init     增量执行（建库建表 + 灌种子数据，重复执行会因主键冲突而中断）
 *   npm run db:reset    先 DROP DATABASE 再全量重建（会丢数据，慎用）
 */
const fs = require('fs')
const path = require('path')
const mysql = require('mysql2/promise')

require('../config/loadEnv')()

const DB_DIR = path.join(__dirname, '..', 'db')
const DB_NAME = (process.env.AI_DB_NAME || 'ai_tools').replace(/[^a-zA-Z0-9_]/g, '')

async function main () {
  const reset = process.argv.includes('--reset')

  if (DB_NAME !== 'ai_tools') {
    console.warn(`⚠️  AI_DB_NAME=${DB_NAME}，但 SQL 文件里写死了 ai_tools，两者请保持一致`)
  }

  const host = process.env.AI_DB_HOST || process.env.DB_HOST || '127.0.0.1'
  const port = Number(process.env.AI_DB_PORT || process.env.DB_PORT || 3306)

  const conn = await mysql.createConnection({
    host,
    port,
    user: process.env.AI_DB_USER || process.env.DB_USER || 'root',
    password: process.env.AI_DB_PASSWORD ?? process.env.DB_PASSWORD ?? '123456',
    charset: 'utf8mb4',
    multipleStatements: true,
  })

  console.log(`🔌 已连接 ${host}:${port}`)

  if (reset) {
    await conn.query(`DROP DATABASE IF EXISTS \`${DB_NAME}\``)
    console.log(`🗑  已删除数据库 ${DB_NAME}`)
  }

  const only = process.argv.slice(2).find((arg) => arg.endsWith('.sql'))

  const files = fs
    .readdirSync(DB_DIR)
    .filter((file) => file.endsWith('.sql'))
    .filter((file) => !only || file === only)
    .sort()

  if (files.length === 0) throw new Error(`没有在 ${DB_DIR} 找到 .sql 文件`)

  for (const file of files) {
    const sql = fs.readFileSync(path.join(DB_DIR, file), 'utf8')
    await conn.query(sql)
    console.log(`✔ ${file}`)
  }

  const [[stat]] = await conn.query(`
    SELECT
      (SELECT COUNT(*) FROM \`${DB_NAME}\`.categories)   AS categories,
      (SELECT COUNT(*) FROM \`${DB_NAME}\`.tools)        AS tools,
      (SELECT COUNT(*) FROM \`${DB_NAME}\`.tags)         AS tags,
      (SELECT COUNT(*) FROM \`${DB_NAME}\`.collections)  AS collections,
      (SELECT COUNT(*) FROM \`${DB_NAME}\`.tool_tags)    AS tool_tags
  `)

  console.log('')
  console.log('📊 数据自检：')
  console.log(`   分类 ${stat.categories} · 工具 ${stat.tools} · 标签 ${stat.tags} · 合集 ${stat.collections} · 标签关联 ${stat.tool_tags}`)

  const okCount =
    Number(stat.categories) === 8 &&
    Number(stat.tools) === 60 &&
    Number(stat.tags) === 32

  console.log(okCount ? '✅ 初始化完成，数量符合预期' : '⚠️  数量与种子设计不一致，请检查')

  await conn.end()
}

main().catch((err) => {
  console.error('❌ 初始化失败:', err.message)
  console.error('   检查 MySQL 是否启动、账号密码是否正确、库名是否被占用')
  process.exitCode = 1
})
