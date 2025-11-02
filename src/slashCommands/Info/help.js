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
    .setName('help')
    .setDescription('Displays a list of available commands.'),

  /**
   * @param {import('discord.js').Client} client
   * @param {import('discord.js').CommandInteraction} interaction
   */
  run: async (client, interaction) => {
    const commands = client.slash.map(cmd => `**/${cmd.data.name}**: ${cmd.data.description}`).join('\n');
    const ctr = buildErrorContainer(`Here are my commands:\n${commands}`);
    return safeReply(interaction, { flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral, components: [ctr] });
  },
};

/*

❤️ Make sure to SUBSCRIBE to ZarScape if this bot helps you! https://www.youtube.com/@ZarScape

*/