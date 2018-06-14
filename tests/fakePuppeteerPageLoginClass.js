// a mockup of how we would add a method to the puppeteer Page api to log us into our app
const Page = require('puppeteer/lib/Page')

Page.prototype.login = async function() {
	const user = await userFactory()
	const { session, sig } = sessionFactory(user)

	await this.setCookie({ name: 'session', value: session })
	await this.setCookie({ name: 'session.sig', value: sig })
	// pre-pend http:// to all hostname addresses per Travis CI
	await this.goto('http://localhost:3000')
	await this.waitFor(`a[href='/auth/logout']`)	
}

// this is similar to how to we implemented caching in redis with the mongoose library
// we'll try a different method instead using some es2015 like this:

// console.clear()

// class Page {
// 	goto() { console.log('I am going to another page') }
// 	setCookie() { console.log('I am setting a cookie') }
// }

// class CustomPage extends Page {
// 	login() {	console.log('All of our login logic') }
// }

// the problem is that we can't tell the puppeteer api to use our CustomPage
// class instead of the original Page class we're attempting to extend
// instead we could maybe wrap the page class:
class CustomPage {
	constructor(page) { this.page = page }
	this.page.setCookie()

	login() {
		this.page.goto('http://localhost:3000')
		this.page.setCookie()
	}
}
// it might be utilized like this
const page = new Page() // actually: const page = browser.launch()
const customPage = new CustomPage(page)
customPage.login()
// but then we'd have to also write out things like to access 
// the original Page class methods like so:
customPage.page.goto()
customPage.page.setCookie()

// This is awkward, instead, we'd rather just write without re-writing 
// every method on the original Page object:
customPage.login()
customPage.goto()
customPage.setCookie()

// to do this we'll utilize "proxy" objects
console.clear()

class Greetings {
	english() { return 'Hello' }
	spanish() { return 'Hola' }
}

class MoreGreetings {
	german() { return 'Hallo' }
	french() { return 'Bonjour' }
}

const greetings = new Greetings()
const moreGreetings = new MoreGreetings()

// new Proxy(target, handler) is a Global Function
// const allGreetings = new Proxy(moreGreetings, {
// 	get: function(target, property) { // target is passed automatically to the get method
// 		console.log(property)
// 	}
// })

// allGreetings.french 
// // console.logs out "french" - the name of the property we're trying to access
// allGreetings.EvenPropertiesThatDontExist
// // console.logs out "EvenPropertiesThatDontExist"

const allGreetings = new Proxy(moreGreetings, {
	get: function(target, property) { // target is passed automatically to the get method
		return target[property] || greetings[property]
	}
})

console.log(allGreetings.german) // console.logs out german() { return 'Hallo' }
console.log(allGreetings.german()) // console.logs out "Hallo"
console.log(allGreetings.english()) // console.logs out "Hello"

// So for our Page-extending class proxy function, we'll do this:

const page = new Page()
const customPage = new CustomPage(page)

const superPage = new Proxy(customPage, {
	get: function(target, property) {
		return target[property] || page[property]
	}
})

superPage.goto() // "I'm going to another page"
superPage.setCookie() // "I'm setting a cookie"
superPage.login() // "I'm going to another page" & "I'm setting a cookie"
// _______________________________________________________________________
// finally to implement this in our application we would do something like this
// by wrapping it in a function:
const buildPage = () => {
	const page = new Page()
	const customPage = new CustomPage(page)

	const superPage = new Proxy(customPage, {
		get: function(target, property) {
			return target[property] || page[property]
		}
	})
	return superPage
}

buildPage()
// _______________________________________________________________________
// but maybe to simplify this a bit more let's refactor:
class Page {
	goto() { console.log('Going to another page') }
	setCookie() { console.log('Setting a cookie') }
}

class CustomPage {
	static build() {
		const page = new Page()
		const customPage = new CustomPage(page)

		const superPage = new Proxy(customPage, {
			get: function(target, property) {
				return target[property] || page[property]
			}
		})
		return superPage;
	}

	constructor(page) {
		this.page = page
	}

	login() {
		this.page.goto('http://localhost:3000')
		this.page.setCookie()
	}
}
// you can call static functions without instantiating the underlying object
const superPage = CustomPage.build()
superPage.login() // it might seem self-referential