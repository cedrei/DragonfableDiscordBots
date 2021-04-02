// List of all bot names, as they appear in /scripts
let botNames = ["ash"]
let botInstances = []

const Bot = require("./scripts/bot.js")

for (let i of botNames) {
	let botClass = require(`./scripts/${i}-main.js`)
	botInstances.push(new botClass())
}