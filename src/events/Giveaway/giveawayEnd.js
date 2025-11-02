// events/giveawayEnd.js
const fs = require("fs").promises;
const path = require("path");
const {
  PermissionsBitField,
  DiscordAPIError,
  TextDisplayBuilder,
  ContainerBuilder,
  SeparatorBuilder,
  MediaGalleryBuilder,
  MediaGalleryItemBuilder,
  MessageFlags,
} = require("discord.js");

const client = require("../../index");

module.exports = {
  name: "giveawayEnd",
};

client.on("clientReady", () => {
  setInterval(async () => {
    for (const guild of client.guilds.cache.values()) {
      const dir = path.join(__dirname, "../../../data", guild.id, "giveaways");
      let files;
      try {
        files = await fs.readdir(dir);
      } catch {
        continue;
      }

      for (const f of files) {
        const g = JSON.parse(await fs.readFile(path.join(dir, f), "utf8"));
        if (g.ended || Date.now() < g.endTime) continue;

        const bot = guild.members.me;
        if (
          !bot.permissions.has([
            PermissionsBitField.Flags.SendMessages,
            PermissionsBitField.Flags.EmbedLinks,
            PermissionsBitField.Flags.ReadMessageHistory,
          ])
        )
          continue;

        const ch = await client.channels.fetch(g.channelId).catch(() => null);
        if (!ch?.isTextBased()) continue;

        const msg = await ch.messages.fetch(g.messageId).catch(() => null);
        if (!msg) continue;

        const eligible = g.participants;
        const winners = client.giveawayUtils.selectWinners(eligible, g.winners);

        // Build new structured message
        const header = new TextDisplayBuilder().setContent(`# 🎉 ${g.prize} 🎉`);
        const separator = new SeparatorBuilder();

        const infoText = new TextDisplayBuilder().setContent(
          `**Organized by:** <@${g.hosterId}>\n` +
          `**Concluded:** <t:${Math.floor(g.endTime / 1000)}:R>\n` +
          (g.description ? `**Details:** ${g.description}\n` : "") +
          `**Victors:** ${
            winners.length
              ? winners.map((u) => `<@${u}>`).join(" ")
              : "No eligible entrants"
          }\n` +
          `**Entrants:** ${g.participants.length}`
        );

        const mainContainer = new ContainerBuilder()
          .addTextDisplayComponents(header)
          .addSeparatorComponents(separator)
          .addTextDisplayComponents(infoText);

        if (g.image) {
          const mediaGallery = new MediaGalleryBuilder().addItems(
            new MediaGalleryItemBuilder().setURL(g.image)
          );
          mainContainer.addMediaGalleryComponents(mediaGallery);
        }

        try {
          await msg.edit({
            flags: MessageFlags.IsComponentsV2,
            components: [mainContainer],
          });
        } catch (e) {
          // If the message was deleted or unknown, log and continue — don't let the interval crash
          if (e?.code === 10008) {
            console.warn(`giveawayEnd: message ${g.messageId} not found when trying to edit.`);
          } else {
            console.error('giveawayEnd: failed to edit message:', e);
          }
        }

        // Announce results in channel
        if (winners.length) {
          const winContainer = new ContainerBuilder()
            .addTextDisplayComponents(
              new TextDisplayBuilder().setContent(
                `🎉 **Congratulations!** ${winners
                  .map((u) => `<@${u}>`)
                  .join(" ")} — you’ve won **${g.prize}**!`
              )
            )
            .addSeparatorComponents(new SeparatorBuilder())
            .addTextDisplayComponents(
              new TextDisplayBuilder().setContent(
                `Thank you to everyone who participated! 🎊`
              )
            );

          await ch.send({
            flags: MessageFlags.IsComponentsV2,
            components: [winContainer],
          });
        } else {
          const noWinContainer = new ContainerBuilder()
            .addTextDisplayComponents(
              new TextDisplayBuilder().setContent(
                `🚫 Regrettably, there were no eligible entrants, thus no victors for **${g.prize}**.`
              )
            );
          await ch.send({
            flags: MessageFlags.IsComponentsV2,
            components: [noWinContainer],
          });
        }

        g.ended = true;
        await fs.writeFile(path.join(dir, f), JSON.stringify(g, null, 2));
      }
    }
  }, 15000);
});

/*
❤️ Make sure to SUBSCRIBE to ZarScape if this bot helps you!
https://www.youtube.com/@ZarScape
*/
