var express = require('express')
var router = express.Router()
var request = require('request')
var jwt = require('jsonwebtoken')
var db = require('../db')
var config = require('../config')
var userUtils = require('../lib/users')

// GET /
router.get('/', (req, res) => {
  var currentUser = userUtils.getCurrentUser(req)
  var userDocs = []

  if (!currentUser) { res.redirect('/login') }

  db.docs.forEach((k, v) => {
    if (v.user_ids.indexOf(currentUser.id) !== -1) {
      userDocs.push(v)
    }
  })

  res.render('index', { currentUser: currentUser, docs: userDocs })
})

// GET /d/:id
router.get('/d/:id', (req, res) => {
  var doc = db.docs.get(req.params.id)
  var currentUser = userUtils.getCurrentUser(req)

  if (!doc || doc.user_ids.indexOf(currentUser.id) === -1) { return res.redirect('/') }

  var token = jwt.sign({ user_id: currentUser.id, document_id: doc.id, }, config.jwtKey, {
    algorithm: 'RS256',
    expiresIn: 10 * 365 * 24 * 60 * 60 // 10yrs
  })

  if (req.query.instant) {
    res.cookie.instant = (req.query.instant === 'true')
  }

  res.render('show', {
    baseUrl: config.baseUrl,
    currentUser: currentUser,
    doc: doc,
    users: db.users,
    jwt: token,
    instant: res.cookie.instant,
  })
})

// POST /d/:id/users
router.post('/d/:id/users', (req, res) => {
  var doc = db.docs.get(req.params.id)
  var currentUser = userUtils.getCurrentUser(req)
  var users = doc.user_ids.slice()
  var addedUsers = req.body.user_ids || []
  var removedUsers = users.filter(id => addedUsers.indexOf(id) === -1)

  if (addedUsers.length || removedUsers.length) {
    request({
      method: 'POST',
      url: `${config.baseUrl}/api/change_users`,
      headers: {
        "Authorization": `Token token=${config.authToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        document_id: doc.id,
        changes: {
          add_users: addedUsers,
          remove_users: removedUsers ,
        },
      })
    },
    (err, remoteResponse, remoteBody) => {
      var data = JSON.parse(remoteBody).data

      db.docs.update(doc.id, (d) => {
        d.user_ids = data.users
        return d
      }, () => {
        res.redirect(`/d/${doc.id}`)
      })
    })
  } else {
    res.redirect(`/d/${doc.id}`)
  }
})

module.exports = router
