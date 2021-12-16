const mongoose = require('mongoose')
const credential = require('credential')
const pw = credential()

const userSchema = new mongoose.Schema({
  name: {
    type: String
  },
  email: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  }
},
{
  timestamps: true
}
)

userSchema.pre('save', function (next) {
  if (!this.isModified('password')) return next()
  pw.hash(this.password, (err, hash) => {
    if (err) return next(err)
    this.password = hash
    return next()
  })
})

userSchema.methods.verify = function (password) {
  return pw.verify(this.password, password)
}

module.exports = mongoose.model('User', userSchema)
