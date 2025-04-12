//             _____
//         ___/     \___        |  |
//      ##/  _.- _.-    \##  -  |  |                       -
//      ##\#=_  '    _=#/##  |  |  |  /---\  |      |      |   ===\  |  __
//      ##   \\#####//   ##  |  |  |  |___/  |===\  |===\  |   ___|  |==/
//      ##       |       ##  |  |  |  |      |   |  |   |  |  /   |  |
//      ##       |       ##  |  \= \= \====  |   |  |   |  |  \___/  |
//      ##\___   |   ___/
//      ##    \__|__/

import fs from 'fs'
import path from 'path'
import { Project, type ProjectData, registerProjectMessages, Version } from "./project/project.js"
import { type OnMessage, server, type ServerOnMessage } from './connection/server.js'
import { registerDirectorMessages } from './connection/director.js'
import { close, commander, getProject, setArchitect, users } from './instance.js'
import { type ArchitectData, loadArchitect } from './project/architect.js'
import { registerEnStructureMessages } from './engineer/data-pack/structure/messages.js'
import { registerEditorMessages } from './engineer/editor.js'
import { identifierToLabel, labelToId } from './util/form.js'
import { userInfo } from 'os'
import { User } from './connection/user.js'

/**
 * Improvement of the console logs
 * To print in console without the decorators use console.debug
 */
const log = console.log
console.log = (...args) => {
    log('\x1b[90m[     Server     ]', ...args, '\x1b[0m')
}

const info = console.info
console.info = (...args) => {
    info('[     Server     ]', ...args)
    server.sendAll('message', { severity: 'info', summary: 'Server Info', detail: args.join(' ') })
}

const warn = console.warn
console.warn = (...args) => {
    warn('\x1b[33m[     Server     ] | WARN |', ...args, '\x1b[0m')
    server.sendAll('message', { severity: 'warn', summary: 'Server Warn', detail: args.join(' ') })
}

const error = console.error
console.error = (...args) => {
    error('\x1b[31m[     Server     ] | ERROR |', ...args, '\x1b[0m')
    server.sendAll('message', { severity: 'error', summary: 'Server Error', detail: args.join(' ') })
}

process.on('SIGINT', close)
process.on('SIGTERM', close)
process.on('uncaughtException', (err) => {
    console.error(err)
    close()
})

/**
 * Import all Builders here
 * so you make sure they are registered
 */
import './builder/collective.js'
import './builder/random/type.js'
import { simpleGrid } from './template/testing.js'

/**
 * Server environmental variables taken from file .env
 */
/*
const identifier = process.env.IDENTIFIER ?? `${labelToId(userInfo().username)}.project`
const port = process.env.PORT ? Number(process.env.PORT) : 8224
const isPublic = process.env.IS_PUBLIC === 'true'
const dir = process.env.DIR ?? path.join(__dirname, 'project')
*/

const port = process.argv[2]! ? Number(process.argv[2]!) : 8224
const isPublic = process.argv[3]! === 'true'
const dir = process.env.DEV_ENV === 'true' ?
    path.join(path.dirname(__dirname), 'build', 'project') :
    process.argv[4]! ?? path.join(path.dirname(process.execPath), 'project')

console.info(`Starting local project Server on port ${port} ${isPublic ? '[PUBLIC]' : ''} on '${dir}'...`)

start()
    // Testing Generation
    .then(simpleGrid)

async function start() {
    /**
    * Starts the integrated console to execute any command registered with all permissions
    */
    commander.open()

    /**
     * Load or generate project resources
     */
    let projectData: ProjectData
    let architectData: ArchitectData
    if (fs.existsSync(dir)) {
        projectData = JSON.parse(fs.readFileSync(path.join(dir, 'project.json'), 'utf8'))
        architectData = JSON.parse(fs.readFileSync(path.join(dir, 'architect.json'), 'utf8'))

        await Project.load(dir, projectData)
    } else {
        console.info(`Generating default resources for new project...`)
        const identifier = `${labelToId(userInfo().username)}.project`

        projectData = {
            identifier: identifier,
            name: identifierToLabel(identifier.substring(identifier.includes('.') ? identifier.lastIndexOf('.') + 1 : 0)),
            authors: userInfo().username,
            description: 'My beautiful project',
            version: new Version('1.0.0').toJson(),
            dependencies: []
        }
        architectData = { identifier: 'minecraft', version: new Version('1.0.0-1.20.1').toJson(), port: 8225, name: 'Minecraft' }

        await Project.create(dir, projectData, architectData)
    }

    Object.entries(getProject().read('users.json')).map(([id, user]) => {
        users.set(id, User.fromJson(user))
    })

    /**
     * Registration of all server messages and opening of the WebSocket server
     */
    const onServerMessage: ServerOnMessage = new Map()
    registerProjectMessages(onServerMessage as OnMessage)
    registerDirectorMessages(onServerMessage)
    registerEnStructureMessages(onServerMessage)
    registerEditorMessages(onServerMessage)

    const url = await server.open(port, isPublic, onServerMessage)
    console.info(`Opened Project Server '${getProject().identifier}' on ${url ?? `port ${port}`}`)

    /**
     * Launch architect installed on ./project$dir/architect/architect.exe
     * and wait its setup
     */
    console.log(`Launching Architect ${architectData.name}...`)
    const architectSide = await loadArchitect(architectData, projectData.identifier)
    setArchitect(architectSide)
    console.info(`Loaded Architect ${architectSide.architect.name} [${architectData.identifier}]`)
}