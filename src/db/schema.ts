import { integer, boolean, pgTable, bigint } from 'drizzle-orm/pg-core'

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
})
