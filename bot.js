const fs = require("fs");
FFMPEG = require('ffmpeg');
const ms = require("ms");
const weather = require('weather-js')
const Discord = require("discord.js");
const client = new Discord.Client();
const active = new Map();
const ytdl = require('ytdl-core');
const search = require('yt-search');
const configs = require("./configs.json");
var botConfigs = {
    token: "", //Bot Token
    prefix: "!", //指令前綴
    gameStatus: "GameName", //遊玩的遊戲名稱
    statusType: "PLAYING",
    commands: [{"id":1,"command":"test","message":"Hello world!","embed":false},{"id":2,"command":"embed","message":"","embed":true,"embedFields":[{"title":"Title","text":"Content"}]}],
    plugins: [{"id":0,"name":"Purge messages","activated":false,"config":"","info":{"example":"!purge 20","note":"","requirements":"Create a logs channel"}},{"id":1,"name":"Welcome message","activated":false,"config":"welcomemessage","info":{"example":"","note":"","requirements":"Create a channel"}},{"id":2,"name":"Kick user","activated":false,"config":"","info":{"example":"!kick @user spam","note":"","requirements":"Create a logs channel"}},{"id":3,"name":"Ban user","activated":false,"config":"","info":{"example":"!ban @user spam","note":"","requirements":"Create a logs channel"}},{"id":4,"name":"Report user","activated":false,"config":"","info":{"example":"!report @user spam","note":"","requirements":"Create a logs channel"}},{"id":5,"name":"Temp mute user","activated":false,"config":"","info":{"example":"!tempmute @user 10s","note":"s = seconds, m = minutes, h = hours","requirements":"Create a logs channel"}},{"id":6,"name":"Server info","activated":false,"config":"","info":{"example":"!serverinfo","note":"","requirements":""}},{"id":7,"name":"Weather info","activated":false,"config":"weather","info":{"example":"!weather Copenhagen","note":"","requirements":""}},{"id":8,"name":"Music - Export only","activated":false,"config":"","info":{"example":"!play {YouTube URL}, !leave, !pause, !resume, !queue, !skip","note":"Export only","requirements":""}},{"id":9,"name":"Channel lockdown","activated":false,"config":"","info":{"example":"!lockdown 10s","note":"s = seconds, m = minutes, h = hours","requirements":""}},{"id":10,"name":"Shutdown command","activated":false,"config":"","info":{"example":"!shutdown","note":"","requirements":""}},{"id":11,"name":"Banned words","activated":false,"config":"bannedwords","info":{"example":"","note":"Auto delete messages contained banned words","requirements":""}}],
    welcomemessage: {"channelid":"1234567890","text":"Welcome to this Server!"}, //成員加入伺服器的歡迎訊息
    weather: {"degree":"C"} //天氣單位
};

var ops = {
  active: active
}

client.on("ready", async function () {
	if(botConfigs.statusType === "PLAYING" || botConfigs.statusType === "WATCHING" || botConfigs.statusType === "LISTENING") {
		client.user.setActivity(botConfigs.gameStatus, { type: botConfigs.statusType });
	} else {
		client.user.setActivity(botConfigs.gameStatus, { type: "PLAYING" });
	}
});

client.on("guildCreate", async function () {
  	if(botConfigs.statusType === "PLAYING" || botConfigs.statusType === "WATCHING" || botConfigs.statusType === "LISTENING") {
		client.user.setActivity(botConfigs.gameStatus, { type: botConfigs.statusType });
	} else {
		client.user.setActivity(botConfigs.gameStatus, { type: "PLAYING" });
	}
});

client.on("guildDelete", async function (guild) {
  	if(botConfigs.statusType === "PLAYING" || botConfigs.statusType === "WATCHING" || botConfigs.statusType === "LISTENING") {
		client.user.setActivity(botConfigs.gameStatus, { type: botConfigs.statusType });
	} else {
		client.user.setActivity(botConfigs.gameStatus, { type: "PLAYING" });
	}
});

client.on("guildMemberAdd", async function (member) {
  if (botConfigs.plugins[1].activated == true) {
    member.guild.channels
      .get(botConfigs.welcomemessage.channelid)
      .send(`${member}, ${botConfigs.welcomemessage.text}`);
  }
});

