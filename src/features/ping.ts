import { AnyThreadChannel } from 'discord.js'
import { getPingRole } from '../data'

export function processNewThread(channel: AnyThreadChannel) {
    getPingRole(channel.guild)
        .then(role => {
            if (role) {
                channel.send(role.toString()).catch(reason => {
                    console.error('Failed to send ping in new thread: ', reason)
                })
            } else {
                console.warn('Unable to ping, role is not set')
            }
        })
        .catch(reason => {
            console.error(`Failed to get ping role: `, reason)
        })
}
