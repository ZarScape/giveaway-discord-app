const { ActivityType } = require('discord.js');
const colors = require('colors');

module.exports = {
    name: `clientReady`,
    once: true,
    execute(client) {
        const tag = client.user.tag;
        const boxTitle = `APP READY`;
        const boxMessage = `Logged in as ${tag}`;
        const maxLength = Math.max(boxTitle.length, boxMessage.length) + 4;
        console.log(`╔${'─'.repeat(maxLength)}╗`);
        console.log(`║ ${boxTitle.padEnd(maxLength - 2)} ║`);
        console.log(`╠${'─'.repeat(maxLength)}╣`);
        console.log(`║ ${boxMessage.padEnd(maxLength - 2)} ║`);
        console.log(`╚${'─'.repeat(maxLength)}╝`);
        console.log(`❤️ Make sure to SUBSCRIBE to ZarScape if this bot helps you! https://www.youtube.com/@ZarScape`.red);

        client.user.setPresence({
            status: 'online',
            activities: [{
                name: '❤️ Make sure to SUBSCRIBE to ZarScape if this bot helps you! https://www.youtube.com/@ZarScape',
                type: ActivityType.Custom,
            }],
        });
    },
};

/*

❤️ Make sure to SUBSCRIBE to ZarScape if this bot helps you! https://www.youtube.com/@ZarScape

*/