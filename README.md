# giveaway-discord-app

🎉 A production-ready Discord giveaway bot with sharding support (via discord-hybrid-sharding), slash commands, and simple JSON-backed persistence.

Built to be fast, easy to run, and simple to customize.

```
❤️❤️ Make sure to SUBSCRIBE to ZarScape if this bot helps you ❤️❤️
```

## Key features

- Sharded architecture using discord-hybrid-sharding for scale
- Slash commands (auto-registered on startup)
- JSON-backed per-guild giveaway persistence (stored in `data/`)
- Uses modern Discord.js v14 and supports Message Content and Reaction-based interactions

## Table of contents

- [Demo / Screenshots](#demo--screenshots)
- [Prerequisites](#prerequisites)
- [Install](#install)
- [Configuration](#configuration)
- [Running the bot (development)](#running-the-bot-development)
- [Production / deployment notes](#production--deployment-notes)
- [Data storage](#data-storage)
- [Permissions](#permissions)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [Support](#support)
- [License](#license)

## Demo / Screenshots

Add screenshots or a short demo GIF here showing creating a giveaway and entering it.

## Prerequisites

- Node.js >= 16.9.0 (Node 18 LTS recommended)
- npm
- A Discord application with a bot token and the Application (client) ID

This project depends on the versions listed in `package.json` and was built using `discord.js` v14 and `discord-hybrid-sharding`.

## Install

Clone the repository and install dependencies:

```powershell
git clone https://github.com/ZarScape/giveaway-discord-app.git
cd "giveaway-discord-app"
npm install
```

## Configuration

Create a `.env` file in the project root with the following values OR rename .env.example to .env and edit:

```env
# .env
TOKEN=your_bot_token_here
CLIENTID=your_application_client_id
```

- `TOKEN` — your bot token from the Discord Developer Portal
- `CLIENTID` — the Application (Client) ID (used when registering slash commands)

There is a small runtime configuration file at `src/config/config.json`. By default it contains a `color` value used by embeds — update it to match your branding.

Notes:
- The slash command handler will abort if either `TOKEN` or `CLIENTID` is missing (see `src/handlers/slash.js`).
- The bot will exit with an error message if the token is missing or invalid (see `src/zar.js`).

## Running the bot (development)

Start the bot (PowerShell):

```powershell
# Recommended: create .env first and then run
npm start
```

The `start` script runs `node src/zar.js`, which launches the cluster manager and spawns worker clusters.

- Ensure the host has sufficient file permissions to write the `data/` directory (giveaway state is stored there).
- If you deploy globally-registered slash commands, note that changes may take up to an hour to fully propagate. For quicker testing, adapt the registration to use guild-specific registration.

## Data storage

Giveaways and related state are stored in `data/<GUILD_ID>/giveaways/` as JSON files (see `data/` directory). Back this folder up if the data is important. The bot expects the folder structure to exist or be creatable by the runtime user.

If you prefer a database (SQLite, MongoDB, etc.), you can replace the JSON persistence with DB calls in `src/Giveaway/giveawayUtils.js` and related files.

## Permissions

Recommended bot permissions in the server: Send Messages, Embed Links, Read Message History, Manage Messages (if you want the bot to remove/close messages), Use Slash Commands. Adjust according to your use-case.

## Troubleshooting

- Error: `TOKEN not found in .env file` — create a `.env` file at the project root with `TOKEN` set.
- Error: `Invalid Discord token provided` — verify the token in the `.env` file is correct and not expired/rotated.
- Error: `TOKEN or CLIENTID missing in .env` during slash registration — ensure both values exist in `.env`.
- Slash commands not appearing immediately — global commands can take up to an hour to register. For faster testing use guild commands.

## Contributing

Contributions are welcome. If you'd like to contribute:

1. Fork the repository
2. Create a feature branch
3. Add tests or a small demo where appropriate
4. Open a pull request describing your changes

If you add persistence changes (DB instead of JSON) please include migration instructions.

## Support

Join the community or request help via the project's Discord: https://discord.gg/6YVmxA4Qsf

## License

This project includes a `LICENSE` file in the repository root. Refer to it for license terms.

---

Authored by ZarScape

❤️ Make sure to SUBSCRIBE to ZarScape if this bot helps you: https://www.youtube.com/@ZarScape