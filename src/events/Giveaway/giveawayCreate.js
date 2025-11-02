module.exports = {
  name: "giveawayCreate",
};

const fs = require("fs").promises;
const path = require("path");
const {
  TextInputBuilder,
  TextInputStyle,
  ModalBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionsBitField,
  MessageFlags,
  DiscordAPIError,
  TextDisplayBuilder,
  ContainerBuilder,
  SeparatorBuilder,
  FileUploadBuilder,
  MediaGalleryBuilder,
  MediaGalleryItemBuilder,
  AttachmentBuilder,
  LabelBuilder,
} = require("discord.js");

const client = require("../../index");

async function safeReply(interaction, options) {
  if (!interaction?.isRepliable?.()) return;
  try {
    const payload = options;
    if (interaction.deferred || interaction.replied) {
      await interaction.editReply(payload).catch(() => {});
    } else {
      await interaction.reply(payload).catch(() => {});
    }
  } catch (e) {
    // ignore permission errors when the bot cannot reply
    if (!(e instanceof DiscordAPIError && e.code === 50001)) {
      console.error(e);
    }
  }
}

client.on("interactionCreate", async (interaction) => {
  try {
    // ---- BUTTON CLICK → show modal ----
    if (interaction.isButton() && interaction.customId === "openGiveawayModal") {
      if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
        const errorContainer = new ContainerBuilder().addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `🚫 You need the **Manage Messages** permission to create a giveaway.`
          )
        );
        return safeReply(interaction, {
          flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
          components: [errorContainer],
        });
      }

      const botMember = interaction.guild.members.me;
      const requiredBotPerms = [
        PermissionsBitField.Flags.SendMessages,
        PermissionsBitField.Flags.EmbedLinks,
        PermissionsBitField.Flags.ViewChannel,
      ];
      const missingPerms = requiredBotPerms.filter((perm) => !botMember.permissions.has(perm));
      if (missingPerms.length > 0) {
        const missingNames = missingPerms.map((perm) => {
          const key = Object.keys(PermissionsBitField.Flags).find(
            (k) => PermissionsBitField.Flags[k] === perm
          );
          return key ? key.replace(/([A-Z])/g, " $1").trim() : perm;
        });
        const errorContainer = new ContainerBuilder().addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `🚫 Missing required permissions: ${missingNames.join(", ")}.`
          )
        );
        return safeReply(interaction, {
          flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
          components: [errorContainer],
        });
      }

      const giveawaysDir = path.join(__dirname, "../../../data", interaction.guild.id, "giveaways");
      let existingFiles = [];
      try {
        existingFiles = await fs.readdir(giveawaysDir);
      } catch (_) {}
      if (existingFiles.length >= 20) {
        const errorContainer = new ContainerBuilder().addTextDisplayComponents(
          new TextDisplayBuilder().setContent(`🚫 Maximum of 20 active giveaways reached.`)
        );
        return safeReply(interaction, {
          flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
          components: [errorContainer],
        });
      }

      const modal = new ModalBuilder()
        .setCustomId("giveawayCreate")
        .setTitle("Giveaway Setup")
        .setLabelComponents(
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId("duration")
              .setLabelComponents(new LabelBuilder().setLabel("How long should the giveaway last?"))
              .setStyle(TextInputStyle.Short)
              .setPlaceholder("Example: 30m, 2h, 1d")
              .setMinLength(2)
              .setMaxLength(10)
              .setRequired(true)
          ),
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId("prize")
              .setLabelComponents(new LabelBuilder().setLabel("What is the prize for the winner(s)?"))
              .setStyle(TextInputStyle.Paragraph)
              .setPlaceholder("Example: Nitro, Steam Gift Card, Custom Role")
              .setMinLength(2)
              .setMaxLength(100)
              .setRequired(true)
      ),
      new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId("winners")
              .setLabelComponents(new LabelBuilder().setLabel("Number of winners"))
              .setStyle(TextInputStyle.Short)
              .setPlaceholder("Enter a number between 1 and 20")
              .setMinLength(1)
              .setMaxLength(2)
              .setRequired(true)
              .setValue("1")
          )
        );

      // Add optional image upload (1 image max)
      const fileUpload = new FileUploadBuilder()
        .setCustomId('giveaway_image')
        .setRequired(false)
        .setMinValues(0)
        .setMaxValues(1);

      const fileLabel = new LabelBuilder({
        label: 'Image (optional)',
        description: 'Attach one image (png, jpg, jpeg, webp)',
      });

      // add the file label component to the modal
      modal.addLabelComponents(fileLabel);

      try {
        await interaction.showModal(modal);
      } catch (error) {
        console.error("Error showing modal:", error);
        const errorContainer = new ContainerBuilder().addTextDisplayComponents(
          new TextDisplayBuilder().setContent(`🚫 Unable to show the modal.`)
        );
        return safeReply(interaction, {
          flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
          components: [errorContainer],
        });
      }
      return;
    }

    if (!interaction.isModalSubmit() || interaction.customId !== "giveawayCreate") return;

    try {
      if (!interaction.deferred && !interaction.replied && interaction.isRepliable?.()) {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral }).catch(() => {});
      }
    } catch (e) {
    }

    const duration = interaction.fields.getTextInputValue("duration");
    const prize = interaction.fields.getTextInputValue("prize");
    const winnersNum = parseInt(interaction.fields.getTextInputValue("winners"), 10);

  let filesToSend = null;
  let firstAttachmentURL = null;
    try {
      if (typeof interaction.fields.getUploadedFiles === 'function') {
        const uploadedFiles = interaction.fields.getUploadedFiles('giveaway_image');
        if (uploadedFiles?.size) {
          
          const allowed = ['png', 'jpg', 'jpeg', 'webp'];
          for (const f of uploadedFiles.values()) {
            const name = f.name || f.filename || (f.attachment && f.attachment.name) || '';
            const ext = name.split('.').pop().toLowerCase();
            const isImage = allowed.includes(ext) || (f.contentType && f.contentType.startsWith('image'));
            if (!isImage) {
              const errorContainer = new ContainerBuilder().addTextDisplayComponents(
                new TextDisplayBuilder().setContent(`🚫 Invalid file type. Only image files are allowed (png, jpg, jpeg, webp).`)
              );
              return safeReply(interaction, {
                flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
                components: [errorContainer],
              });
            }
          }

          const attachments = [];
          for (const f of uploadedFiles.values()) {
            const name = f.name || f.filename || 'file';
            const url = f.attachment || f.url || null;
            if (url) {
              try {
                const res = await fetch(url);
                const arrayBuffer = await res.arrayBuffer();
                const buffer = Buffer.from(arrayBuffer);
                attachments.push(new AttachmentBuilder(buffer, { name }));
              } catch (fetchErr) {
                console.error('giveawayCreate: failed to fetch uploaded file', fetchErr);
              }
            }
          }
          filesToSend = attachments;
          const firstFile = uploadedFiles.first();
          if (firstFile) firstAttachmentURL = firstFile.attachment ?? null;
          
        }
      }
    } catch (e) {
      console.error('Error processing uploaded files:', e);
    }

    const timeUnits = { m: 60000, h: 3600000, d: 86400000 };
    const unit = duration.slice(-1);
    const amt = parseInt(duration.slice(0, -1), 10);
    if (!timeUnits[unit] || isNaN(amt) || amt <= 0) {
      const errorContainer = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`🚫 Invalid duration. Use 1m, 1h, or 1d.`)
      );
      return safeReply(interaction, {
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        components: [errorContainer],
      });
    }
    if (isNaN(winnersNum) || winnersNum < 1 || winnersNum > 20) {
      const errorContainer = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`🚫 Winners must be between 1 and 20.`)
      );
      return safeReply(interaction, {
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        components: [errorContainer],
      });
    }

    const endTime = Date.now() + timeUnits[unit] * amt;
    const data = {
      messageId: null,
      channelId: interaction.channel.id,
      guildId: interaction.guild.id,
      hosterId: interaction.user.id,
      prize,
      winners: winnersNum,
      participants: [],
      endTime,
      ended: false,
      createdAt: Date.now(),
      paused: false,
      pauseTime: null,
    };

    const header = new TextDisplayBuilder().setContent(`# 🎉 ${prize} 🎉`);
    const separatorAfterPrize = new SeparatorBuilder();
    const infoText = new TextDisplayBuilder().setContent(
      `**Organized by:** <@${interaction.user.id}>\n` +
      `**Concludes:** <t:${Math.floor(endTime / 1000)}:R>\n` +
      `**Victors:** ${winnersNum}\n` +
      `**Entrants:** 0`
    );

    const container = new ContainerBuilder()
      .addTextDisplayComponents(header)
      .addSeparatorComponents(separatorAfterPrize)
      .addTextDisplayComponents(infoText);

    // Add join button only
    const joinButton = new ButtonBuilder()
      .setCustomId("participate")
      .setLabel("Participate in Giveaway")
      .setStyle(ButtonStyle.Secondary);

    const buttonRow = new ActionRowBuilder().addComponents(joinButton);
    container.addSeparatorComponents(new SeparatorBuilder()).addActionRowComponents(buttonRow);

    let msg;
    try {
      let containerToSend = container;
      if (firstAttachmentURL) {
        const media = new MediaGalleryBuilder().addItems(
          new MediaGalleryItemBuilder().setURL(firstAttachmentURL)
        );
        containerToSend = new ContainerBuilder()
          .addTextDisplayComponents(header)
          .addSeparatorComponents(separatorAfterPrize)
          .addTextDisplayComponents(infoText)
          .addMediaGalleryComponents(media)
          .addSeparatorComponents(new SeparatorBuilder())
          .addActionRowComponents(buttonRow);
        data.image = firstAttachmentURL;
      }

      msg = await interaction.channel.send({
        flags: MessageFlags.IsComponentsV2,
        components: [containerToSend],
        files: filesToSend || [],
      });
      data.messageId = msg.id;

      
      if (filesToSend) {
        let first = null;
        try {
          if (msg.attachments && typeof msg.attachments.first === 'function') {
            first = msg.attachments.first();
          }
        } catch {}
        if (first && first.url) {
          data.image = first.url;
          
        }
      }

      await client.giveawayUtils.saveGiveaway(data);

      if (data.image) {
        const media = new MediaGalleryBuilder().addItems(
          new MediaGalleryItemBuilder().setURL(data.image)
        );
        const containerWithMedia = new ContainerBuilder()
          .addTextDisplayComponents(header)
          .addSeparatorComponents(separatorAfterPrize)
          .addTextDisplayComponents(infoText)
          .addMediaGalleryComponents(media)
          .addSeparatorComponents(new SeparatorBuilder())
          .addActionRowComponents(buttonRow);

        await msg.edit({
          flags: MessageFlags.IsComponentsV2,
          components: [containerWithMedia],
        }).catch(() => {});
      }
    } catch (sendError) {
      console.error("Error sending giveaway container:", sendError);
      const errorContainer = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`🚫 Failed to send giveaway message.`)
      );
      try {
        await interaction.followUp({
          flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
          components: [errorContainer],
        });
      } catch (e) {
        await safeReply(interaction, {
          flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
          components: [errorContainer],
        });
      }
      return;
    }

    const successContainer = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`Giveaway successfully created.`)
    );
    try {
      await interaction.followUp({
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        components: [successContainer],
      });
    } catch (e) {
      await safeReply(interaction, {
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        components: [successContainer],
      });
    }
    return;
  } catch (err) {
    console.error("Unhandled giveawayCreate error:", err);
  }
});

/*
❤️ Make sure to SUBSCRIBE to ZarScape if this bot helps you! https://www.youtube.com/@ZarScape
*/
