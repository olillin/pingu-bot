import { AnyThreadChannel } from 'discord.js'
import { getPingRole, isExtraInfoEnabled, isGhostPingEnabled } from '../data'

export async function processNewThread(channel: AnyThreadChannel) {
    const role = await getPingRole(channel.guild).catch(reason => {
        console.error(`Failed to get ping role: `, reason)
        return null
    })
    if (!role) return

    const guildSnowflake = channel.guildId
    const includeExtraInfo = await isExtraInfoEnabled(guildSnowflake)
    let messageContent = role.toString()
    if (includeExtraInfo) {
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

    const sendGhostPing = await isGhostPingEnabled(guildSnowflake)
    if (sendGhostPing) {
        if (!message.deletable) {
            console.error('Failed to ghost ping, message is not deletable')
            return
        }
        message.delete().catch(reason => {
            console.error(
                'Failed to ghost ping, could not delete message: ',
                reason
            )
        })
    }

    channel.leave().catch(reason => {
        console.error('Failed to leave thread: ', reason)
    })
}