client.on("message", async function (message) {
	if (botConfigs.plugins[11].activated == true) {
        configs.bannedWords.forEach(async function (element) {
            if (message.content.includes(element)) {
                message.delete().catch(O_o => { });
                let projectData = await handler.getProjectData();
                message.author.send(projectData.bannedwords.responseMessage);
                return;
            }
        });
    }

    let prefix = botConfigs.prefix;

    if (message.author.bot) return;

    if (message.content.indexOf(prefix) !== 0) return;

    const args = message.content
        .slice(prefix.length)
        .trim()
        .split(/ +/g);
    const command = args.shift().toLowerCase();

    if (command === "purge" && botConfigs.plugins[0].activated == true) {
    	if (!message.member.hasPermission("MANAGE_MESSAGES")) return message.channel.send("You don't have permission!");
        const deleteCount = parseInt(args[0], 10);

        let embed = new Discord.RichEmbed()
            .setDescription("~Purge~")
            .setColor("#e56b00")
            .addField("Messages: ", `${deleteCount}`)
            .addField("Purged By", `<@${message.author.id}> with ID ${message.author.id}`)
            .addField("Purged In", message.channel)
            .addField("Time", message.createdAt);

        //let channel = message.guild.channels.find(`name`, "logs");
        let channel = message.guild.channels.find(ch => ch.name === 'logs');
        if (!channel) {
            message.channel.send("Can't find a 'logs' channel.");
            return;
        }

        if (!deleteCount || deleteCount < 2 || deleteCount > 100) {
            message.channel.send("Example: " + prefix + "purge 10");
            message.channel.send("Please enter a number between 2 and 100");
            return;
        }

        const fetched = await message.channel.fetchMessages({ limit: deleteCount });
        channel.send(embed);
        message.channel
            .bulkDelete(fetched)
            .catch(error => message.reply("Error. Contact an administrator."));
    }

    if (command === "kick" && botConfigs.plugins[2].activated == true) {
        let bUser = message.guild.member(message.mentions.users.first() || message.guild.members.get(args[0]));
        if (!bUser) return message.channel.send("Can't find user!");
        let bReason = args.join(" ").slice(22);
        if (!message.member.hasPermission("KICK_MEMBERS")) return message.channel.send("You don't have permission!");
        if (bUser.hasPermission("ADMINISTRATOR")) return message.channel.send("That person can't be kicked")


        let banEmbed = new Discord.RichEmbed()
            .setDescription("~Kick~")
            .setColor("#bc0000")
            .addField("Kicked User", `${bUser} with ID ${bUser.id}`)
            .addField("Kicked By", `<@${message.author.id}> with ID ${message.author.id}`)
            .addField("Kicked In", message.channel)
            .addField("Time", message.createdAt)
            .addField("Reason", bReason);

        //let incidentchannel = message.guild.channels.find(`name`, "logs");
        let channel = message.guild.channels.find(ch => ch.name === 'logs');
        if (!channel) {
            message.channel.send("Can't find a 'logs' channel.");
            return;
        }

        message.guild.member(bUser).kick(bReason);
        channel.send(banEmbed);
    }

    if (command === "ban" && botConfigs.plugins[3].activated == true) {
        let bUser = message.guild.member(message.mentions.users.first() || message.guild.members.get(args[0]));
        if (!bUser) return message.channel.send("Can't find user!");
        let bReason = args.join(" ").slice(22);
        if (!message.member.hasPermission("BAN_MEMBERS")) return message.channel.send("You don't have permission!");
        if (bUser.hasPermission("ADMINISTRATOR")) return message.channel.send("That person can't be banned")


        let banEmbed = new Discord.RichEmbed()
            .setDescription("~Ban~")
            .setColor("#bc0000")
            .addField("Banned User", `${bUser} with ID ${bUser.id}`)
            .addField("Banned By", `<@${message.author.id}> with ID ${message.author.id}`)
            .addField("Banned In", message.channel)
            .addField("Time", message.createdAt)
            .addField("Reason", bReason);

        //let incidentchannel = message.guild.channels.find(`name`, "logs");
        let channel = message.guild.channels.find(ch => ch.name === 'logs');
        if (!channel) {
            message.channel.send("Can't find a 'logs' channel.");
            return;
        }

        message.guild.member(bUser).ban(bReason);
        channel.send(banEmbed);
    }

    if (command === "report" && botConfigs.plugins[4].activated == true) {
        let rUser = message.guild.member(message.mentions.users.first() || message.guild.members.get(args[0]));
        if (!rUser) return message.channel.send("Couldn't find user.");
        let reason = args.join(" ").slice(22);

        let reportEmbed = new Discord.RichEmbed()
            .setDescription("Reports")
            .setColor("#15f153")
            .addField("Reported User", `${rUser} with ID: ${rUser.id}`)
            .addField("Reported By", `${message.author} with ID: ${message.author.id}`)
            .addField("Channel", message.channel)
            .addField("Time", message.createdAt)
            .addField("Reason", reason);


        //let reportschannel = message.guild.channels.find(`name`, "logs");
        let channel = message.guild.channels.find(ch => ch.name === 'logs');
        if (!channel) {
            message.channel.send("Can't find a 'logs' channel.");
            return;
        }

        message.delete().catch(O_o => { });
        channel.send(reportEmbed);
    }

    if (command === "tempmute" && botConfigs.plugins[5].activated == true) {
        let tomute = message.mentions.members.first() || message.guild.members.get(args[0]);
        if (!tomute) return message.reply("Could't find user.");
        if (tomute.hasPermission("ADMINISTRATOR")) return message.reply("He's an administrator. You can't do that!");
        if (!message.member.hasPermission("MUTE_MEMBERS")) return message.channel.send("You don't have permission");

        let muterole = message.guild.roles.find(`name`, "muted");
        let muteEmbed = new Discord.RichEmbed()
            .setDescription("~MUTED~")
            .setColor("#e56b00")
            .addField("Muted User", `${tomute} with ID ${tomute.id}`)
            .addField("Muted By", `<@${message.author.id}> with ID ${message.author.id}`)
            .addField("Muted In", message.channel)
            .addField("Time", message.createdAt)

        //let muteChannel = message.guild.channels.find(`name`, "logs");
        let channel = message.guild.channels.find(ch => ch.name === 'logs');
        if (!channel) {
            message.channel.send("Can't find a 'logs' channel.");
            return;
        }
        channel.send(muteEmbed);
        if (!muterole) {
            try {
                muterole = await message.guild.createRole({
                    name: "muted",
                    color: "#000000"
                })
                message.guild.channels.forEach(async (channel, id) => {
                    await channel.overwritePermissions(muterole, {
                        SEND_MESSAGES: false,
                        ADD_REACTIONS: false,
                        SPEAK: false
                    })
                })
            } catch (e) {
                console.log(e.stack);
            }
        }

        let mutetime = args[1];
        if (!mutetime) return message.reply("You didn't specify a time!");

        await (tomute.addRole(muterole.id));
        message.reply(`<@${tomute.id}> has been muted for ${ms(mutetime)}`)

        setTimeout(function () {
            tomute.removeRole(muterole.id);
            message.channel.send(`<@${tomute.id}> has been unmuted!`)

        }, ms(mutetime));

    }

    if (command === "serverinfo" && botConfigs.plugins[6].activated == true) {
        let sicon = message.guild.iconURL;
        let sererembed = new Discord.RichEmbed()
            .setDescription("Server Information")
            .setColor("#15f153")
            .setThumbnail(sicon)
            .addField("Server Name", message.guild.name)
            .addField("Created On", message.guild.createdAt)
            .addField("You Joined", message.member.joinedAt)
            .addField("Total Members", message.guild.memberCount);

        return message.channel.send(sererembed);
    }

    if (command === "weather" && botConfigs.plugins[7].activated == true) {
        weather.find({ search: args.join(" "), degreeType: botConfigs.weather.degree }, function (err, result) {
            if (err) message.channel.send(err);

            if (result.length === 0) {
                message.channel.send('**Please enter a valid location.**')
                return;
            }

            var current = result[0].current;
            var location = result[0].location;

            const embed = new Discord.RichEmbed()
                .setDescription(`**${current.skytext}**`)
                .setAuthor(`Weather for ${current.observationpoint}`)
                .setThumbnail(current.imageUrl)
                .setColor(0x00AE86)
                .addField('Timezone', `UTC${location.timezone}`, true)
                .addField('Degree Type', location.degreetype, true)
                .addField('Temperature', `${current.temperature} Degrees`, true)
                .addField('Feels Like', `${current.feelslike} Degrees`, true)
                .addField('Winds', current.winddisplay, true)
                .addField('Humidity', `${current.humidity}%`, true)

            message.channel.send({ embed });
        });
    }

    if (command === "lockdown" && botConfigs.plugins[9].activated == true) {
        let time = args[0];

        if (!client.lockit) { client.lockit = []; }
        let validUnlocks = ["release", "unlock", "u"];
        if (!time) { return message.reply("I need a set time to lock the channel down for!"); }

        const Lockembed = new Discord.RichEmbed()
            .setColor(0xDD2E44)
            .setTimestamp()
            .setTitle("🔒 LOCKDOWN NOTICE 🔒")
            .setDescription(`This channel has been lockdown by ${message.author.tag} for ${time}`);

        const Unlockembed = new Discord.RichEmbed()
            .setColor(0xDD2E44)
            .setTimestamp()
            .setTitle("🔓 LOCKDOWN NOTICE 🔓")
            .setDescription("This channel is now unlocked.");

        if (message.channel.permissionsFor(message.author.id).has("MUTE_MEMBERS") === false) {
            const embed = new Discord.RichEmbed()
                .setColor(0xDD2E44)
                .setTimestamp()
                .setTitle("❌ ERROR: MISSING PERMISSIONS! ❌")
                .setDescription("You do not have the correct permissions for this command!");
            return message.channel.send({ embed });
        }

        if (validUnlocks.includes(time)) {
            message.channel.overwritePermissions(message.guild.id, { SEND_MESSAGES: null }).then(() => {
                message.channel.send({ embed: Unlockembed });
                clearTimeout(client.lockit[message.channel.id]);
                delete client.lockit[message.channel.id];
            }).catch(error => { console.log(error); });
        } else {
            message.channel.overwritePermissions(message.guild.id, { SEND_MESSAGES: false }).then(() => {
                message.channel.send({ embed: Lockembed }).then(() => {
                    client.lockit[message.channel.id] = setTimeout(() => {
                        message.channel.overwritePermissions(message.guild.id, {
                            SEND_MESSAGES: null
                        }).then(message.channel.send({ embed: Unlockembed })).catch(console.error);
                        delete client.lockit[message.channel.id];
                    }, ms(time));
                }).catch(error => { console.log(error); });
            });
        }
    }

    if (command === "ping") {
        const msg = await message.channel.send("Pinging...");
        await msg.edit(`Pong! (Took: ${msg.createdTimestamp - message.createdTimestamp}ms.)`);
    }

    if (command === "shutdown" && botConfigs.plugins[10].activated == true) {
        if (!message.member.hasPermission("ADMINISTRATOR")) return message.channel.send("You don't have permission!");
        await message.channel.send(`Good night, ${message.author.tag}!`);
        await message.delete().catch();
        await process.exit().catch((e) => { console.error(e); });
    }

    botConfigs.commands.forEach(element => {
        element.command = element.command.toLowerCase();
        if (command === element.command) {
            if (element.embed) {
                if (element.embedFields.length == 1) {
                    let embed = new Discord.RichEmbed()
                        .setColor("RANDOM")
                        .addField(element.embedFields[0].title, element.embedFields[0].text);

                    message.channel.send({ embed });
                } else if (element.embedFields.length == 2) {
                    let embed = new Discord.RichEmbed()
                        .setColor("RANDOM")
                        .addField(element.embedFields[0].title, element.embedFields[0].text)
                        .addField(element.embedFields[1].title, element.embedFields[1].text);

                    message.channel.send({ embed });
                } else if (element.embedFields.length == 3) {
                    let embed = new Discord.RichEmbed()
                        .setColor("RANDOM")
                        .addField(element.embedFields[0].title, element.embedFields[0].text)
                        .addField(element.embedFields[1].title, element.embedFields[1].text)
                        .addField(element.embedFields[2].title, element.embedFields[2].text);

                    message.channel.send({ embed });
                } else if (element.embedFields.length == 4) {
                    let embed = new Discord.RichEmbed()
                        .setColor("RANDOM")
                        .addField(element.embedFields[0].title, element.embedFields[0].text)
                        .addField(element.embedFields[1].title, element.embedFields[1].text)
                        .addField(element.embedFields[2].title, element.embedFields[2].text)
                        .addField(element.embedFields[3].title, element.embedFields[3].text);

                    message.channel.send({ embed });
                } else if (element.embedFields.length == 5) {
                    let embed = new Discord.RichEmbed()
                        .setColor("RANDOM")
                        .addField(element.embedFields[0].title, element.embedFields[0].text)
                        .addField(element.embedFields[1].title, element.embedFields[1].text)
                        .addField(element.embedFields[2].title, element.embedFields[2].text)
                        .addField(element.embedFields[3].title, element.embedFields[3].text)
                        .addField(element.embedFields[4].title, element.embedFields[4].text);

                    message.channel.send({ embed });
                } else {
                    message.channel.send("Error, contact an administrator.");
                }
            } else {
                message.channel.send(element.message);
            }
        }
    });

    if (command === "commands") {
        let allCommands = "";
        botConfigs.commands.forEach(element => {
            if (allCommands.length < 1 || allCommands == "") {
                allCommands = prefix + element.command;
            } else {
                allCommands = allCommands + ", " + prefix + element.command;
            }
        });
        message.channel.send("Commands: " + allCommands);
    }

  if (command === "leave" && botConfigs.plugins[8].activated == true || command === "stop" && botConfigs.plugins[8].activated == true) {
    if (!message.member.voiceChannel) return message.channel.send('Please connect to a voice channel.');
    if (!message.guild.me.voiceChannel) return message.channel.send('Sorry, the bot isn\'t connected to the guild');
    if (message.guild.me.voiceChannelID !== message.member.voiceChannelID) return message.channel.send('Sorry, you aren\'t connected to the same channel');
    message.guild.me.voiceChannel.leave();
    message.channel.send('Leaving Channel....');
  }

  if (command === "pause" && botConfigs.plugins[8].activated == true) {
    let fetched = ops.active.get(message.guild.id);

    if (!fetched) return message.channel.send('There currently isn\'t any music playing in this guild!');

    if (message.member.voiceChannel !== message.guild.me.voiceChannel) return message.channel.send('Sorry, you aren\'t in the same channel as the music bot!');

    if (fetched.dispatcher.paused) return message.channel.send('This music is already paused.');

    fetched.dispatcher.pause();

    message.channel.send(`Successfully paused ${fetched.queue[0].songTitle}`);
  }

  if (command === "play" && botConfigs.plugins[8].activated == true) {
    if (!message.member.voiceChannel) return message.channel.send('Please connect to a voice channel.');
    if (!args[0]) return message.channel.send('Sorry, please input a url following the command');

    let validate = await ytdl.validateURL(args[0]);

    if (!validate) {
      let ops = {
        active: active
      }
      return searchYT(client, message, args, ops);
    }

    let info = await ytdl.getInfo(args[0]);
    let data = ops.active.get(message.guild.id) || {};

    if (!data.connection) data.connection = await message.member.voiceChannel.join();
    if (!data.queue) data.queue = [];

    data.guildID = message.guild.id;
    data.queue.push({
      songTitle: info.title,
      requester: message.author.tag,
      url: args[0],
      announceChannel: message.channel.id
    });

    if (!data.dispatcher) play(client, ops, data);
    else {
      message.channel.send(`Added To Queue: ${info.title} | Requested By: ${message.author.tag}`);
    }

    ops.active.set(message.guild.id, data);
  }

  if (command === "queue" && botConfigs.plugins[8].activated == true) {
    let fetched = ops.active.get(message.guild.id);

    if (!fetched) return message.channel.send('There currently isn\'t any music playing in this guild!');

    let queue = fetched.queue;
    let nowPlaying = queue[0];
    let resp = `__**Now Playing**__\n**${nowPlaying.songTitle}** -- **Requested By:** *${nowPlaying.requester}*\n\n__**Queue**__\n`;

    for (var i = 1; i < queue.length; i++) {
      resp += `${i}. **${queue[i].songTitle}** -- **Requested By:** *${queue[i].requester}*\n`;
    }
    message.channel.send(resp);
  }

  if (command === "resume" && botConfigs.plugins[8].activated == true) {
    let fetched = ops.active.get(message.guild.id);

    if (!fetched) return message.channel.send('There currently isn\'t any music playing in this guild!');
    if (message.member.voiceChannel !== message.guild.me.voiceChannel) return message.channel.send('Sorry, you aren\'t in the same channel as the music bot!');
    if (!fetched.dispatcher.paused) return message.channel.send('This music isn\'t paused.');

    fetched.dispatcher.resume();
    message.channel.send(`Successfully resumed ${fetched.queue[0].songTitle}`);
  }

  if (command === "skip" && botConfigs.plugins[8].activated == true) {
    let fetched = ops.active.get(message.guild.id)

    if (!fetched) return message.channel.send('There currently isn\'t any music playing in the guild!');
    if (message.member.voiceChannel !== message.guild.me.voiceChannel) return message.channel.send('Sorry, you currently aren\'t in the same channel as the bot');

    let userCount = message.member.voiceChannel.members.size;
    let required = Math.ceil(userCount / 2);

    if (!fetched.queue[0].voteSkips) fetched.queue[0].voteSkips = [];
    if (fetched.queue[0].voteSkips.includes(message.member.id)) return message.channel.send(`Sorry, you already voted to skip! ${fetched.queue[0].voteSkips.length}/${required} required.`);

    fetched.queue[0].voteSkips.push(message.member.id);
    ops.active.set(message.guild.id, fetched);

    if (fetched.queue[0].voteSkips.length >= required) {
      message.channel.send('Successfully skipped song!');
      return fetched.dispatcher.end();
    }
    message.channel.send(`Succesfully voted to skip ${fetched.queue[0].voteSkips.length}/${required} required`);
  }
});

