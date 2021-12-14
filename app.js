const createError = require('http-errors')
const express = require('express')
const path = require('path')
// const cookieParser = require('cookie-parser')
const logger = require('morgan')
const cors = require('cors')
// passport.js
const passport = require('passport')
const LocalStrategy = require('passport-local').Strategy
const session = require('express-session')
// mongoose
const mongoose = require('mongoose')
main().catch(err => console.log(err))
async function main () {
  console.log('start connect')
  await mongoose.connect('mongodb://127.0.0.1:27017/nautilus')
  console.log('connect sucess')
}
const User = require('./models/user.js')

const indexRouter = require('./routes/index')
// const usersRouter = require('./routes/users')

const app = express()

// view engine setup
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'ejs')

app.use(cors())
app.use(logger('dev'))
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
// app.use(cookieParser()) deprecated
app.use(express.static(path.join(__dirname, 'public')))
// trust proxy to cookie secure
app.set('trust proxy', 1)
app.use(session({
  secret: 'innovation lab',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: true }
}))
app.use(passport.initialize())
app.use(passport.session())

app.use('/', indexRouter)
// app.use('/users', usersRouter)
app.post('/login',
  passport.authenticate('local'),
  (req, res) => res.send(req.user))
app.get('/users', async (req, res) => {
  const Users = await User.find().select('name role')
  res.send(JSON.stringify(Users.map(user => ({
    id: user._id,
    name: user.name,
    permission: {
      admin: user.role === 'admin',
      adsManager: false,
      insights: true
    }
  }))))
})
app.use('/failure', indexRouter)
app.use('/sucess', indexRouter)
app.get('*', (req, res) => res.redirect('/'))

// catch 404 and forward to error handler
app.use((req, res, next) => next(createError(404)))

// error handler
app.use((err, req, res, next) => {
  // set locals, only providing error in development
  res.locals.message = err.message
  res.locals.error = req.app.get('env') === 'development' ? err : {}

  // render the error page
  res.status(err.status || 500)
  res.render('error')
})

passport.use(new LocalStrategy({
  usernameField: 'email',
  passwordField: 'password'
},
async (email, password, done) => {
  User.findOne({ email }, (err, user) => {
    if (err) { return done(err) }
    if (!user) {
      return done(null, false, { message: 'Incorrect username.' })
    }
    if (!user.verify(user.password, password)) {
      return done(null, false, { message: 'Incorrect password.' })
    }
    return done(null, { _id: user.id, email: user.email, name: user.name })
  })
}
))
passport.serializeUser(function (user, done) {
  done(null, user)
})

passport.deserializeUser(function (user, done) {
  done(null, User.findOne({ _id: user._id }))
})

module.exports = app
