import { ApplicationCommandOptionType, SlashCommandBuilder } from 'discord.js'
import {
    addConfigurationCommands,
    CommandResponseError,
    configurationCommandExecutor,
    ConfigurationCommandOptions,
    defineCommand,
    defineConfigurationCommand,
} from '../util/command'
import { getRole } from '../util/guild'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const commands: ConfigurationCommandOptions<any, any>[] = [
    defineConfigurationCommand({
        type: ApplicationCommandOptionType.Role as const,
        key: 'pingRole' as const,
        name: 'role',
        description: 'Roll to ping',

        set: (value, _context) => {
            return BigInt(value.id)
        },
        get: async (value, context) => {
            const guild = context.guild!
            const role = await getRole(value.toString(), guild)
            if (!role) {
                throw new CommandResponseError(
                    'The saved role has been deleted'
                )
            }
            return role.toString()
        },
    }),
]

export default defineCommand({
    data: (() => {
        const builder = new SlashCommandBuilder()
            .setName('config')
            .setDescription('Configure the bot')

        addConfigurationCommands(commands, builder)

        return builder
    })(),

    execute: configurationCommandExecutor(commands),
})
