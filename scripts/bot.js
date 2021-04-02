const Discord = require("discord.js")
const fs = require("fs")

class Bot {
	constructor(name, token, prefix, needsAuth, initialDataStructure) {
		this.client = new Discord.Client()
		this.name = name
		this.prefix = prefix
		this.needsAuth = needsAuth
		this.initialDataStructure = initialDataStructure

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
				this.client.on(eventName, (...args) => eventFunction(this, ...args))
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

			if (this.needsAuth && this.authorize(message.member) == false) {
				message.channel.send("You do not have the permissions to use this bot.")
				return
			}

			// Split the message into arguments
			const args = message.content.slice(1).trim().split(/ +/g)
			// Argument 0 is the command name
			const command = args.shift().toLowerCase()

			let commandFile

			try {
				// Load the file with the corresponding command, and then run it
				commandFile = require(`./${this.name}-commands/${command}.js`)
			} catch {
				// Wasn't actually a command.
				console.error(this.prefix+command+" is not a command.")
				return
			}

			try {
				commandFile(this, message, args)
			} catch(e) {
				console.error(e)
			}
			
		})
	}

	authorize(member) {
		return member.hasPermission("MANAGE_MESSAGES")
	}

	readDataFile() {
		// The files in /data is like a makeshift database of sorts
		// Here we load the file into the bots memory at instanciation
		fs.readFile(`./data/${this.name}.json`, "utf8", (err, data) => {
			if (err) {
				// File hasn't been created yet
				this.data = this.initialDataStructure||{}
				// Make sure the /data folder exists
				fs.access("./data", (err) => {
					if (err) {
						fs.mkdir("./data", (err) => {
							if (err) {
								console.error(error)
							} else {
								this.saveData()
							}
						})
					} else {
						this.saveData()
					}
				})
			} else {
				this.data = JSON.parse(data)
			}
			console.log(this.data)
		})
	}

	saveData() {
		let json = JSON.stringify(this.data)
		fs.writeFile(`./data/${this.name}.json`, json, (err) => {
			if (err) {
				console.error(err)
			}
		})
	}
}

module.exports = Bot