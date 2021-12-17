require('dotenv').config()
const createError = require('http-errors')
const express = require('express')
const path = require('path')
const logger = require('morgan')
const cors = require('cors')
// passport.js
const passport = require('passport')
const LocalStrategy = require('passport-local').Strategy
const JwtStrategy = require('passport-jwt').Strategy
const ExtractJwt = require('passport-jwt').ExtractJwt
const jwt = require('jsonwebtoken')
// mongoose
const mongoose = require('mongoose')
main().catch(err => console.log(err))
async function main () {
  console.log('start connect')
  await mongoose.connect(process.env.DB_CONNECTION || 'mongodb://127.0.0.1:27017/nauitlus')
  console.log('connect sucess')
}
const User = require('./models/user.js')

const indexRouter = require('./routes/index')

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
app.use(passport.initialize())
app.use(async (req, res, next) => {
  const token = req.header('Authorization')
  if (token) {
    const decoded = jwt.verify(token.replace('Bearer ', ''), 'innovation lab')
    const user = await User.findById(decoded).select('name email role')
    if (user) req.user = user
  }
  next()
})

const signin = (req, res) => {
  console.log(`${req.user.name} has logged in`)
  const token = jwt.sign({ _id: req.user._id }, 'innovation lab')
  res.json(token)
}

app.use('/', indexRouter)
app.post('/login',
  passport.authenticate('local', { session: false }),
  signin)
app.get('/me', async (req, res) => {
  if (req.user) console.log(req.user)
  else console.log('not logged in')
  res.send(JSON.stringify(req.user))
})
app.get('/users', async (req, res) => {
  const token = req.header('Authorization').replace('Bearer ', '')
  jwt.verify(token, 'innovation lab')
  const Users = await User.find().select('name email role')
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

// passport local strategy
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
// passport.serializeUser(function (user, done) {
//   done(null, user)
// })
// passport.deserializeUser(function (user, done) {
//   done(null, User.findOne({ _id: user._id }))
// })

passport.use('token', new JwtStrategy({
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: 'innovation lab'
},
(jwtPayload, done) => {
  User.findById(jwtPayload._id)
    .then(user => done(null, user))
    .catch(err => done(err))
}))

module.exports = app
