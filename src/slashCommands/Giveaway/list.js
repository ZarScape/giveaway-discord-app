const {
  SlashCommandBuilder,

  MessageFlags,
  DiscordAPIError,
  TextDisplayBuilder,
  ContainerBuilder,
  PermissionFlagsBits,
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
    .setName('list')
    .setDescription('Display a comprehensive list of all current and past giveaways.'),

  /**
   * @param {import('discord.js').Client} client
   * @param {import('discord.js').CommandInteraction} interaction
   */
  run: async (client, interaction) => {
    // common permission check
    if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
      const ctr = buildErrorContainer(`🚫 Regrettably, you require the **Manage Messages** permission to perform this action.`);
      return safeReply(interaction, { flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral, components: [ctr] });
    }

    const all = await client.giveawayUtils.getAllGiveaways(interaction.guild.id);
    if (!all.length) {
      const ctr = buildErrorContainer(`🚫 No giveaways were discovered.`);
      return safeReply(interaction, { flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral, components: [ctr] });
    }
    const lines = all.map(g => {
      const status = g.ended ? 'Concluded' : 'Active';
      return `• **Identifier:** 
${g.messageId}
  • **Award:** ${g.prize}
  • **Concludes:** <t:${Math.floor(g.endTime / 1000)}:R>
  • **Current Status:** ${status}
`;
    });
    const text = new TextDisplayBuilder().setContent(lines.join('\n'));
    const ctr = new ContainerBuilder()
      .addTextDisplayComponents(text);
    return safeReply(interaction, { flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral, components: [ctr] });
  }
};

/*

❤️ Make sure to SUBSCRIBE to ZarScape if this bot helps you! https://www.youtube.com/@ZarScape

*/