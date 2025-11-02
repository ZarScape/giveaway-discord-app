// src/zar.js
require('dotenv').config({ quiet: true });
const { ClusterManager } = require('discord-hybrid-sharding');
const path = require('path');
const colors = require('colors');
const config = require('./config/config.json');

// Check for bot token
if (!process.env.TOKEN) {
  console.error(`

Error: TOKEN not found in .env file. Please add your bot token to the .env file. If you don't know what this is, you can get help from our Discord server: https://discord.gg/6YVmxA4Qsf
`.red);
  process.exit(1);
}

const manager = new ClusterManager(
  path.join(__dirname, 'index.js'),
  {
    totalShards: 'auto',
    shardsPerClusters: 2,
    totalClusters: 'auto',
    mode: 'process',
    token: process.env.TOKEN
  }
);

manager.on('clusterCreate', cluster => {
  console.log(`Cluster ${cluster.id} created`.green);
});

manager.spawn({ timeout: -1 }).catch(error => {
  if (error.message === 'DISCORD_TOKEN_INVALID') {
    console.error(`

Error: Invalid Discord token provided. Please check your .env file and make sure the TOKEN is correct. If you don't know what this is, you can get help from our Discord server: https://discord.gg/6YVmxA4Qsf

`.red);
  } else {
    console.error(`An error occurred while spawning clusters: ${error}`.red);
  }
  process.exit(1);
});

/*

❤️ Make sure to SUBSCRIBE to ZarScape if this bot helps you! https://www.youtube.com/@ZarScape

*/