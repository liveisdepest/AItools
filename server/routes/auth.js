const express = require('express')
const router = express.Router()
const controller = require('../controllers/authController')
const { requireAuth } = require('../middleware/auth')

router.post('/register', controller.register)
router.post('/login', controller.login)
router.get('/me', requireAuth, controller.me)

module.exports = router
