// commands/create.js
const {
  SlashCommandBuilder,
  PermissionsBitField,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  FileUploadBuilder,
  PermissionFlagsBits,
  MessageFlags,
  DiscordAPIError,
  TextDisplayBuilder,
  ContainerBuilder,
  LabelBuilder,
} = require('discord.js');
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
  return new ContainerBuilder().addTextDisplayComponents(text);
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('create')
    .setDescription('Initiate a brand new giveaway event.'),

  /**
   * @param {import('discord.js').Client} client
   * @param {import('discord.js').CommandInteraction} interaction
   */
  run: async (client, interaction) => {
    if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
      const ctr = buildErrorContainer(
        `🚫 You require the **Manage Messages** permission to perform this action.`
      );
      return safeReply(interaction, {
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        components: [ctr],
      });
    }

    const bot = interaction.guild.members.me;
    const required = [
      PermissionsBitField.Flags.SendMessages,
      PermissionsBitField.Flags.EmbedLinks,
      PermissionsBitField.Flags.ViewChannel,
    ];
    const missing = required.filter((perm) => !bot.permissions.has(perm));
    if (missing.length) {
      const names = missing.map((p) =>
        Object.keys(PermissionsBitField.Flags)
          .find((k) => PermissionsBitField.Flags[k] === p)
          .replace(/([A-Z])/g, ' $1')
          .trim()
      );
      const ctr = buildErrorContainer(
        `🚫 I am missing the following essential permissions: ${names.join(', ')}.`
      );
      return safeReply(interaction, {
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        components: [ctr],
      });
    }

    const chPerm = interaction.channel.permissionsFor(bot);
    if (
      !chPerm?.has([
        PermissionsBitField.Flags.ViewChannel,
        PermissionsBitField.Flags.SendMessages,
      ])
    ) {
      const ctr = buildErrorContainer(`🚫 I cannot view or send messages in this channel.`);
      return safeReply(interaction, {
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        components: [ctr],
      });
    }

    const dir = path.join(__dirname, '../../../data', interaction.guild.id, 'giveaways');
    let files = [];
    try {
      files = await fs.readdir(dir);
    } catch {}
    if (files.length >= 20) {
      const ctr = buildErrorContainer(`🚫 The maximum limit of 20 active giveaways has been reached.`);
      return safeReply(interaction, {
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        components: [ctr],
      });
    }

    const modal = new ModalBuilder()
      .setCustomId('giveawayCreate')
      .setTitle('Giveaway Setup');

    // Duration label + text input
    const durationLabel = new LabelBuilder()
      .setLabel('How long should the giveaway last?')
      .setTextInputComponent(
        new TextInputBuilder()
          .setCustomId('duration')
          .setStyle(TextInputStyle.Short)
          .setPlaceholder('Example: 30m, 2h, 1d')
          .setMinLength(2)
          .setMaxLength(10)
          .setRequired(true)
      );

    // Prize label + text input
    const prizeLabel = new LabelBuilder()
      .setLabel('What is the prize for the winner(s)?')
      .setTextInputComponent(
        new TextInputBuilder()
          .setCustomId('prize')
          .setStyle(TextInputStyle.Paragraph)
          .setPlaceholder('Example: Nitro, Steam Gift Card, Custom Role')
          .setMinLength(2)
          .setMaxLength(100)
          .setRequired(true)
      );

    // Winners label + text input
    const winnersLabel = new LabelBuilder()
      .setLabel('Number of winners')
      .setTextInputComponent(
        new TextInputBuilder()
          .setCustomId('winners')
          .setStyle(TextInputStyle.Short)
          .setPlaceholder('Enter a number between 1 and 20')
          .setMinLength(1)
          .setMaxLength(2)
          .setRequired(true)
          .setValue('1')
      );

    // Optional image upload (1 image max: png, jpg, jpeg, webp)
    const fileUpload = new FileUploadBuilder()
      .setCustomId('giveaway_image')
      .setRequired(false)
      .setMinValues(0)
      .setMaxValues(1);

    const fileLabel = new LabelBuilder({
      label: 'Image (optional)',
      description: 'Attach one image (png, jpg, jpeg, webp)',
      component: fileUpload,
    });

    modal.addLabelComponents(durationLabel, prizeLabel, winnersLabel, fileLabel);

    try {
      await interaction.showModal(modal);
    } catch (e) {
      const ctr = buildErrorContainer(
        `🚫 Unable to display the modal due to insufficient access.`
      );
      return safeReply(interaction, {
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        components: [ctr],
      });
    }
  },
};
