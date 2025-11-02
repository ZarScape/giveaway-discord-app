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
    .setName('userinfo')
    .setDescription('Displays detailed information about a user.')
    .addUserOption(option =>
      option.setName('target')
        .setDescription('The user to get info about')
        .setRequired(false)
    ),

  /**
   * @param {import('discord.js').Client} client
   * @param {import('discord.js').CommandInteraction} interaction
   */
  run: async (client, interaction) => {
    const user = interaction.options.getUser('target') || interaction.user;
    const member = interaction.guild.members.cache.get(user.id);

    const info = [
      `**Username:** ${user.username}`,
      `**Discriminator:** ${user.discriminator}`,
      `**ID:** ${user.id}`,
      `**Bot:** ${user.bot ? 'Yes' : 'No'}`,
      `**Created At:** <t:${Math.floor(user.createdTimestamp / 1000)}:F>`,
      member ? `**Joined Server At:** <t:${Math.floor(member.joinedTimestamp / 1000)}:F>` : '',
      member && member.roles.cache.size > 1 ? `**Roles:** ${member.roles.cache.filter(role => role.id !== interaction.guild.id).map(role => role.toString()).join(', ')}` : '',
    ].filter(Boolean).join('\n');

    const ctr = buildErrorContainer(info);
    return safeReply(interaction, { flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral, components: [ctr] });
  },
};


/*

❤️ Make sure to SUBSCRIBE to ZarScape if this bot helps you! https://www.youtube.com/@ZarScape

*/