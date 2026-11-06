const express = require('express')
const router = express.Router()
const controller = require('../controllers/toolController')

// 公开读取（当前只做只读接口，管理端的写接口下一步再加）
router.get('/', controller.getList)
router.get('/:slug', controller.getDetail)

module.exports = router
