var db = require('../db')

function setCurrentUser(req, res, user_id) {
  if (!db.users.get(user_id)) {
    db.users.set(user_id, { id: user_id })
  }
  res.cookie('user_id', user_id)
}

function getCurrentUser(req) {
  return db.users.get(req.cookies.user_id)
}

module.exports = { setCurrentUser, getCurrentUser }
