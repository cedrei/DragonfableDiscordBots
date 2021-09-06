module.exports = (bot, member) => {
  bot.client.channels.fetch('883009554286268509')
    .then(channel => channel.send("Welcome, <@" + member.id + ">! https://youtu.be/A_IDGrKZ0Rs"))
    .catch(console.error);
}
