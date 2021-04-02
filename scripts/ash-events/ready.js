module.exports = bot => {
	// First update the leaderboards once, then do it repeatedly once per minute
	bot.updateLeaderboards()
	setInterval(() => bot.updateLeaderboards(), 60*1000)
}