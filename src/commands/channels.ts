import {
    ChannelType,
    EmbedBuilder,
    MessageFlags,
    SlashCommandBuilder,
    type ChatInputCommandInteraction,
} from 'discord.js'
import {
    getChannelExceptions,
    getGuildId,
    ignoreChannel,
    unignoreChannel,
} from '../data'
import { CommandMap } from '../util/command'
import { defineCommand } from '../util/command'

export default defineCommand({
    data: new SlashCommandBuilder()
        .setName('channels')
        .setDescription('Configure exceptions for channels')
        .addSubcommand(subcommand =>
            subcommand
                .setName('ignore')
                .setDescription('Ignore this channel, do not ping')
                .addChannelOption(option =>
                    option
                        .setName('channel')
                        .setDescription('Channel to ignore')
                        .addChannelTypes(
                            ChannelType.GuildText,
                            ChannelType.GuildAnnouncement,
                            ChannelType.GuildForum
                        )
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('unignore')
                .setDescription('Do not ignore this channel, ping like usual')
                .addChannelOption(option =>
                    option
                        .setName('channel')
                        .setDescription('Channel to update')
                        .addChannelTypes(
                            ChannelType.GuildText,
                            ChannelType.GuildAnnouncement,
                            ChannelType.GuildForum
                        )
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand.setName('list').setDescription('List channel exceptions')
        ),

    async execute(interaction: ChatInputCommandInteraction) {
        const command = interaction.options.getSubcommand() as
            | 'ignore'
            | 'unignore'
            | 'list'

        const commandMap: CommandMap = {
            ignore,
            unignore,
            list,
        }

        await commandMap[command](interaction)
    },
})

async function ignore(interaction: ChatInputCommandInteraction) {
    const channel = interaction.options.getChannel('channel', true)
    const channelId = channel.id
    const guildSnowflake = interaction.guildId
    if (guildSnowflake === null) {
        throw new Error('This command must be used in a guild channel')
    }
    const guildId = await getGuildId(guildSnowflake)
    if (guildId === null) {
        throw new Error(
            'Guild has not been initialized yet, please try again later'
        )
    }

    const success = await ignoreChannel(guildId, channelId)
        .then(() => {
            return true
        })
        .catch(async () => {
            await interaction.reply({
                content: 'The channel is already ignored',
                flags: MessageFlags.Ephemeral,
            })
            return false
        })

    if (success) {
        await interaction.reply({
            content: `Ignoring <#${channelId}>, pings will not be sent in threads nor posts`,
            flags: MessageFlags.Ephemeral,
        })
    }
}

async function unignore(interaction: ChatInputCommandInteraction) {
    const channel = interaction.options.getChannel('channel', true)
    const channelId = channel.id
    const guildSnowflake = interaction.guildId

    if (guildSnowflake === null) {
        throw new Error('This command must be used in a guild channel')
    }
    const guildId = await getGuildId(guildSnowflake)
    if (guildId === null) {
        throw new Error(
            'Guild has not been initialized yet, please try again later'
        )
    }

    const success = await unignoreChannel(guildId, channelId)
        .then(() => {
            return true
        })
        .catch(async () => {
            await interaction.reply({
                content: 'The channel is not ignored',
                flags: MessageFlags.Ephemeral,
            })
            return false
        })

    if (success) {
        await interaction.reply({
            content: `Unignoring <#${channelId}>, pings will be sent in threads and posts`,
            flags: MessageFlags.Ephemeral,
        })
    }
}

async function list(interaction: ChatInputCommandInteraction) {
    const guild = interaction.guild
    if (guild === null) {
        throw new Error('This command must be used in a guild channel')
    }

    const channels = await getChannelExceptions(guild)

    await interaction.reply({
        embeds: [
            new EmbedBuilder()
                .setTitle('Channel exceptions')
                .setColor('#c4dcf4')
                .setDescription(
                    channels.length === 0
                        ? 'No channel exceptions'
                        : channels
                              .map(
                                  channel =>
                                      `- ${channel !== null ? `<#${channel.id}>` : '*Unknown channel*'} (ignored)`
                              )
                              .join('\n')
                ),
        ],
        flags: MessageFlags.Ephemeral,
    })
}
