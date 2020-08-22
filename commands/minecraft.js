const ping = require('minecraft-server-util');
const minecraft = require('minecraft-api');
const fetch = require('node-fetch');
const Discord = require('discord.js');

exports.handleCommand = function (args, msg, PREFIX) {
    if (args.length < 1) return msg.reply(`Correct usage: \n\`${PREFIX}minecraft user? [user-name]\` check profile\n\`${PREFIX}minecraft server [ip]\` check server status`)
    switch (args[0]) {
        case 'server':
            args.shift();
            ping(args.join(' ')).then((response) => {
                msg.channel.send(generateServerEmbed(response, msg));
            }).catch((error) => {
                msg.reply("Is the server dead?");
            });
            break;
        case 'user':
            args.shift();
        default:
            minecraft.uuidForName(args.join(' '))
                .then(uuid => fetch("https://api.minetools.eu/profile/" + uuid))
                .then(res => res.json())
                .then(profile => {
                    let embed = new Discord.RichEmbed();
                    embed.setColor(hashStringToColor(profile.decoded.profileId));
                    embed.setAuthor("User Info");
                    embed.setThumbnail(`https://minotar.net/helm/${profile.decoded.profileName}/256.png`);
                    embed.addField("Name", profile.decoded.profileName);
                    embed.addField("UUID", '`' + profile.decoded.profileId + '`');
                    msg.channel.send(embed);
                });
    }
}

function generateServerEmbed(server, msg) {
    let embed = new Discord.RichEmbed();
    embed.setTitle("Server Info");
    embed.addField("Version", server.version, true);
    embed.addField("Protocol", server.protocolVersion, true);
    embed.addField("Players", `**${server.onlinePlayers} / ${server.maxPlayers}**${server.samplePlayers && server.samplePlayers.length > 0 ? `\n\`\`\`\n${server.samplePlayers.map(player => player.name).join("\n")}\n\`\`\`` : ''}`);
    embed.setDescription('```\n' + server.descriptionText.replace(/Â§./g, '') + '\n```');
    embed.setColor(hashStringToColor(server.host));
    embed.setFooter("Query by " + msg.author.tag, msg.author.avatarURL);
    if (server.favicon) {
        let attachment = new Discord.Attachment(Buffer.from(server.favicon, 'base64'), "image.png");
        embed.setAuthor(server.host + (server.port === 25565 ? "" : ":" + server.port), "attachment://image.png")
        return {
            embed: embed,
            files: [attachment]
        };
    } else {
        embed.setAuthor(server.host + (server.port === 25565 ? "" : ":" + server.port), "https://res.cloudinary.com/chatboxzy/image/upload/v1598103075/unknown_server.png")
        return embed;
    }
}

function djb2(str) {
    let hash = 5381;
    for (let i = 0; i < str.length; i++) hash = ((hash << 5) + hash) + str.charCodeAt(i);
    return hash;
}

function hashStringToColor(str) {
    const hash = djb2(str);
    return hash & 0xFFFFFF;
}