/*
*	This command sets up a new leaderboard in the channel it is used in
*/

module.exports = (bot, message, args) => {
	// args is split by spaces, in this command we need to join them again
	let warName = args.join(" ")
	let channelID = message.channel.id
	message.delete()
	if (bot.data.guilds[message.guild.id] == undefined) {
		bot.data.guilds[message.guild.id] = {
			leaderboards: {},
			users: {}
		}
	}
	bot.data.guilds[message.guild.id].leaderboards[channelID] = warName
	if (!bot.data.wars.includes(warName)) {
		bot.data.wars.push(warName)
	}

	// Save to "database"
	bot.saveData()
	message.channel.send("Leaderboard set up. Wait until the next update cycle (at most 1 minute) for the leaderboard to appear.")
}