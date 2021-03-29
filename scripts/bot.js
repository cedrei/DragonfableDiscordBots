const Discord = require("discord.js")
const fs = require("fs")

class Bot {
	#data // Declare private var

	constructor(name, token, prefix) {
		this.client = new Discord.Client()
		this.name = name
		this.prefix

		this.loadEvents()
		this.setupCommandParsing()
		this.readDataFile()

		this.client.on("ready", () => {
			console.log(`${this.name} is live!`)
		})

		this.client.login(token)
	}

	loadEvents() {
		// Load the associated events from scripts/<bot>-events
		// First, load the folder
		fs.readdir(`./scripts/${this.name}-events`, (err, files) => {
			if (err) {
				// Whoops, something went wrong! Most likely the folder doesn't exist
				console.error(err)
				return
			}

			// Loop through all the files in the folder, and load it as an event
			files.forEach(file => {
				let eventFunction = require(`./${this.name}-events/${file}`)
				let eventName = file.split(".")[0]
				this.client.on(eventName, (...args) => eventFunction(this, this.client, ...args))
			})
		})
	}

	setupCommandParsing() {
		// Map commands to scripts/<bot>-commands
		this.client.on("message", message => {
			if (message.author.bot) {
				return // Bots shouldn't be able to respond to each other, creating potentially endless loops
			}
			if (message.content.indexOf(this.prefix) !== 0) {
				return // Message is irrelevant if it doesn't start with our prefix
			}

			// Split the message into arguments
			const args = message.content.slice(1).trim().split(/ +/g)
			// Argument 0 is the command name
			const command = args.shift().toLowerCase()

			try {
				// Load the file with the corresponding command, and then run it
				let commandFile = require(`./${this.name}-commands/${command}.js`)
				commandFile(this, this.client, message, args)
			} catch {
				// Wasn't actually a command.
				console.error(this.prefix+command+" is not a command.")
			}
		})
	}

	readDataFile() {
		// The files in /data is like a makeshift database of sorts
		// Here we load the file into the bots memory at instanciation
		fs.readFile(`./data/${this.name}.json`, "utf8", (err, data) => {
			if (err) {
				// File hasn't been created yet
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
		// When setting <bot>.data, this setter function will automatically also update the data file
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