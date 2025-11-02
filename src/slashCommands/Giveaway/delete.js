const { SlashCommandBuilder, PermissionsBitField, MessageFlags, DiscordAPIError, TextDisplayBuilder, ContainerBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs').promises;
const path = require('path');

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
    .setName('delete')
    .setDescription('Remove a specific giveaway by its ID or clear all active giveaways.')
    .addStringOption(opt =>
      opt.setName('id').setDescription('The unique identifier for the giveaway message.').setRequired(false)
    )
    .addBooleanOption(opt =>
      opt.setName('delete-all').setDescription('Confirm if you wish to delete every single giveaway.').setRequired(false)
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
    const deleteAll = interaction.options.getBoolean('delete-all');
    const dir = path.join(__dirname, '../../../data', interaction.guild.id, 'giveaways');
    try {
      const files = await fs.readdir(dir);
      if (!files.length) {
        const ctr = buildErrorContainer(`🚫 No giveaways were discovered.`);
        return safeReply(interaction, { flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral, components: [ctr] });
      }
      if (deleteAll) {
        for (const f of files) await fs.unlink(path.join(dir, f));
        const ctr = buildErrorContainer(`✅ All giveaways have been successfully removed.`);
        return safeReply(interaction, { flags: MessageFlags.IsComponentsV2, components: [ctr] });
      }
      if (!id) {
        const ctr = buildErrorContainer(`🚫 Kindly provide a giveaway ID or enable the 'delete-all' option.`);
        return safeReply(interaction, { flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral, components: [ctr] });
      }
      let found = false;
      for (const f of files) {
        const raw = await fs.readFile(path.join(dir, f), 'utf8');
        const data = JSON.parse(raw);
        if (data.messageId === id) {
          await fs.unlink(path.join(dir, f));
          found = true;
          break;
        }
      }
      if (!found) {
        const ctr = buildErrorContainer(`🚫 The giveaway with ID ${id} could not be located.`);
        return safeReply(interaction, { flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral, components: [ctr] });
      }
      const ctr = buildErrorContainer("✅ Giveaway \"`${id}`\" has been successfully deleted.");
      return safeReply(interaction, { flags: MessageFlags.IsComponentsV2, components: [ctr] });
    } catch (err) {
      console.error(err);
      const ctr = buildErrorContainer(`🚫 An error occurred while processing your request.`);
      return safeReply(interaction, { flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral, components: [ctr] });
    }
  }
};

/*

❤️ Make sure to SUBSCRIBE to ZarScape if this bot helps you! https://www.youtube.com/@ZarScape

*/