import { type Role, type Guild } from 'discord.js'

export async function getRole(id: string, guild: Guild): Promise<Role | null> {
    return await guild.roles.fetch(id)
}
