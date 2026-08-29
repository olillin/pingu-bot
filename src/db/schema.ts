import { integer, boolean, pgTable, bigint, unique } from 'drizzle-orm/pg-core'

const snowflake = (name?: string) => {
    if (name) return bigint(name, { mode: 'bigint' })
    else return bigint({ mode: 'bigint' })
}

export const guilds = pgTable('guilds', {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    snowflake: snowflake().notNull().unique(),

    pingRole: snowflake('ping_role'),
    ghostPing: boolean('ghost_ping').notNull().default(true),
    extraInfo: boolean('extra_info').notNull().default(false),
    silentPing: boolean('silent_ping').notNull().default(true),
})

export const channels = pgTable(
    'channels',
    {
        id: integer().primaryKey().generatedAlwaysAsIdentity(),
        guildId: integer()
            .notNull()
            .references(() => guilds.id, { onDelete: 'cascade' }),
        snowflake: snowflake('channel_snowflake').notNull(),
    },
    t => [unique().on(t.guildId, t.snowflake)]
)
