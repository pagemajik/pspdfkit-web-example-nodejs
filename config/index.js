var fs = require('fs')

module.exports = {
  baseUrl: process.env.BASE_URL || 'http://localhost:5000',
  authToken: process.env.AUTH_TOKEN || 'secret',
  jwtKey: fs.readFileSync('./config/jwt.pem'),
}
