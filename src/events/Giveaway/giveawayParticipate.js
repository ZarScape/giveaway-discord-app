// events/giveawayParticipate.js

const fs = require("fs").promises;
const path = require("path");
const {
  ButtonBuilder,
  ActionRowBuilder,
  ButtonStyle,
  MessageFlags,
  TextDisplayBuilder,
  ContainerBuilder,
  SeparatorBuilder,
  MediaGalleryBuilder,
  MediaGalleryItemBuilder,
  DiscordAPIError,
} = require("discord.js");

const client = require("../../index");
const COOLDOWN_TIME = 10000;

module.exports = {
  name: "giveawayParticipate",
};

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isButton()) return;
  try {
    const customId = interaction.customId;

    // --- JOIN GIVEAWAY ---
    if (customId === "participate") {
      client.cooldowns ||= new Map();
      const last = client.cooldowns.get(interaction.user.id) || 0;

      if (Date.now() - last < COOLDOWN_TIME) {
        const cooldownContainer = new ContainerBuilder().addTextDisplayComponents(
          new TextDisplayBuilder().setContent(`⏳ Please wait a few seconds before trying again.`)
        );
        return interaction.reply({
          flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
          components: [cooldownContainer],
        });
      }

      const giveaway = await findActiveGiveaway(interaction.message.id, interaction.guild.id);
      if (!giveaway) {
        const notFoundContainer = new ContainerBuilder().addTextDisplayComponents(
          new TextDisplayBuilder().setContent(`🚫 This giveaway could not be found.`)
        );
        return interaction.reply({
          flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
          components: [notFoundContainer],
        });
      }

      const participants = giveaway.data.participants;
      const alreadyJoined = participants.includes(interaction.user.id);

      // Already joined → show leave option
      if (alreadyJoined) {
        const leaveBtn = new ButtonBuilder()
          .setCustomId(`leave:${interaction.message.id}`)
          .setLabel("Withdraw from Giveaway")
          .setStyle(ButtonStyle.Danger);

        const row = new ActionRowBuilder().addComponents(leaveBtn);

        const alreadyContainer = new ContainerBuilder()
          .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(`✅ You are already participating in this giveaway.`)
          )
          .addSeparatorComponents(new SeparatorBuilder())
          .addActionRowComponents(row);

        return interaction.reply({
          flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
          components: [alreadyContainer],
        });
      }

      // Add participant
      participants.push(interaction.user.id);
      client.cooldowns.set(interaction.user.id, Date.now());
      await saveGiveaway(giveaway);

      const g = giveaway.data;
      const header = new TextDisplayBuilder().setContent(`# 🎉 ${g.prize} 🎉`);
      const separator = new SeparatorBuilder();

      const infoText = new TextDisplayBuilder().setContent(
        `**Organized by:** <@${g.hosterId}>\n` +
        `**Concludes:** <t:${Math.floor(g.endTime / 1000)}:R>\n` +
        `**Victors:** ${g.winners}\n` +
        `**Entrants:** ${g.participants.length}`
      );

      const updatedContainer = new ContainerBuilder()
        .addTextDisplayComponents(header)
        .addSeparatorComponents(separator)
        .addTextDisplayComponents(infoText);

      if (g.image) {
        const media = new MediaGalleryBuilder().addItems(
          new MediaGalleryItemBuilder().setURL(g.image)
        );
        updatedContainer.addMediaGalleryComponents(media);
      }

      const joinBtn = new ButtonBuilder()
        .setCustomId("participate")
        .setLabel("Participate in Giveaway")
        .setStyle(ButtonStyle.Secondary);

      updatedContainer
        .addSeparatorComponents(new SeparatorBuilder())
        .addActionRowComponents(new ActionRowBuilder().addComponents(joinBtn));

      // Update giveaway message
      const msg = await interaction.message.fetch();
      await msg.edit({
        flags: MessageFlags.IsComponentsV2,
        components: [updatedContainer],
      });

      const confirmContainer = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`✅ You’ve successfully entered the giveaway!`)
      );
      return interaction.reply({
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        components: [confirmContainer],
      });
    }

    // --- LEAVE GIVEAWAY ---
    if (customId.startsWith("leave:")) {
      const [, messageId] = customId.split(":");
      const giveaway = await findActiveGiveaway(messageId, interaction.guild.id);
      if (!giveaway) {
        const disabledBtn = new ButtonBuilder()
          .setCustomId(customId)
          .setLabel("Withdraw from Giveaway")
          .setStyle(ButtonStyle.Danger)
          .setDisabled(true);
        return interaction.update({
          flags: MessageFlags.IsComponentsV2,
          components: [new ActionRowBuilder().addComponents(disabledBtn)],
        });
      }

      const idx = giveaway.data.participants.indexOf(interaction.user.id);
      if (idx === -1) {
        const disabledBtn = new ButtonBuilder()
          .setCustomId(customId)
          .setLabel("Withdraw from Giveaway")
          .setStyle(ButtonStyle.Danger)
          .setDisabled(true);
        return interaction.update({
          flags: MessageFlags.IsComponentsV2,
          components: [new ActionRowBuilder().addComponents(disabledBtn)],
        });
      }

      giveaway.data.participants.splice(idx, 1);
      await saveGiveaway(giveaway);

      const g = giveaway.data;
      const ch = await client.channels.fetch(g.channelId).catch(() => null);
      if (ch?.isTextBased()) {
        const originalMsg = await ch.messages.fetch(messageId).catch(() => null);
        if (originalMsg) {
          const header = new TextDisplayBuilder().setContent(`# 🎉 ${g.prize} 🎉`);
          const separator = new SeparatorBuilder();
          const infoText = new TextDisplayBuilder().setContent(
            `**Organized by:** <@${g.hosterId}>\n` +
            `**Concludes:** <t:${Math.floor(g.endTime / 1000)}:R>\n` +
            `**Victors:** ${g.winners}\n` +
            `**Entrants:** ${g.participants.length}`
          );

          const newContainer = new ContainerBuilder()
            .addTextDisplayComponents(header)
            .addSeparatorComponents(separator)
            .addTextDisplayComponents(infoText);

          if (g.image) {
            const media = new MediaGalleryBuilder().addItems(
              new MediaGalleryItemBuilder().setURL(g.image)
            );
            newContainer.addMediaGalleryComponents(media);
          }

          const joinBtn = new ButtonBuilder()
            .setCustomId("participate")
            .setLabel("Participate in Giveaway")
            .setStyle(ButtonStyle.Secondary);

          newContainer
            .addSeparatorComponents(new SeparatorBuilder())
            .addActionRowComponents(new ActionRowBuilder().addComponents(joinBtn));

          await originalMsg.edit({
            flags: MessageFlags.IsComponentsV2,
            components: [newContainer],
          });
        }
      }

      const confirmLeaveContainer = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`✅ You’ve successfully left the giveaway.`)
      );
      return interaction.reply({
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        components: [confirmLeaveContainer],
      });
    }
  } catch (e) {
    console.error(e);
  }
});

// --- Utility functions ---
async function findActiveGiveaway(messageId, guildId) {
  try {
    const dir = path.join(__dirname, "../../../data", guildId, "giveaways");
    for (const file of await fs.readdir(dir)) {
      const data = JSON.parse(await fs.readFile(path.join(dir, file), "utf8"));
      if (data.messageId === messageId && !data.ended && !data.paused) {
        return { data, file };
      }
    }
  } catch {
    return null;
  }
  return null;
}

async function saveGiveaway(giveaway) {
  const filePath = path.join(
    __dirname,
    "../../../data",
    giveaway.data.guildId,
    "giveaways",
    giveaway.file
  );
  await fs.writeFile(filePath, JSON.stringify(giveaway.data, null, 2));
}

/*
❤️ Make sure to SUBSCRIBE to ZarScape if this bot helps you! https://www.youtube.com/@ZarScape
*/
