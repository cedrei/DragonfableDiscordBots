module.exports = (bot, member) => {
  bot.client.channels.fetch('883044898914328606')
    .then(channel => channel.send(member.user.tag + " has left the server."))
    .catch(console.error);
}
