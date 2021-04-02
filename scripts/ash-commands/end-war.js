/*
*	This command deactivates the leaderboard channel this command is used it
*/

module.exports = (bot, message, args) => {
	if (bot.data.guilds[message.guild.id] == undefined || bot.data.guilds[message.guild.id].leaderboards[message.channel.id] == undefined) {
		message.channel.send("This channel doesn't have a leaderboard!")
		return
	}
	delete bot.data.guilds[message.guild.id].leaderboards[message.channel.id]

	// Remove unnecessary cached data
	bot.cleanData()
	// Save to "database"
	bot.saveData()
	message.channel.send("This leaderboard will no longer be updated.")
}