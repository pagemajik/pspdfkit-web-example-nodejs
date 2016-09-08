var express = require('express')
var router = express.Router()
var request = require('request')
var multer  = require('multer')
var storage = multer.memoryStorage()
var upload = multer({ storage: storage })
var jwt = require('jsonwebtoken')
var db = require('../db')
var config = require('../config')
var userUtils = require('../lib/users')

// POST /upload
router.post('/', upload.single('file'), (req, res) => {
  var file = req.file
  if (!file) { return res.redirect('/') }

  request({
    method: 'POST',
    url: `${config.baseUrl}/api/document`,
    headers: { "Authorization": `Token token=${config.authToken}` },
    body: file.buffer
  },
  (err, remoteResponse, remoteBody) => {
    if (err) {
      return onError(res, err)
    } else if (remoteResponse.statusCode !== 200) {
      return onRemoteError(res, remoteResponse)
    }

    var data = JSON.parse(remoteBody).data
    var currentUser = userUtils.getCurrentUser(req)

    request({
      method: 'POST',
      url: `${config.baseUrl}/api/change_users`,
      headers: {
        "Authorization": `Token token=${config.authToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        document_id: data.document_id,
        changes: {
          add_users: [currentUser.id],
          remove_users: [] ,
        },
      })
    },
    (err, remoteResponse, remoteBody) => {
      if (err) {
        return onError(res, err)
      } else if (remoteResponse.statusCode !== 200) {
        return onRemoteError(res, remoteResponse)
      }

      var token = jwt.sign({ document_id: data.document_id, context: 'cover' }, config.jwtKey, {
        algorithm: 'RS256',
        expiresIn: 10 * 365 * 24 * 60 * 60 // 10yrs
      })
      var cover_url = `${config.baseUrl}/d/${data.document_id}/cover?width=200&jwt=${token}`

      db.docs.set(data.document_id, {
        id: data.document_id,
        title: file.originalname,
        cover_url: cover_url,
        user_ids: [currentUser.id]
      })

      res.redirect('/')
    })
  })
})

// error handlers
function onError(res, err) {
  res.render('error', {
    message: err.message
  })
}

function onRemoteError(res, remoteResponse) {
  res.render('error', {
    message: JSON.stringify(remoteResponse, null, '\t')
  })
}

module.exports = router
