var express = require('express')
var router = express.Router()
var userUtils = require('../lib/users')

// GET /login
router.get('/', (req, res) => {
  var currentUser = userUtils.getCurrentUser(req)
  if (currentUser) { res.redirect('/') }
  res.render('login')
})

// POST /login
router.post('/', (req, res) => {
  var user_id = req.body.user_id.trim()
  if (!user_id) { res.redirect('/login') }
  userUtils.setCurrentUser(req, res, user_id)
  res.redirect('/')
})

module.exports = router
