module.exports = (bot, message, args) => {
	message.channel.send({
		embed: {
			fields: [
				{
					name: "!add-character",
					value: "Adds a character to a user. This will automatically make that user appear on this server's leaderboard(s) if it isn't already.\n"+
					"Usage: `!add-character <@user> <CharacterID>`"
				},{
					name: "!end-war",
					value: "Deactivates the leaderboard in the channel this command is used in.\n"+
					"Usage: `!end-war`"
				},{
					name: "!remove-user",
					value: "Removes a user from this server's leaderboards.\n"+
					"Usage: `!remove-user <@user>`"
				},{
					name: "!setup-leaderboard",
					value: "Sets up a leaderboard in the channel this command is used in. War Name needs to be exactly as it appears on character pages!\n"+
					"Usage: `!setup-leaderboard <WarName>`"
				}
			]
		}
	})
}