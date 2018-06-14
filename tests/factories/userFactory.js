const mongoose = require('mongoose')
const User = mongoose.model('User')

module.exports = () => {
	return new User({}).save() // returns a promise that must be awaited
}