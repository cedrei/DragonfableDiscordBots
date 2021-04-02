/*
*	Removes a user from a server's leaderboards
*/

module.exports = (bot, message, args) => {
	let mentions = Array.from(message.mentions.users)
	if (mentions.length != 1) {
		message.channel.send("You need to mention exactly one user.")
		return
	}
	let userID = mentions[0][0]

	if (bot.data.guilds[message.guild.id] == undefined || bot.data.guilds[message.guild.id].users[userID] == undefined) {
		message.channel.send("This user isn't added to this server's leaderboards!")
		return
	}

	delete bot.data.guilds[message.guild.id].users[userID]

	// Remove unnecessary cached objects
	bot.cleanData()
	// Save to "database"
	bot.saveData()

	message.channel.send("User successfully removed.")
}