client.login(botConfigs.token);
console.log("Bot started!");


async function play(client, ops, data) {

  client.channels.get(data.queue[0].announceChannel).send(`Now Playing: ${data.queue[0].songTitle} | Requested By: ${data.queue[0].requester}`);

  data.dispatcher = await data.connection.playStream(ytdl(data.queue[0].url, { filter: 'audioonly' }));
  data.dispatcher.guildID = data.guildID;

  data.dispatcher.once('end', function () {
    finish(client, ops, this);
  })


}

function finish(client, ops, dispatcher) {
  let fetched = ops.active.get(dispatcher.guildID);

  fetched.queue.shift();

  if (fetched.queue.length > 0) {

    ops.active.set(dispatcher.guildID, fetched);

    play(client, ops, fetched);

  }
  else {
    ops.active.delete(dispatcher.guildID);

    let vc = client.guilds.get(dispatcher.guildID).me.voiceChannel;
    if (vc) vc.leave();

  }
}

async function searchYT(client, message, args, ops) {
  search(args.join(' '), function (err, res) {
    if (err) return message.channel.send('Sorry, something went wrong.');

    let videos = res.videos.slice(0, 10);

    let resp = '';
    for (var i in videos) {
      resp += `\n**[${parseInt(i) + 1}]:** \`${videos[i].title}\`\n`;
    }

    resp += `\n Choose a number between \`1-${videos.length}\``;

    message.channel.send(resp);

    const filter = m => !isNaN(m.content) && m.content < videos.length + 1 && m.content > 0;

    const collector = message.channel.createMessageCollector(filter);

    collector.videos = videos;

    collector.once('collect', function (m) {
      playYT(client, message, [this.videos[parseInt(m.content) - 1].url], ops);
    })

  })
}

async function playYT(client, message, args, ops) {
  if (!message.member.voiceChannel) return message.channel.send('Please connect to a voice channel.');

  // if (message.guild.me.voiceChannel) return message.channel.send('Sorry, the bot is already connected to the guild.');

  if (!args[0]) return message.channel.send('Sorry, please input a url following the command');

  let validate = await ytdl.validateURL(args[0]);

  if (!validate) {
    let ops = {
      active: active
    }

    //let commandFile = require(`./search.js`);
    return searchYT(client, message, args, ops);

  }

  let info = await ytdl.getInfo(args[0]);

  let data = ops.active.get(message.guild.id) || {};

  if (!data.connection) data.connection = await message.member.voiceChannel.join();
  if (!data.queue) data.queue = [];
  data.guildID = message.guild.id;

  data.queue.push({
    songTitle: info.title,
    requester: message.author.tag,
    url: args[0],
    announceChannel: message.channel.id
  });

  if (!data.dispatcher) play(client, ops, data);
  else {

    message.channel.send(`Added To Queue: ${info.title} | Requested By: ${message.author.tag}`);
  }

  ops.active.set(message.guild.id, data);
}