const Discord = require('discord.js');
const client = new Discord.Client();

const request = require("request");
const jquery = require("cheerio");
const http = require("http");
const express = require('express');

const BreakException = {};

client.on("debug", msg => { return console.log("[debug]", msg); });
client.on("unk", 	 msg => { return console.log("[unknown]", msg); });
client.on('ready', () =>  { return console.log('[debug] Bot ready!'); });
client.on('message', message => {
	var msg = message.content.toLowerCase();
	for (var cmd in commands) {
		if (msg.indexOf(cmd) > -1 && message.author.id !== "185146510210629632") {
			commands[cmd].callback(message);
			break;
		}
	}
	if(message.author.id === "177419389447045120" || message.author.id === "153561453440401409" || message.author.id === "185293714040684544") 
		for (var cmd in admin_commands) if (msg.indexOf(cmd) > -1) admin_commands[cmd].callback(message);
});
client.login('my-token').then("Bot connected !").catch(console.log);

const commands = {};
const admin_commands = {};

admin_commands["!admin"] = {
	token: "!admin",
	description: "Liste des commandes administrateurs",
	callback: message => {
		let com = "";
		for (let cmd in admin_commands)  
			com += "  • " + admin_commands[cmd].token + " : " + admin_commands[cmd].description + "\n";
		message.channel.sendMessage("```Commandes :\n"+com+"```");
	}
}

admin_commands["!kick"] = {
	token: "!kick <username>",
	description: "Kick un membre",
	
	callback: message => {
		let tok = "!kick";
		let userID = (message.content.indexOf("<@") > 1) ? message.content.substring(tok.length).match("<@(.*)>")[1].replace("!", "") : message.content.substring(tok.length).trim();
		console.log(userID);
		client.fetchUser(userID).then(user => user.sendMessage(`
Bonjour, nous avons décider de retirer les personnes non actives et étant hors-sujet du serveur "Apprentissage du Japonais" pour avoir une meilleure visibilité et une meilleure organisation des membres présents.\n
Si jamais vous ne vous sentez pas concerné car nous avons fais une erreur et vous êtes actif/active ou voulez reprendre le japonais sérieusement et participer à la vie du serveur en partageant votre expérience, vos ressentis...\n
Vous pouvez cliquer sur ce lien pour revenir parmis nous : https://discordapp.com/invite/011REhyDAdjaUI3Pc
Passez une bonne journée ! :D

(Ceci est un message d'Astrobert, bot discord spécialisé dans l'apprentissage du Japonais :p )
		`).then("Message sent !").catch(console.log));
		
		message.guild.fetchMember(userID).then(user => user.kick().then(user => message.channel.sendMessage(`L'utilisateur ${user.nickname} a été correctement exclu du serveur`).catch(console.log))).catch(console.log);
	}
}

admin_commands["!prune"] = {
	token: "!prune <days>",
	description: "Purge les membres inactifs et envoie un message de réinvitation",
	
	callback: message => {
		const tok = "!prune";
		const days = message.content.substring(tok.length);
		message.guild.pruneMembers(parseInt(days))
		.then(pruned => message.channel.sendMessage(`I just pruned ${pruned} people!`))
  	.catch(console.error);
	}
}


commands["!help"] = {
	token: "!help",
	description: "Liste des commandes",
	callback: message => {
		let com = "";
		console.log(message.author, message.timestamp);
		for (let cmd in commands)	com += "  • " + commands[cmd].token + " : " + commands[cmd].description + "\n";
		message.channel.sendMessage("```Commandes :\n"+com+"```");
	}
}

commands["!kanji"] = {
	token: "!kanji <kanji>",
	description: "Description d'un ou plusieurs kanjis",
	callback: message => {
		const tok = "!kanji";
		const kanji = message.content.substring(tok.length);
		const url = "http://jisho.org/search/" + encodeURIComponent(kanji);
		
		if (message.content.startsWith(tok) && kanji != null) {
			request(url, (error, response, html) => {
				if(response.statusCode === 200) {					
					const $ = jquery.load(html);
					
					try {
						const kanjis = "div.kanji_light_block div.kanji_light_content";
						
						$(kanjis).each((index, div) => {
							JQuerySend($, div, data => {
								BotSendMessage(message, [
									"```Kanji : "+data.kanji,
									"  • on : " + data.on,
									"  • kun : " + data.kun,
									"  • Signification : " + data.trans +"```"
								])
							});
						});
					}
					catch(e) {
						if(e !== BreakException) throw e;
					}
				}
				else {
					console.log("An error has been detected -> Status Code : "+response.statusCode);
				}
			});
		}
	}
}

commands["!word"] = {
	token: "!word <mot>",
	description: "Traduction et lecture d'un mot",
	callback: (message) => {
		const tok = "!word";
		const word = message.content.substring(tok.length);
		const url = "http://jisho.org/api/v1/search/words?keyword=" + encodeURIComponent(word);
		
		if(message.content.startsWith(tok) && word != null) {
			request(url, (error, response, html) => {
				if(response.statusCode === 200) {
					const json = JSON.parse(html);
					
					try {
						JsonSend(json, data => {
							BotSendMessage(message, [
								"```Word : " + data.kanji,
								"  • reading : " + data.reading,
								"  • signification : " + data.senses +"```"
							]);
						});
					}
					catch(e) {
						if(e !== BreakException) throw e;
					}
				}
				else {
					console.log("An error has been detected -> Status Code : "+response.statusCode);
				}
			});
		}
	}
};


const minutes = 20, interval = minutes * 60 * 1000;
setInterval(function () {
	const options = {
		host: 'astrobert.herokuapp.com'
	};
	http.get(options, function (http_res) {
		console.log("Sent http request to astrobert.herokuapp.com to stay awake.");
	});
	client.login("my-token", function (error, token) {
		if (error) console.log(error);
	});
}, interval);

const getID = (id, users) => {
	for(let user in users) 
			if(user.id === id) return user;
	
	return false;
}

const BotSendMessage = (message, array) => {
	var msg = "";
	for(var i = 0; i < array.length; i++) {
		msg += array[i]+"\n";
	}
	message.channel.sendMessage(msg);
}

const JsonSend = (json, callback) => {
	if(json != "") {
		const first = json.data[0];
		
		if(!first) return;
		
		const common 	= first.is_common;
		const kanji 	= first.japanese[0].word;
		const reading = first.japanese[0].reading;
		const senses 	= first.senses[0].english_definitions.join(", ");
		
		const data = {
			common: common,
			kanji: kanji,
			reading: reading,
			senses: senses
		}
		return callback(data);
	}
}

const JQuerySend = (jquery, element, callback) => {
	const $ = jquery;
	const div = element;
	var arr = [];
	var trad_1 = $(div).find(".english span").first().text();
	$(div).find(".english span").each(function (index, span) {
		arr.push($(this).text());
	});
	var trans = arr.join("");
	var kanji = $(div).find(".japanese_gothic a").first().text();
	var on = $(div).find(".on .japanese_gothic a").map(function () {
		return ($(this).parent().parent().parent().find(".english span").first().text() == trad_1) ? $(this).text() : null;
	}).get().join(", ");
	var kun = $(div).find(".kun .japanese_gothic a").map(function () {
		return ($(this).parent().parent().parent().find(".english span").first().text() == trad_1) ? $(this).text() : null;
	}).get().join(", ");
	
	const data = {
		kanji: kanji,
		on: on,
		kun: kun,
		trans: trans
	}
	return callback(data);
};
