import { type Role, type Guild, GuildMember } from 'discord.js'

export async function getRole(id: string, guild: Guild): Promise<Role | null> {
    return await guild.roles.fetch(id)
}

/**
 * Get the displayed name of a guild member.
 * @param member The guild member to get the name of.
 * @returns The member's nickname if set, otherwise their user display name is returned.
 */
export function getMemberDisplayName(member: GuildMember): string {
    return member.nickname ?? member.user.displayName
}

/**
 * Get the URL to the avatar of a guild member.
 * @param member The guild member to get the avatar of.
 * @returns The member's per-guild avatar if set or user avatar.
 */
export function getMemberAvatar(member: GuildMember): string | null {
    return member.avatarURL() ?? member.user.avatarURL()
}
