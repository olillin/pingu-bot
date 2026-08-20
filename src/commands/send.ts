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
            await interaction.deferReply({
                flags: MessageFlags.Ephemeral,
            })
            await processNewThread(interaction.channel)
                .then(() => {
                    void interaction.editReply({
                        content: 'Message was sent sucessfully',
                    })
                })
                .catch(reason => {
                    console.error(
                        'Failed to send thread message from command: ',
                        reason
                    )
                    void interaction.editReply({
                        content:
                            'An unexpected error occurred, please try again later',
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
