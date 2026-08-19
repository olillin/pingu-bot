import { Collection } from 'discord.js'
import { CommandDefinition } from '../util/command'
import { default as config } from './config'

const commands = new Collection<string, CommandDefinition>()

const definitions: CommandDefinition[] = [config]
definitions.forEach(definition => {
    commands.set(definition.data.name, definition)
})

export default commands
