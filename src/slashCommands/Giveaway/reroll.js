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
    .setName('reroll')
    .setDescription('Select new winners for a previously ended giveaway.')
    .addStringOption(opt =>
      opt.setName('id').setDescription('The unique identifier for the giveaway message.').setRequired(true)
    )
    .addIntegerOption(opt =>
      opt.setName('winners').setDescription('Specify the desired number of new winners.').setRequired(false)
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
    const winnersCount = interaction.options.getInteger('winners');
    const g = await client.giveawayUtils.findGiveaway(interaction.guild.id, id);
    if (!g || !g.ended) {
      const ctr = buildErrorContainer(`🚫 The specified giveaway was not found or has not yet concluded.`);
      return safeReply(interaction, { flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral, components: [ctr] });
    }
    if (!g.participants.length) {
      const ctr = buildErrorContainer(`⚠️ There are no eligible participants for a reroll.`);
      return safeReply(interaction, { flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral, components: [ctr] });
    }
    const num = winnersCount || g.winners;
    if (num <= 0) {
      const ctr = buildErrorContainer(`🚫 The number of winners must be a positive value.`);
      return safeReply(interaction, { flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral, components: [ctr] });
    }
    const shuffled = g.participants.slice().sort(() => Math.random() - 0.5);
    const win = shuffled.slice(0, num);
    g.winnerIds = win;
    await client.giveawayUtils.saveGiveaway(g);
    const ch = await client.channels.fetch(g.channelId).catch(() => null);
    if (ch?.isTextBased()) {
      await ch.send(`🎉 Fresh winner(s) selected: ${win.map(id => `<@${id}>`).join(', ')} for the esteemed **${g.prize}**!`);
    }
    const ctr = buildErrorContainer(`✅ Winners have been successfully rerolled: ${win.map(id => `<@${id}>`).join(', ')}`);
    return safeReply(interaction, { flags: MessageFlags.IsComponentsV2, components: [ctr] });
  }
};

/*

❤️ Make sure to SUBSCRIBE to ZarScape if this bot helps you! https://www.youtube.com/@ZarScape

*/