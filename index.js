// List of all bot prefixes, and names that should be same as the folders in /scripts
let botData = []

let botInstances = []

const Bot = require("./scripts/bot.js")

for (let i of botData) {
	// Load token from Heroku env variables.
	// This is to keep the token hidden, stopping people from running modified versions of the bot
	// with full access to the servers they are in
	// Of course, you can always create your own bot based on this code, then just set token to whatever that bot's token is
	let token = process.env[`${i.name.toUpperCase()}TOKEN`]
	botInstances.push(new Bot(i.name, token, i.token))
}