import { AnyThreadChannel } from 'discord.js'
import { getPingRole, shouldGhostPing } from '../data'

export async function processNewThread(channel: AnyThreadChannel) {
    const role = await getPingRole(channel.guild).catch(reason => {
        console.error(`Failed to get ping role: `, reason)
        return null
    })
    if (!role) return

    const message = await channel.send(role.toString()).catch(reason => {
        console.error('Failed to send ping in new thread: ', reason)
    })
    if (!message) return

    const guildSnowflake = channel.guildId
    const ghostPing = await shouldGhostPing(guildSnowflake)

    if (ghostPing) {
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
