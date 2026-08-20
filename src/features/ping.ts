import { AnyThreadChannel, GuildMember, Message, Webhook } from 'discord.js'
import { getGuildConfiguration } from '../data'
import { getMemberAvatar, getMemberDisplayName } from '../util/guild'

export async function processNewThread(channel: AnyThreadChannel) {
    const config = await getGuildConfiguration(channel.guild).catch(reason => {
        console.error(`Failed to get guild configuration: `, reason)
        return null
    })
    if (!config?.pingRole) return

    const messageContent = config.silentPing
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

    const message = await sendMessageCopy(channel, firstMessage).catch(
        reason => {
            console.error('Failed to send extra info message: ', reason)
            return null
        }
    )
    if (!message) return

    // Delete message
    if (isWebhookMessage(message)) {
        if (message.message) {
            const threadId = message.message.channelId
            await message.webhook
                .deleteMessage(message.message.id, threadId)
                .catch(reason => {
                    console.error(
                        'Failed to delete extra info message: ',
                        reason
                    )
                })
        }
        await message.webhook.delete().catch(reason => {
            console.error(
                'Failed to delete extra info message webhook: ',
                reason
            )
        })
    } else {
        await message.delete().catch(reason => {
            console.error('Failed to delete extra info message: ', reason)
        })
    }
}

export type WebhookMessage = {
    message?: Message
    webhook: Webhook
}
export function isWebhookMessage(
    message: Message | WebhookMessage
): message is WebhookMessage {
    return Object.hasOwn(message, 'webhook')
}

/**
 * Send a copy of a message in a thread.
 * @param channel The thread to send the message in.
 * @param message The message to copy.
 * @returns The sent message.
 */
export async function sendMessageCopy(
    channel: AnyThreadChannel,
    message: Message
): Promise<Message | WebhookMessage> {
    if (message.member) {
        // Attempt to set up a webhook
        const webhook =
            message.member == null
                ? null
                : await createThreadWebhook(channel, message.member).catch(
                      reason => {
                          console.warn(
                              'Failed to create thread webhook: ',
                              reason
                          )
                          return null
                      }
                  )

        if (webhook) {
            // Send message through fake-user webhook
            const threadId = channel.id
            const sentMessage = await webhook
                .send({
                    content: message.content,
                    threadId,
                })
                .catch(reason => {
                    console.error(
                        'Failed to send message through webhook: ',
                        reason
                    )
                    return null
                })

            return {
                message: sentMessage ?? undefined,
                webhook,
            }
        } else {
            // Send message with author name in bottom
            const authorName = getMemberDisplayName(message.member)
            const messageContent = message.content + '\n// ' + authorName

            return await channel.send(messageContent)
        }
    }

    // Send only message content
    return await channel.send(message.content)
}

/**
 * Create a webhook for a thread resembling a guild member. `threadId` must be
 * supplied when sending messages.
 * @param channel The thread channel.
 * @param member The guild member to copy the profile of.
 * @return A webhook created on the parent channel of a hook.
 * @throws If the channel does not have a parent channel.
 */
export async function createThreadWebhook(
    channel: AnyThreadChannel,
    member: GuildMember
): Promise<Webhook> {
    const parent = channel.parent
    if (parent === null) {
        throw new Error('Cannot create webhook, thread does not have a parent')
    }

    const name = getMemberDisplayName(member)
    const avatar = getMemberAvatar(member)

    return parent.createWebhook({ name, avatar })
}
