const Discord = require("discord.js")
const fs = require("fs")
const pg = require("pg")

class Bot {
	constructor(name, token, prefix, needsAuth) {
		this.client = new Discord.Client()
		this.name = name
		this.prefix = prefix
		this.needsAuth = needsAuth

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
		// Originally this program was intended to save things in a .json file, but the host deleted that file
		// every restart so that wasn't viable. Since all the code is still set up to use a json file,
		// we will instead save and load the json from a database (also I'm lazy)

		// Loading the bot locally or something, idk. So that you can test without setting up a SQL database.
		if (process.env.DATABASE_URL == undefined) {
			console.log("WARNING: No Database url specified. No data loaded.")
			this.data = {}
			return
		}
		let pgClient = new pg.Client({
			connectionString: process.env.DATABASE_URL,
			ssl: {
				rejectUnauthorized: false
			}
		})
		pgClient.connect()
		pgClient.query(`SELECT JSON FROM BotData WHERE BotName='${this.name}';`, (err, res) => {
			if (err) {
				// Throw rather than log because this will break the entire bot if we cannot load the data initially
				throw err
			}
			this.data = JSON.parse(res.rows[0].json)
			pgClient.end()
		})
	}

	saveData() {
		let pgClient = new pg.Client({
			connectionString: process.env.DATABASE_URL,
			ssl: {
				rejectUnauthorized: false
			}
		})
		pgClient.connect()
		pgClient.query(`UPDATE BotData SET JSON='${JSON.stringify(this.data)}' WHERE BotName='${this.name}';`, (err) => {
			if (err) {
				console.error(err)
			}
			pgClient.end()
		})
	}
}

module.exports = Bot
