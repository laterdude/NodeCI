const mongoose = require('mongoose')
const redis = require('redis')
const util = require('util')
const keys = require('../config/keys')


// const redisUrl = 'redis://127.0.0.1:6379'
const client = redis.createClient(keys.redisUrl)
// client.get = util.promisify(client.get)
client.hget = util.promisify(client.hget)

const exec = mongoose.Query.prototype.exec

// add our cache method to the mongoose Query object so we decide whether we want
// to cache a value or not
mongoose.Query.prototype.cache = function(options = {}) {
	// add a 'useCache' property to the query object that can be
	// referenced by the exec method later when determining if we should cache or not
	this.useCache = true 
	this.hashKey = JSON.stringify(options.key || '')

	return this // so that we can chain it like we do with other methods
}

mongoose.Query.prototype.exec = async function() {
	if (!this.useCache) {
		return exec.apply(this, arguments)
	} 
	// console.log('I am about to run a query')
	// console.log(this.getQuery())
	// console.log(this.mongooseCollection.name)
 
	const key = JSON.stringify(Object.assign({}, this.getQuery(), {
		collection: this.mongooseCollection.name
	}))

	// See if we have a value for 'key' in redis
	// const cacheValue = await client.get(key)
	const cacheValue = await client.hget(this.hashKey, key) // hashed version

	// If we do, return that
	if (cacheValue) {
		console.log(cacheValue)
		// need to convert the string stored in redis back into JSON
		// unfortunately, JSON /= mongoose document (model instance), as mongoose expects
		// return JSON.parse(cacheValue)
		
		// console.log(this) // this is a ref to the Query object =>
		// const doc = new this.model(JSON.parse(cacheValue))
		// // equivalent to doing something like:
		// // new Blog({
		// // 	title: 'Hi',
		// // 	content: 'there'
		// // })
		// return doc

		// we're storing two types of values in redis, user record instances and arrays of blog posts
		// ie, when we're creating a model, the expectation is that we're going to be passing in
		// one record's worth of attributes:
		// for a user instance, the code: 
		// >> const doc = new this.model(JSON.parse(cacheValue))
		// >> return doc -> { _id: '123', googleID: '123' }
		// works perfectly, but for blog instances, we're returning an array of model instances:
		// [{ title: 'asd' }, { title: 'kdnf' }] --> and each element of the array needs to be 
		// individually converted over to a mongoose model instance, so we have to write code 
		// that handles both cases:
		const doc = JSON.parse(cacheValue)
		return Array.isArray(doc) 
			? doc.map(d => new this.model(d))
			: new this.model(doc)
		// this is called 'hydrating' the model
	}

	// Otherwise, issue the query and store the result in redis,
	// but we need to convert the result to JSON (exec returns a 'mongoose document')
	// in order for it to be consumed / stored within redis
	const result = await exec.apply(this, arguments)
	// console.log(result)
	// so we could simply return result and our patch to the mongoose library would work as 
	// intended by mongoose since we're returning a 'mongoose document', however,
	// we first want to cache it redis so we can access it later:
	// client.set(key, JSON.stringify(result), 'EX', 10) // auto expire cache after 10 s
	client.hmset(this.hashKey, key, JSON.stringify(result), 'EX', 10) // hashed version
	// then return result:
	return result
}

module.exports = {
	clearHash(hashKey) {
		client.del(JSON.stringify(hashKey))
	}
}