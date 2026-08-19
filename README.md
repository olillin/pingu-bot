# Pingu Bot

Discord bot which automatically invites a role to all new threads by pinging it.

## Usage

After being configured with a role (see [/config](#config)) the bot will
automatically send a message pinging the role when a new thread or forum post
is created.

### Commands

The bot is configured using
[slash commands](https://support-apps.discord.com/hc/en-us/articles/26501837786775-Slash-Commands-FAQ).

#### /config

Configure the bot, supports the following options:

- role, the role which is pinged when a thread is created.
- ghost, whether the ping should be deleted after sending. Defaults to true.
- extra-info, whether to include extra info from the first channel message in
  the ping message. This is intended to produce a richer notification. Defaults
  to false.
