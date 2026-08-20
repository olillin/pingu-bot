import {
    ActivityType,
    Client,
    Events,
    GatewayIntentBits,
    Guild,
    MessageFlags,
    REST,
    Routes,
} from 'discord.js'
import { discordToken } from './environment'
import type { ExtendedClient } from './types'
import commands from './commands'
import { initGuild } from './data'
import { processNewThread } from './features/ping'

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds, //
        GatewayIntentBits.MessageContent,
    ],
}) as ExtendedClient
client.commands = commands

export default client

// Thread create
client.on(Events.ThreadCreate, channel => {
    setTimeout(() => {
        processNewThread(channel).catch(reason => {
            console.error('Failed to process new thread: ', reason)
        })
    }, 1500)
})

// Command executor
client.on(Events.InteractionCreate, interaction => {
    if (!interaction.isChatInputCommand()) return

    const command = (interaction.client as ExtendedClient).commands.get(
        interaction.commandName
    )

    if (!command) {
        console.error(
            `No command matching ${interaction.commandName} was found.`
        )
        return
    }

    command.execute(interaction).catch(async error => {
        console.error(
            `Error while to executing command '${interaction.commandName}':`,
            error
        )
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({
                content: 'There was an error while executing this command!',
                flags: MessageFlags.Ephemeral,
            })
        } else {
            await interaction.reply({
                content: 'There was an error while executing this command!',
                flags: MessageFlags.Ephemeral,
            })
        }
    })
})

async function registerSlashCommands(guildId: string) {
    // Construct and prepare an instance of the REST module
    const rest = new REST().setToken(discordToken!)
    const clientId = client.user!.id

    // Deploy the application commands to the guild
    try {
        console.log(
            `Started refreshing ${client.commands.size} application (/) commands.`
        )
        // The put method is used to fully refresh all commands in the guild with the current set
        const data = (await rest.put(
            Routes.applicationGuildCommands(clientId, guildId),
            { body: commands.map(command => command.data.toJSON()) }
        )) as object[]

        console.log(
            `Successfully reloaded ${data.length} application (/) commands.`
        )
    } catch (error) {
        console.error(error)
    }
}

client.on(Events.ClientReady, () => {
    const guilds = client.guilds.cache.values()
    processGuilds(guilds).catch(reason => {
        console.error(`Failed to process guilds: ${reason}`)
    })

    // Set activity
    if (client.user) {
        const activity = client.user.setActivity({
            name: "Making sure @you don't miss things",
            type: ActivityType.Custom,
        })
        console.log('Activity updated: ', activity)
    } else {
        console.warn('Could not set activity, client.user is undefined')
    }
})

async function processGuilds(guilds: Iterable<Guild>) {
    for (const guild of guilds) {
        await processGuild(guild)
    }
}

async function processGuild(guild: Guild) {
    registerSlashCommands(guild.id).catch(reason => {
        console.error('Failed to register slash commands:', reason)
    })
    await initGuild(guild.id)
}

client.on(Events.GuildCreate, guild => {
    console.log('Joined new guild')
    processGuild(guild).catch(reason => {
        console.error(`Failed to process new guild: ${reason}`)
    })
})

client.on(Events.ClientReady, () => {
    Promise.all(
        client.guilds.cache.map(guild => registerSlashCommands(guild.id))
    )
        .then(() => {
            console.log('Bot is ready')
        })
        .catch(reason => {
            console.error('Bot failed to get ready:', reason)
        })
})
