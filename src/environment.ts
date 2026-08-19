import fs from 'node:fs'

export const discordToken =
    process.env.TOKEN ??
    (process.env.TOKEN_FILE
        ? fs.readFileSync(process.env.TOKEN_FILE, 'utf-8')
        : undefined)

export const databaseUrl =
    process.env.DATABASE_URL ??
    (process.env.DATABASE_URL_FILE
        ? fs.readFileSync(process.env.DATABASE_URL_FILE, 'utf-8')
        : undefined)

/**
 * Checks whether the environment is valid and prints warnings if not
 * @returns Whether or not the environment is valid
 */
export function validateEnvironment(): boolean {
    let valid = true

    // Check token is present
    if (!discordToken) {
        console.error('Missing required environment TOKEN')
        valid = false
    }

    // Check database URL is present
    if (!databaseUrl) {
        console.error('Missing required environment DATABASE_URL')
        valid = false
    }

    return valid
}
