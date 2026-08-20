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

    const message = await channel.send(messageContent).catch(reason => {
        console.error('Failed to send ping in new thread: ', reason)
    })
    if (!message) return

    if (config.silentPing) {
        if (message.editable) {
            await message.edit(config.pingRole.toString()).catch(reason => {
                console.error(
                    'Failed to silent ping, could not edit message: ',
                    reason
                )
            })
        } else {
            console.error('Failed to silent ping, message is not editable')
        }
    }

    if (config.ghostPing) {
        if (message.deletable) {
            await message.delete().catch(reason => {
                console.error(
                    'Failed to ghost ping, could not delete message: ',
                    reason
                )
            })
        } else {
            console.error('Failed to ghost ping, message is not deletable')
        }
    }

    if (config.extraInfo) {
        await repeatFirstMessage(channel)
    }

    await channel.leave().catch(reason => {
        console.error('Failed to leave thread: ', reason)
    })
}

export async function repeatFirstMessage(
    channel: AnyThreadChannel
): Promise<void> {
    const messages = await channel.messages.fetch()
    const firstMessage = messages.last() // Messages are sorted newest-first
    if (!firstMessage) {
        console.warn(
            'Failed to repeat first thread message, cannot read message'
        )
        return
    }

    const firstMessageContent = firstMessage.content
    const authorName =
        firstMessage.member?.nickname ?? firstMessage.author.displayName
    const messageContent = firstMessageContent + '\n// ' + authorName

    const message = await channel
        .send({
            content: messageContent,
        })
        .catch(reason => {
            console.error('Failed to send extra info message: ', reason)
            return null
        })
    if (!message) return

    await message.delete().catch(reason => {
        console.error('Failed to delete extra info message: ', reason)
    })
}
