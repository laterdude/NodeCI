const Buffer = require('safe-buffer').Buffer
const Keygrip = require('keygrip')
const keys = require('../../config/keys.js')
const keygrip = new Keygrip([keys.cookieKey])

// pass mongoose user model to factory
module.exports = (user) => {
	const sessionObject = {
		passport: {
			user: user._id.toString() // ._id is not a string, it's an obj we must stringify
		}
	}
	const session = Buffer
		.from(JSON.stringify(sessionObject))
		.toString('base64')

	const sig = keygrip.sign(`session=${session}`)	
	return { session, sig}
}