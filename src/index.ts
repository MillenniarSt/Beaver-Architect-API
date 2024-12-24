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
import { Project, ProjectData, registerProjectMessages, setProject } from "./project.js"
import { projectsDir } from './paths.js'
import { loadArchitect } from './connection/architect.js'
import { registerSchematicMessages } from './builder/data-pack/schematic.js'
import { registerStyleMessages } from './builder/data-pack/style.js'
import { OnMessage, server, ServerOnMessage } from './connection/server.js'
import { registerDirectorMessages } from './connection/director.js'

const log = console.log
console.log = (...args) => {
    log('\x1b[90m[     Server     ]', ...args, '\x1b[0m')
}

const info = console.info
console.info = (...args) => {
    info('[     Server     ] ', ...args)
}

const warn = console.warn
console.warn = (...args) => {
    warn('\x1b[33m[     Server     ] | WARN |', ...args, '\x1b[0m')
}

const error = console.error
console.error = (...args) => {
    error('\x1b[31m[     Server     ] | ERROR |', ...args, '\x1b[0m')
}

const debug = console.debug
console.debug = (...args) => {
    debug('[     Server     ] | DEBUG |', ...args)
}

console.log('Waiting data...')

process.on('message', async (message) => {
    const data = JSON.parse(message as string)
    
    console.info(`Starting local project Server '${data.identifier}' on port ${data.port} ${data.isPublic ? '[PUBLIC]' : ''}...`)

    const projectData: ProjectData = JSON.parse(fs.readFileSync(path.join(projectsDir, data.identifier, 'project.json'), 'utf8'))

    console.log(`Launching Architect ${projectData.architect}...`)
    const architect = await loadArchitect(projectData.architect, projectData.identifier)
    console.info(`Loaded Architect ${architect.name} [${projectData.architect}]`)

    setProject(new Project(projectData, architect))

    const onServerMessage: ServerOnMessage = new Map()
    registerProjectMessages(onServerMessage as OnMessage)
    registerDirectorMessages(onServerMessage)
    registerStyleMessages(onServerMessage)
    registerSchematicMessages(onServerMessage)

    server.open(data.port, data.isPublic, onServerMessage)
    console.info(`Opened local project Server '${data.identifier}' on port ${data.port}`)

    process.send!('done')
})