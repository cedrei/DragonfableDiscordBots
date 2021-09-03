const Bot = require("./bot.js")
const https = require("https")

module.exports = class extends Bot {
	constructor() {
		// Load token from Environment Variables, to prevent it from being displayed publicly on GitHub
		// Replace this with your own token if you want to host a copy of the bot yourself
		let token = process.env[`HACKETOKEN`]
		super("hacke", token, ";", false)
	}

	
}