import {
    AnyThreadChannel,
    DiscordAPIError,
    GuildMember,
    Message,
    Webhook,
} from 'discord.js'
import { getGuildConfiguration, getGuildId, isChannelIgnored } from '../data'
import { getMemberAvatar, getMemberDisplayName } from '../util/guild'
import client from '../bot'
import { reattemptAsync } from '../util/reattempt'

export async function processNewThread(
    channel: AnyThreadChannel,
    force: boolean = false
) {
    if (!force) {
        const guildId = await getGuildId(channel.guildId)
        const parentChannel = channel.parent
        if (guildId !== null && parentChannel !== null) {
            // Check if ignored
            const ignored = await isChannelIgnored(guildId, parentChannel.id)
            if (ignored) {
                return
            }
        }
    }

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
    await channel.messages.fetch()

    let message: Message | WebhookMessage | null | false = await reattemptAsync(
        async (attemptNumber): Promise<WebhookMessage | null | false> => {
            if (attemptNumber > 0) {
                console.log(
                    `Reattempting repeating first message as webhook (${attemptNumber})`
                )
            }

            const firstMessage = channel.messages.cache
                .filter(message => message.author.id !== client.user!.id)
                .last() // Messages are sorted newest-first
            if (!firstMessage) {
                console.warn('Failed to read first message')
                return false
            }

            const message = await sendWebhookMessageCopy(
                channel,
                firstMessage
            ).catch(reason => {
                // Do not reattempt permission error
                if (
                    reason instanceof DiscordAPIError &&
                    reason.code === 50013
                ) {
                    return null
                }
                console.error('Failed to send extra info message: ', reason)
                return false
            })
            return message
        }
    )

    if (message === false) {
        console.warn(
            'Failed to repeat first message as webhook after all reattempts'
        )
    }

    if (!message) {
        message = await reattemptAsync(
            async (attemptNumber): Promise<Message | null | false> => {
                if (attemptNumber > 0) {
                    console.log(
                        `Reattempting repeating first message (${attemptNumber})`
                    )
                }

                const firstMessage = channel.messages.cache
                    .filter(message => message.author.id !== client.user!.id)
                    .last() // Messages are sorted newest-first
                if (!firstMessage) {
                    console.warn('Failed to read first message')
                    return false
                }

                const message = await sendSimpleMessageCopy(
                    channel,
                    firstMessage
                ).catch(reason => {
                    console.error('Failed to send extra info message: ', reason)
                    return null
                })

                if (message == null) {
                    return false
                }

                // Success
                return message
            }
        )
    }

    if (!message) {
        console.warn('Failed to repeat first message after all reattempts')
        return
    }

    // Delete message
    const deleted = await reattemptAsync(
        async (attemptNumber): Promise<boolean> => {
            if (attemptNumber > 0) {
                console.log(
                    `Reattempting deleting repeated first message (${attemptNumber})`
                )
            }

            if (isWebhookMessage(message)) {
                if (message.message) {
                    const threadId = message.message.channelId
                    const messageDeleted = await message.webhook
                        .deleteMessage(message.message.id, threadId)
                        .then(() => true)
                        .catch(reason => {
                            console.error(
                                'Failed to delete extra info message: ',
                                reason
                            )
                            return false
                        })
                    if (!messageDeleted) {
                        // Fail attempt
                        return false
                    }

                    // Avoid trying to delete the same message on reattempts
                    message.message = undefined
                }

                const webhookDeleted = await message.webhook
                    .delete()
                    .then(() => true)
                    .catch(reason => {
                        console.error(
                            'Failed to delete extra info message webhook: ',
                            reason
                        )
                        return false
                    })

                if (!webhookDeleted) {
                    // Fail attempt
                    return false
                }
            } else {
                const messageDeleted = await message
                    .delete()
                    .then(() => true)
                    .catch(reason => {
                        console.error(
                            'Failed to delete extra info message: ',
                            reason
                        )
                        return false
                    })
                if (!messageDeleted) {
                    // Fail attempt
                    return false
                }
            }

            // Success
            return true
        }
    )

    if (!deleted) {
        console.warn(
            'Failed to delete repeated first message after all reattempts'
        )
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
 * Send a copy of a message in a thread as a webhook.
 * @param channel The thread to send the message in.
 * @param message The message to copy.
 * @returns The sent message.
 * @throws If the webhook could not be created.
 * @throws If the message failed to send.
 */
export async function sendWebhookMessageCopy(
    channel: AnyThreadChannel,
    message: Message
): Promise<WebhookMessage> {
    if (message.member == null) {
        throw new Error('Cannot create webhook. Message has no member')
    }

    const webhook = await createThreadWebhook(channel, message.member)

    // Send message through fake-user webhook
    const threadId = channel.id
    const sentMessage = await webhook.send({
        content: message.content,
        threadId,
    })

    return {
        message: sentMessage ?? undefined,
        webhook,
    }
}

/**
 * Send a copy of a message in a thread as a normal message.
 * @param channel The thread to send the message in.
 * @param message The message to copy.
 * @returns The sent message.
 */
export async function sendSimpleMessageCopy(
    channel: AnyThreadChannel,
    message: Message
): Promise<Message> {
    if (message.member) {
        // Send message with author name in bottom
        const authorName = getMemberDisplayName(message.member)
        const messageContent = message.content + '\n// ' + authorName

        return await channel.send(messageContent)
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
