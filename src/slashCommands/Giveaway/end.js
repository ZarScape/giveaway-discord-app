const {
  SlashCommandBuilder,
  PermissionsBitField,
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
    .setName('end')
    .setDescription('Conclude an ongoing giveaway ahead of its scheduled time.')
    .addStringOption(opt =>
      opt.setName('id').setDescription('The unique identifier for the giveaway message.').setRequired(true)
    ),

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

    const id = interaction.options.getString('id');
    const g = await client.giveawayUtils.findGiveaway(interaction.guild.id, id);
    if (!g || g.ended) {
      const ctr = buildErrorContainer(`🚫 The specified giveaway was not found or has already concluded.`);
      return safeReply(interaction, { flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral, components: [ctr] });
    }
    g.endTime = Date.now();
    await client.giveawayUtils.saveGiveaway(g);
    const ctr = buildErrorContainer(`✅ The giveaway is now concluding.`);
    return safeReply(interaction, { flags: MessageFlags.IsComponentsV2, components: [ctr] });
  }
};

/*

❤️ Make sure to SUBSCRIBE to ZarScape if this bot helps you! https://www.youtube.com/@ZarScape

*/