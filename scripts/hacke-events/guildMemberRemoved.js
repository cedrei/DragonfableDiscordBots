module.exports = (bot, member) => {
  client.channels.fetch('883044898914328606')
    .then(channel => channel.send(member.tag + " has left the server."))
    .catch(console.error);
}
