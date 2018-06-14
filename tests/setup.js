jest.setTimeout(30000)

// tell jest to use this setup.js file in the package.json file
require('../models/User')

const mongoose = require('mongoose')
const keys = require('../config/keys')


mongoose.Promise = global.Promise
mongoose.connect(keys.mongoURI, { useMongoClient: true })

