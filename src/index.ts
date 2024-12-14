//          _____
//      ___/     \___
//    |/  _.- _.-    \|
//   ||\\=_  '    _=//||
//   ||   \\\===///   ||
//   ||       |       ||
//   ||       |       ||
//   ||\___   |   ___/||
//         \__|__/
//
//      By Millenniar
//

import fs from 'fs'
import path from 'path'
import chalk from 'chalk'
import { project, Project, ProjectData, registerProjectMessages, setProject } from "./project.js"
import { projectsDir } from './paths.js'
import { loadArchitect } from './connection/architect.js'
import { registerSchematicMessages } from './builder/data-pack/schematic.js'
import { registerStyleMessages } from './builder/data-pack/style.js'
import { OnMessage, ServerOnMessage } from './connection/server.js'

const log = console.log
console.log = (...args) => {
    log(chalk.gray('[     Server     ]', ...args))
}

const info = console.info
console.info = (...args) => {
    info('[     Server     ] ', ...args)
}

const warn = console.warn
console.warn = (...args) => {
    warn(chalk.yellow('[     Server     ] | WARN |', ...args))
}

const error = console.error
console.error = (...args) => {
    error(chalk.red('[     Server     ] | ERROR |', ...args))
}

const debug = console.debug
console.debug = (...args) => {
    debug('[     Server     ] | DEBUG |', ...args)
}

console.log('Waiting data...')

process.on('message', async (message) => {
    const data = JSON.parse(message as string)
    
    console.info(`Starting local project Server '${data.identifier}' on port ${data.port}...`)

    const projectData: ProjectData = JSON.parse(fs.readFileSync(path.join(projectsDir, data.identifier, 'project.json'), 'utf8'))

    console.log(`Launching Architect ${projectData.architect}...`)
    const architect = await loadArchitect(projectData.architect, projectData.identifier)
    console.info(`Loaded Architect ${architect.name} [${projectData.architect}]`)

    setProject(new Project(projectData, architect))

    const onServerMessage: ServerOnMessage = new Map()
    registerProjectMessages(onServerMessage as OnMessage)
    registerStyleMessages(onServerMessage)
    registerSchematicMessages(onServerMessage)

    project.server.open(data.port, onServerMessage)
    console.info(`Opened local project Server '${data.identifier}' on port ${data.port}`)

    process.send!('done')
})