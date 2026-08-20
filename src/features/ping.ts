import { AnyThreadChannel } from 'discord.js'
import { getGuildConfiguration } from '../data'

export async function processNewThread(channel: AnyThreadChannel) {
    const config = await getGuildConfiguration(channel.guild).catch(reason => {
        console.error(`Failed to get guild configuration: `, reason)
        return null
    })
    if (!config?.pingRole) return

    let messageContent = config.silentPing
        ? 'Inviting members...'
        : config.pingRole.toString()

    if (config.extraInfo) {
        const messages = await channel.messages.fetch()
        const firstMessage = messages.last() // Messages are sorted newest-first
        if (firstMessage) {
            const firstMessageContent = firstMessage.content
            const authorName =
                firstMessage.member?.nickname ?? firstMessage.author.displayName
            messageContent =
                firstMessageContent +
                '\n' +
                messageContent +
                ' // ' +
                authorName
        }
    }

    const message = await channel.send(messageContent).catch(reason => {
        console.error('Failed to send ping in new thread: ', reason)
    })
    if (!message) return
    if (config.silentPing) {
        if (!message.editable) {
            console.error('Failed to silent ping, message is not editable')
            return
        }
        await message.edit(config.pingRole.toString()).catch(reason => {
            console.error(
                'Failed to silent ping, could not edit message: ',
                reason
            )
        })
    }

    if (config.ghostPing) {
        if (!message.deletable) {
            console.error('Failed to ghost ping, message is not deletable')
            return
        }
        await message.delete().catch(reason => {
            console.error(
                'Failed to ghost ping, could not delete message: ',
                reason
            )
        })
    }

    await channel.leave().catch(reason => {
        console.error('Failed to leave thread: ', reason)
    })
}
