const https = require("https")

/*
*	This command adds a new character to a user
*	If no active leaderboard has this character, we'll have to
*	check if it has a cheater mark first before we allow it
*	Note that this adds the user to all the leaderboards in the server
*	this command is used in (Will be useful for potential future two-sided wars)
*/

module.exports = (bot, message, args) => {
	if (bot.data.guilds[message.guild.id] == undefined) {
		message.channel.send("You need to set up a leaderboard in this server before you can add characters!")
		return
	}
	let characterID = args[1]
	if (isNaN(characterID)) {
		message.channel.send("Character id is invalid.")
		return
	} 
	let mentions = Array.from(message.mentions.users)
	if (mentions.length != 1) {
		message.channel.send("You need to mention exactly one user.")
		return
	}
	let userID = mentions[0][0]

	// If the character is already cached, no need to download its char page
	if (bot.data.characters[characterID] != undefined) {
		resolveAdding(characterID, userID, bot, message)
	} else {
		readCharacter(characterID, userID, bot, message)
	}
}

function readCharacter(characterID, userID, bot, message) {
	let url = "https://account.dragonfable.com/CharPage?id="+characterID

	// We need to supply a User-Agent header for the char page to not return a 500 Internal Server Error
	let options = {
	    headers: {
	    	"User-Agent": "Mozilla/5.0 (compatible; AshBot/1.0.0; +http://falwynn.herokuapp.com/)"
	    }
	}
	https.get(url, options, response => {
		if (response.statusCode != 200) {
        	message.channel.send("This character ID doesn't seem to exist. Alternatively, the DF servers might be unavailable at this time.")
        	return
        }

        response.setEncoding("utf8")
        let rawData = ""

        response.on("data", chunk => {
        	rawData += chunk
        })

        response.on("end", () => {
        	if (rawData.indexOf("Cheater Mark") != -1) {
				message.channel.send("Warning: This character has a cheater mark. Use the !remove-user command if you don't want characters with cheater marks on your leaderboard.")
			}

			bot.data.characters[characterID] = {
				wars: {},
				dms: 0,
				lastUpdated: 0
			}
        	resolveAdding(characterID, userID, bot, message)
        })
	})
}

function resolveAdding(characterID, userID, bot, message) {
	if (bot.data.guilds[message.guild.id].users[userID] == undefined) {
		bot.data.guilds[message.guild.id].users[userID] = []
	}
	bot.data.guilds[message.guild.id].users[userID].push(characterID)

	// Save to "database"
	bot.saveData()
	message.channel.send("Character added!")
}