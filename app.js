var express = require('express')
var path = require('path')
var logger = require('morgan')
var bodyParser = require('body-parser')
var cookieParser = require('cookie-parser')
var app = express()

// config
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'ejs')
app.use(bodyParser.urlencoded({ extended: true }))
app.use(cookieParser())
app.use(logger('dev'))

// routes
app.use('/', require('./routes/documents'))
app.use('/login', require('./routes/login'))
app.use('/upload', require('./routes/upload'))
app.use(express.static(path.join(__dirname, 'public')))

module.exports = app
