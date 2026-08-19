import { Role, type Guild } from 'discord.js'
import { getRole } from './util/guild'
import db from './db/client'
import * as schema from './db/schema'
import { eq } from 'drizzle-orm'

export async function initGuild(
    guildSnowflake: string | bigint
): Promise<typeof schema.guilds.$inferSelect> {
    const snowflake = BigInt(guildSnowflake)
    const result = await db
        .insert(schema.guilds)
        .values({ snowflake })
        .onConflictDoNothing()
        .returning()
    if (result.length === 0) {
        const result = await db
            .select()
            .from(schema.guilds)
            .where(eq(schema.guilds.snowflake, snowflake))
        return result[0]
    }
    return result[0]
}

export async function getGuildId(
    guildSnowflake: string | bigint
): Promise<number | null> {
    const result = await db
        .select({ guildId: schema.guilds.id })
        .from(schema.guilds)
        .where(eq(schema.guilds.snowflake, BigInt(guildSnowflake)))
    if (result.length === 0) return null
    return result[0].guildId
}

export async function getGuildSnowflake(
    guildId: number
): Promise<bigint | null> {
    const result = await db
        .select({ snowflake: schema.guilds.snowflake })
        .from(schema.guilds)
        .where(eq(schema.guilds.id, guildId))
    if (result.length === 0) return null
    return result[0].snowflake
}

export type GuildConfigKey = 'pingRole'
export type GuildConfigType<KeyType extends GuildConfigKey> = NonNullable<
    (typeof schema.guilds.$inferSelect)[KeyType]
>

/**
 * Get the value of a column in the guild config.
 * @param guildId The ID of the guild to get the time for.
 * @param key The name of the column.
 * @returns The saved value, or null if not defined.
 */
export async function getGuildConfigValue<T extends GuildConfigKey>(
    guildId: number,
    key: T
): Promise<GuildConfigType<T> | null> {
    const result = await db
        .select({ field: schema.guilds[key] })
        .from(schema.guilds)
        .where(eq(schema.guilds.id, guildId))
    if (result.length === 0) return null
    return result[0].field
}

/**
 * Set the value of a column in the guild config.
 * @param guildId The ID of the guild to get the time for.
 * @param key The name of the column.
 * @param value The new value of the column.
 */
export async function setGuildConfigValue<T extends GuildConfigKey>(
    guildId: number,
    key: T,
    value: GuildConfigType<T> | null
) {
    await db
        .update(schema.guilds)
        .set({ [key]: value })
        .where(eq(schema.guilds.id, guildId))
}

export async function getPingRole(guild: Guild): Promise<Role | null> {
    const result = await db
        .select({ pingRole: schema.guilds.pingRole })
        .from(schema.guilds)
        .where(eq(schema.guilds.snowflake, BigInt(guild.id)))
    if (result.length === 0) return null

    const { pingRole } = result[0]
    if (pingRole == null) return null
    return getRole(pingRole.toString(), guild)
}
