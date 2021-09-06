module.exports = (bot, member) => {
  client.channels.fetch('883009554286268509')
    .then(channel => channel.send("Welcome, <@"+member.id + ">! Öhöhöhähö-öhöhöhähö-öhöhöhähö-hehehehehehehehe"))
    .catch(console.error);
}
