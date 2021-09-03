const http = require("http")

// List of all bot names, as they appear in /scripts
let botNames = ["ash", "hacke"]
let botInstances = []

const Bot = require("./scripts/bot.js")

for (let i of botNames) {
	let botClass = require(`./scripts/${i}-main.js`)
	botInstances.push(new botClass())
}


// Heroku requires us to host an actual page, or it will kill the app after 60 seconds
http.createServer( function (request, response) {  
   	response.writeHead(200, {'Content-Type': 'text/html'});	
         
   	response.write('Hi! This server runs a discord bot, not a web page. You can invite it <a href="https://discord.com/oauth2/authorize?client_id=693805625804587079&scope=bot&permissions=8">here</a>!');		

    response.end(); 
}).listen(process.env.PORT || 5000);

// Send get requests to keep the bot awake
setInterval(function() {
	http.get("http://dragonfablediscordbots.herokuapp.com/");
}, 20 * 60 * 1000); // every 20 minutes (1 200 000 ms)