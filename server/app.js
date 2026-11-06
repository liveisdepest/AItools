// 必须在读取 process.env 的模块之前执行
require('./config/loadEnv')()

const express = require('express')
const cors = require('cors')

const app = express()
const PORT = process.env.PORT || 8080

// 中间件
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// 路由（数据全部在 ai_tools 库，见 config/aiDb.js）
app.use('/api/auth', require('./routes/auth'))
app.use('/api/tools', require('./routes/tools'))
app.use('/api/categories', require('./routes/categories'))
app.use('/api/agents', require('./routes/agents'))
app.use('/api', require('./routes/health'))

// 全局错误处理
app.use((err, req, res, next) => {
  console.error(err)
  const status = err.status && err.status >= 400 && err.status < 600 ? err.status : 500
  res.status(status).json({
    code: status,
    message: status === 500 ? '服务器内部错误' : err.message,
  })
})

app.listen(PORT, () => {
  console.log(`🚀 后端已启动: http://localhost:${PORT}`)
  if (!process.env.JWT_SECRET) {
    console.warn('⚠️  未设置 JWT_SECRET，正在使用开发默认值；上线前务必在 .env 里配置')
  }
})
