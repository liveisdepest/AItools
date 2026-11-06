const express = require('express')
const router = express.Router()
const controller = require('../controllers/agentController')
const { optionalAuth, requireAuth } = require('../middleware/auth')

router.get('/', controller.list)

// 创建智能体、上传文件都需要登录（避免被刷盘 / 刷数据）
router.post('/', requireAuth, controller.create)
router.post('/files', requireAuth, controller.uploadSingle, controller.upload)

router.get('/:slug', controller.detail)

// 运行允许匿名，但匿名额度更低，见 controller 里的限流
router.post('/:slug/run', optionalAuth, controller.run)

module.exports = router
