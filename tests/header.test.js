// const puppeteer = require('puppeteer')
// const sessionFactory = require('./factories/sessionFactory')
// const userFactory = require('./factories/userFactory')
const Page = require('./helpers/page')

// test('Adds two numbers', () => {
// 	const sum = 1 + 2
// 	expect(sum).toEqual(3)

// 	// assert() example from other test suite
// 	// should() example from other test suite
// })

// let browser, page
let page

beforeEach(async () => {
	// browser = await puppeteer.launch({
	// 	headless: false
	// })
	// page = await browser.newPage()
	page = await Page.build()
	await page.goto('http://localhost:3000')	
})

afterEach(async () => {
	// await browser.close()
	await page.close()
})

test('The header has the correct text', async () => {
	// const browser = await puppeteer.launch({
	// 	headless: false
	// })
	// const page = await browser.newPage()
	// await page.goto('localhost:3000')

	// const text = await page.$eval('a.brand-logo', el => el.innerHTML)
	const text = await page.getContentsOf('a.brand-logo')

	expect(text).toEqual('Blogster')
})

test('clicking login starts oauth flow', async () => {
	await page.click('.right a')
	const url = await page.url()

	expect(url).toMatch(/accounts\.google\.com/)
}) 

test('When signed in, shows logout button', async () => {
	// const id = '5b193e2411e56a399cee8bbc'

	// const Buffer = require('safe-buffer').Buffer
	// const sessionObject = {
	// 	passport: {
	// 		user: id
	// 	}
	// }
	// const sessionString = Buffer
	// 	.from(JSON.stringify(sessionObject))
	// 	.toString('base64')

	// const Keygrip = require('keygrip')
	// const keys = require('../config/keys.js')
	// const keygrip = new Keygrip([keys.cookieKey])
	// const sig = keygrip.sign(`session=${sessionString}`)
// ----------------------------------------------- move to page.js
	// const user = await userFactory()
	// const { session, sig } = sessionFactory(user)

	// // await page.setCookie({ name: 'session', value: sessionString })
	// await page.setCookie({ name: 'session', value: session })
	// await page.setCookie({ name: 'session.sig', value: sig })
	// await page.goto('localhost:3000')
	// // note, if the anchor tag simply fails to appear, the test will fail at the line below
	// await page.waitFor(`a[href='/auth/logout']`)
// ----------------------------------------------- end move to page.js

	// use our shiny new login method
	await page.login()

	const text = await page.$eval(`a[href='/auth/logout']`, el => el.innerHTML)
	expect(text).toEqual('Logout')
})