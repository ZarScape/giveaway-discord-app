// utils/giveawayUtils.js
const fs = require('fs').promises;
const path = require('path');
const client = require('../../index');

module.exports = {
  name: "giveawayUtils",
};

async function findGiveaway(guildId, messageId) {
  try {
    const dir = path.join(__dirname, '../../../data', guildId, 'giveaways');
    for (const f of await fs.readdir(dir)) {
      const d = JSON.parse(await fs.readFile(path.join(dir, f), 'utf8'));
      if (d.messageId === messageId) return d;
    }
  } catch {}
  return null;
}

async function getAllGiveaways(guildId) {
  try {
    const dir = path.join(__dirname, '../../../data', guildId, 'giveaways');
    const files = await fs.readdir(dir);
    const arr = [];
    for (const f of files) {
      const d = JSON.parse(await fs.readFile(path.join(dir, f), 'utf8'));
      arr.push(d);
    }
    return arr;
  } catch {
    return [];
  }
}

async function saveGiveaway(data) {
  const fn = `giveaway-${data.guildId}-${data.hosterId}-${data.createdAt}.json`;
  const p = path.join(__dirname, '../../../data', data.guildId, 'giveaways', fn);
  await fs.mkdir(path.dirname(p), { recursive: true });
  await fs.writeFile(p, JSON.stringify(data, null, 2));
}

// Proper, unbiased shuffle + slice for random winner selection
function selectWinners(participants, count) {
  const array = [...participants];
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array.slice(0, count);
}

client.giveawayUtils = {
  findGiveaway,
  getAllGiveaways,
  saveGiveaway,
  selectWinners,
};

/*

❤️ Make sure to SUBSCRIBE to ZarScape if this bot helps you! https://www.youtube.com/@ZarScape

*/