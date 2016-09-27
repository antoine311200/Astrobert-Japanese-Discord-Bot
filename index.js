const Discord = require('discord.js');
const client = new Discord.Client();

const request = require("request");
const jquery = require("cheerio");
const http = require("http");

const BreakException = {};


client.on("debug", msg => { return console.log("[debug]", msg); });
client.on("unk", 	 msg => { return console.log("[unknown]", msg); });
client.on('ready', () => {
  console.log('[debug] Bot ready!');
});
client.on('message', message => {
	
	var msg = message.content.toLowerCase();
	for (var cmd in commands) if (msg.indexOf(cmd) > -1) commands[cmd].callback(message);
	
  if (message.content === 'ping') {
    message.reply('pong');
  }
});
client.login('MTg1MTQ2NTEwMjEwNjI5NjMy.CsuwKg.CoQlr8Nc03f6fBM3YEMJfNUE-UI').then("Bot connected !").catch(console.log);

const commands = {};

commands["!help"] = {
	token: "!aide",
	description: "Liste des commandes",
	
	callback: message => {
		let com = "";
		for (let cmd in commands)  
			com += "  • " + commands[cmd].token + " : " + commands[cmd].description + "\n";
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
									"__Kanji__ : "+data.kanji,
									"  • on : " + data.on,
									"  • kun : " + data.kun,
									"  • Signification : *" + data.trans +"*"
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
								"__Word__ : ",
								"  • word : " + data.kanji,
								"  • reading : " + data.reading,
								"  • signification : *" + data.senses +"*"
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
	client.login("MTg1MTQ2NTEwMjEwNjI5NjMy.CsuwKg.CoQlr8Nc03f6fBM3YEMJfNUE-UI", function (error, token) {
		if (error) console.log(error);
	});
}, interval);




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