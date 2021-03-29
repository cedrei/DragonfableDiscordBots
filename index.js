let botNames = []
let botInstances = []

const Bot = require("./scripts/bot.js")

for (let i of botNames) {
	let token = process.env[`${i.toUpperCase()}TOKEN`]
	botInstances.push(new Bot(i, token))
}