const {
  SlashCommandBuilder,
  MessageFlags,
  DiscordAPIError,
  TextDisplayBuilder,
  ContainerBuilder,
} = require('discord.js');

async function safeReply(interaction, options) {
  try {
    await interaction.reply(options);
  } catch (e) {
    if (!(e instanceof DiscordAPIError && e.code === 50001)) {
      console.error(e);
    }
  }
}

function buildErrorContainer(message) {
  const text = new TextDisplayBuilder().setContent(message);
  return new ContainerBuilder()
    .addTextDisplayComponents(text);
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('uptime')
    .setDescription('Displays how long the bot has been running.'),

  /**
   * @param {import('discord.js').Client} client
   * @param {import('discord.js').CommandInteraction} interaction
   */
  run: async (client, interaction) => {
    let totalSeconds = client.uptime / 1000;
    let days = Math.floor(totalSeconds / 86400);
    totalSeconds %= 86400;
    let hours = Math.floor(totalSeconds / 3600);
    totalSeconds %= 3600;
    let minutes = Math.floor(totalSeconds / 60);
    let seconds = Math.floor(totalSeconds % 60);

    let uptime = `${days} days, ${hours} hours, ${minutes} minutes and ${seconds} seconds`;

    const ctr = buildErrorContainer(`I have been online for: ${uptime}`);
    return safeReply(interaction, { flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral, components: [ctr] });
  },
};

/*

❤️ Make sure to SUBSCRIBE to ZarScape if this bot helps you! https://www.youtube.com/@ZarScape

*/