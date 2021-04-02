const Bot = require("./bot.js")
const https = require("https")

module.exports = class extends Bot {
	constructor() {
		// Load token from Environment Variables, to prevent it from being displayed publicly on GitHub
		// Replace this with your own token if you want to host a copy of the bot yourself
		let token = process.env[`ASHTOKEN`]
		super("ash", token, "!", true)
		this.initialDataStructure = {
			characters: {},
			guilds: {},
			wars: []
		}

		// Channel id for potential cheaters logging
		this.logChannelID = "826889360254304326"
	}

	logCheater(charID, oldTime, newTime, oldWaves, newWaves) {
		let logChannel = this.client.channels.fetch(this.logChannelID)
			.then(channel => channel.send(`\`\`\`The character with ID ${charID} had ${oldWaves} at ${new Date(oldTime).toUTCString()}, but at ${new Date(newTime).toUTCString()} it had ${newWaves}.\`\`\``))
			.catch(console.error)
	}

	parseCharPage(html, characterID) {
		// If the char page has a cheater mark, this character shouldn't be allowed to count
		if (html.indexOf("Cheater Mark") != -1) {
			this.data.characters[characterID].wars = []
			return
		}

		// Time logging is to keep track of the character's WPM
		let currentTime = new Date().getTime()
		let timeSinceLast = currentTime-this.data.characters[characterID].lastUpdated
		this.data.characters[characterID].lastUpdated = currentTime

		// Count DMs to be able to continue counting post 10001 waves
		let dmCount = 0
		let oldDmCount = this.data.characters[characterID].dms
		if (html.indexOf("Defender&#39;s Medal") != -1) {
			if (html.indexOf("Defender&#39;s Medal (x") == -1) {
				dmCount = 1
			} else {
				html = html.split("Defender&#39;s Medal (x")[1]
				dmCount = parseFloat(html.split(")")[0])
			}
		}

		// Need to make sure that dmDifference is not lower than 0, as that would make you *lose* waves if you purchased a DM item
		let dmDifference = Math.max(0, dmCount-oldDmCount)
		this.data.characters[characterID].dms = dmCount

		// To reduce the risk of false positives, we cut out most of the char page that isn't war records (they're the last thing that appears)
		// This could end up being undefined if its a new character without any wars. Then set it to an empty string
		html = html.split("<h4>War Records</h4>")[1]||""

		for (let war of this.data.wars) {
			// If the character hasn't participated in this war, set waves to 0
			if (html.indexOf(`<span class="warlabel">${war}</span><br />`) == 0) {
				this.data.characters[characterID].wars[war]=0
				continue
			}

			// Get the specific part of the html for this war
			let warEntry = html.split(`<span class="warlabel">${war}</span><br />`)[1].split("</span><br />")[0]
			let waves = parseInt(warEntry.split('<span class="mx-2 d-inline-block">')[1].split(" ")[0])

			// If this is a new character that wasn't in last update cycle, this will be set to 0 to avoid it being undefined
			// Note that this won't trigger any false positive cheater logs as the initial time stamp will be 0, aka in 1970
			// Even doing 10001 waves in one cycle won't be suspicious if that cycle is over 50 years long, lol
			let wavesLastUpdate = this.data.characters[characterID].wars[war]||0
			let wavesSinceLast = waves-wavesLastUpdate
			let millisecondPerWave = timeSinceLast/wavesSinceLast
			if (millisecondPerWave <= 5000) {
				// 5 seconds per wave shouldn't be possible with any warring methods. Log, and report manually to Verlyrus
				this.logCheater(characterID, currentTime-timeSinceLast, currentTime, wavesLastUpdate, waves)
			}
			if (waves == 10001) {
				// If the char page displays waves as 10001, add on the amount of dms gathered since last update to our wave count
				waves = Math.min(10001,wavesLastUpdate+dmDifference)
			}

			this.data.characters[characterID].wars[war]=waves
		}
	}

	cleanData() {
		// Remove unnecessary cached char IDs and wars
		// This is to not download char pages that doesn't show up on any leaderboards regardless
		// But also to reduce file size of the data .json

		// First make a list of all char IDs and wars
		let unnecessaryCharIDs = Object.keys(this.data.characters)
		let unnecessaryWars = JSON.parse(JSON.stringify(this.data.wars))

		// Loop through all leaderboards, and everytime a war or character is used, it will be removed from the above lists
		for (let guildID in this.data.guilds) {
			for (let userID in this.data.guilds[guildID].users) {
				let charIDs = this.data.guilds[guildID].users[userID]
				for (let charID of charIDs) {
					if (unnecessaryCharIDs.includes(charID)) {
						unnecessaryCharIDs.splice(unnecessaryCharIDs.indexOf(charID), 1)
					}
				}
			}

			for (let leaderboardID in this.data.guilds[guildID].leaderboards) {
				let warName = this.data.guilds[guildID].leaderboards[leaderboardID]
				if (unnecessaryWars.includes(warName)) {
					unnecessaryWars.splice(unnecessaryWars.indexOf(warName), 1)
				}
			}
		}

		// Those that remains in the list will be purged from the data .json
		for (let charID of unnecessaryCharIDs) {
			delete this.data.characters[charID]
		}

		for (let war of unnecessaryWars) {
			delete this.data.wars[war]
			for (let charID in this.data.characters) {
				delete this.data.characters[charID][war]
			}
		}

		// We do not call saveData here to avoid calling it twice. It is up to the caller to save the data to the "database"
	}

	updateLeaderboards() {
		let url = "https://account.dragonfable.com/CharPage?id="
		// We need to supply a User-Agent header to avoid a 500 Internal Server Error
		let options = {
		    headers: {
		    	"User-Agent": "Mozilla/5.0 (compatible; AshBot/1.0.0; +http://falwynn.herokuapp.com/)"
		    }
		}

		// This is how many requests we need to wait for to return. They are all done concurrently
		let pendingRequests=Object.keys(this.data.characters).length

		for (let characterID in this.data.characters) {
			https.get(url+characterID, options, response => {
		        response.setEncoding("utf8")
		        let html = ""

		        response.on("data", chunk => {
		        	html += chunk
		        })

		        response.on("end", () => {
		        	if (response.statusCode == 200) {
		        		// Only parse the char page if the get is successful
		        		// If it isn't, data will just be loaded from the old load of that char page
		        		this.parseCharPage(html, characterID)
		        	}
		        	pendingRequests--
		        	if (pendingRequests == 0) {
		        		// Once all are done, save to the .json and update the leaderboards
		        		this.saveData()
		        		this.postAllLeaderboards()
		        	}
		        })
			})
		}
	}

	postLeaderboard(messages, channelID) {
		let channel = this.client.channels.fetch(channelID)
			.then(channel => {
				channel.messages.fetch()
					.then(oldMessages => {
						oldMessages = Array.from(oldMessages.values())

						// This is mostly a safeguard to make sure a leaderboard isn't accidentally placed in an ordinary text channel
						for (let i of oldMessages) {
							if (i.author.id != this.client.user.id) {
								channel.send("You need to clear this channel of posts by other users than this bot.")
								return
							}
						}

						// If there are more messages than needed to display the leaderboard, delete the excess ones
						for (let i = messages.length; i < oldMessages.length; i++) {
							oldMessages[i].delete()
						}

						for (let i = 0; i < messages.length; i++) {
							if (i < oldMessages.length) {
								// Edit the messages as far as those exist
								oldMessages[i].edit(messages[i])
							} else {
								// If we need new messages, instead post them
								channel.post(messages[i])
							}
						}
					})
			})
	}

	generateLeaderboard(channelID, users, guild, warName) {
		// First, generate an array of everyone who will be displayed on the leaderboard...
		let data = []
		for (let userID in users) {
			let userObject = {
				name: guild.members.cache.get(userID).user.tag,
				waves: 0
			}
			for (let characterID of users[userID]) {
				userObject.waves += this.data.characters[characterID].wars[warName]
			}
			data.push(userObject)
		}
		// ... and sort it in the order they should appear
		data.sort((a,b)=>b.waves-a.waves)

		let messages = []
		// This is to make everything aligned.
		// For example, if we have 100 slots on the leaderboard,
		// we want the first 9 to have two extra spaces,
		// and the next 90 to have one extra space.
		// This var is just how many the initial 9 placements should have
		let additionalSpacesCount = Math.floor(Math.log10(data.length))

		// These vars are to make tied players appear with the same number
		let previousPlacement=0
		let previousWaves=Infinity

		// Each message should hold 25 players
		for (let i = 0; i < data.length; i += 25) {
			// Generate the message
			let message = "```css"
			for (let j = i; j < Math.min(i+25, data.length); j++) {
				let additionalSpacesCountTemp = additionalSpacesCount-Math.floor(Math.log10(j+1))
				let spaces = Array(additionalSpacesCountTemp).fill(" ").join("")
				let placement = j+1
				if (previousWaves == data[j].waves||0) {
					placement = previousPlacement
				}
				previousWaves = data[j].waves||0
				previousPlacement = placement
				message += `\n#${placement} ${spaces}[${data[j].name}] ${data[j].waves||0} Waves`
			}
			message+="```"
			messages.push(message)
		}
		this.postLeaderboard(messages, channelID)
	}

	postAllLeaderboards() {
		// Loop through all leaderboards, then make sure all the members on it are cached, and then finally post the leaderboard.
		for (let guildID in this.data.guilds) {
			let guildData = this.data.guilds[guildID]
			this.client.guilds.fetch(guildID)
				.then(guild => {
					for (let channelID in guildData.leaderboards) {
						guild.members.fetch({ user: Object.keys(guildData.users) })
							.then(() => this.generateLeaderboard(channelID, guildData.users, guild, guildData.leaderboards[channelID]))
							.catch(console.error)
					}
				})
		}
	}
}