const Discord = require("discord.js")
const fs = require("fs")

class Bot {
	#data

	constructor(name, token) {
		this.client = new Discord.Client()
		this.name = name

		this.loadEvents()
		this.setupCommandParsing()
		this.readDataFile()

		this.client.login(token)
	}

	loadEvents() {
		fs.readdir(`./scripts/${this.name}-events`, (err, files) => {
			if (err) {
				console.error(err)
				return
			}
			files.forEach(file => {
				let eventFunction = require(`./${this.name}-events/${file}`)
				let eventName = file.split(".")[0]
				this.client.on(eventName, (...args) => eventFunction(this, this.client, ...args))
			})
		})
		this.client.on("ready", () => {
			console.log(`${this.name} is live!`)
		})
	}

	setupCommandParsing() {
		this.client.on("message", message => {
			if (message.author.bot) {
				return
			}
			if (message.content.indexOf(this.prefix) !== 0) {
				return
			}

			const args = message.content.slice(1).trim().split(/ +/g)
			const command = args.shift().toLowerCase()

			try {
				let commandFile = require(`./${this.name}-commands/${command}.js`)
				commandFile(this, this.client, message, ...args)
			} catch {
				console.error(this.prefix+command+" is not a command.")
			}
		})
	}

	readDataFile() {
		fs.readFile(`./data/${this.name}.json`, "utf8", (err, data) => {
			if (err) {
				this.#data = {}
				return
			}
			this.#data = JSON.parse(data)
		})
	}

	get data() {
		return this.#data
	}

	set data(newData) {
		if (typeof newData == "object") {
			this.#data = newData
			fs.writeFile(`./data/${this.name}.json`, newData, (err) => {
				if (err) {
					console.error(err)
				}
			})
		} else {
			throw new Error(`The data field needs to be an object.`)
		}
	}
}

module.exports = Bot