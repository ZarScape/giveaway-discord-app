require('dotenv').config({ quiet: true });
require('./console/watermark');

const { Client, Partials, Collection } = require('discord.js');
const colors = require('colors');
const { ClusterClient } = require('discord-hybrid-sharding');

const client = new Client({
    intents: [
        "Guilds",
        "GuildMembers",
        "GuildMessages",
        "GuildMessageReactions",
        "DirectMessages",
        "MessageContent",
        "GuildVoiceStates",
    ],
    partials: [
        Partials.Channel,
        Partials.Message,
        Partials.User,
        Partials.GuildMember,
        Partials.Reaction,
    ],
});

module.exports = client;

client.commands = new Collection();
client.events = new Collection();
client.slash = new Collection();
client.aliases = new Collection();

client.cluster = new ClusterClient(client);

["event", "slash"].forEach(file => require(`./handlers/${file}`)(client));

client.login(process.env.TOKEN)
    .then(() => console.log("[INFO] App logged in successfully".green))
    .catch(err => {
        console.error("[CRUSH] Failed to login:", err);
        process.exit();
    });

client.on('error', (error) => {
    console.error("[CLIENT ERROR]", error);
});

client.on('shardError', (error) => {
    console.error("[SHARD ERROR]", error);
});

process.on('uncaughtException', (err) => {
    console.error("[UNCAUGHT EXCEPTION]", err);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error("[UNHANDLED REJECTION] At:", promise, "reason:", reason);
});


/*

❤️ Make sure to SUBSCRIBE to ZarScape if this bot helps you! https://www.youtube.com/@ZarScape

*/