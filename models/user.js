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

userSchema.methods.verify = function (password) {
  return pw.verify(this.password, password)
}

module.exports = mongoose.model('User', userSchema)
