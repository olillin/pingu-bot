import { MessageFlags, SlashCommandBuilder } from 'discord.js'
import { defineCommand } from '../util/command'
import { processNewThread } from '../features/ping'

export default defineCommand({
    data: (() => {
        const builder = new SlashCommandBuilder()
            .setName('send')
            .setDescription('Send the ping message again')

        return builder
    })(),

    execute: async interaction => {
        const isThread = interaction.channel?.isThread()
        if (isThread) {
            await processNewThread(interaction.channel)
                .then(() => {
                    void interaction.reply({
                        content: 'Message was sent sucessfully',
                        flags: MessageFlags.Ephemeral,
                    })
                })
                .catch(reason => {
                    console.error(
                        'Failed to send thread message from command: ',
                        reason
                    )
                    void interaction.reply({
                        content:
                            'An unexpected error occurred, please try again later',
                        flags: MessageFlags.Ephemeral,
                    })
                })
        } else {
            void interaction.reply({
                content: 'Current channel is not a thread!',
                flags: MessageFlags.Ephemeral,
            })
        }
    },
})
