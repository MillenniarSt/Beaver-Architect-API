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
import { commander, getProject, setArchitect, users } from './instance.js'
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

/**
 * Import all Builders here
 * so you make sure they are registered
 */
import './builder/collective.js'
import './builder/random/type.js'

/**
 * Server environmental variables taken from file .env
 */
const identifier = process.env.IDENTIFIER ?? `${labelToId(userInfo().username)}.project`
const port = process.env.PORT ? Number(process.env.PORT) : 8224
const isPublic = process.env.IS_PUBLIC === 'true'
const dir = process.env.DIR ?? path.join(__dirname, 'project')

console.info(`Starting local project Server '${identifier}' on port ${port} ${isPublic ? '[PUBLIC]' : ''}...`)

/**
 * Starts the integrated console to execute any command registered with all permissions
 */
commander.open()

/**
 * Load or generate project resources
 */
let projectData: ProjectData
let architectData: ArchitectData
if(fs.existsSync(dir)) {
    projectData = JSON.parse(fs.readFileSync(path.join(dir, 'project.json'), 'utf8'))
    architectData = JSON.parse(fs.readFileSync(path.join(dir, 'architect.json'), 'utf8'))

    await Project.load(dir, projectData)
} else {
    console.info(`Generating default resources for new project '${identifier}'...`)

    projectData = {
        identifier: identifier, 
        name: identifierToLabel(identifier.substring(identifier.includes('.') ? identifier.lastIndexOf('.') +1 : 0)), 
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
console.info(`Opened Project Server '${identifier}' on ${url ?? `port ${port}`}`)

/**
 * Launch architect installed on ./project$dir/architect/architect.exe
 * and wait its setup
 */
console.log(`Launching Architect ${architectData.name}...`)
const architectSide = await loadArchitect(architectData, projectData.identifier)
setArchitect(architectSide)
console.info(`Loaded Architect ${architectSide.architect.name} [${architectData.identifier}]`)

/*
// Testing

import { Rect2 } from './world/bi-geo/plane.js'
import { Vec2 } from './world/vector.js'
import { Plane3 } from './world/geo/surface.js'
import { templateBuilderExport } from './template/exporter.js'
import { Quaternion, Rotation3 } from './world/quaternion.js'
import { templateTestBuilders } from './template/builders/testing.js'
import { templateTestStyles } from './template/styles/testing.js'
import { RandomVec2 } from './util/random.js'

const base = new Plane3(new Rect2(Vec2.ZERO, new Vec2(40, 3)), 0, new Rotation3(Quaternion.UP))
templateBuilderExport(templateTestBuilders.gridPrisms(RandomVec2.constant(2, 1), RandomVec2.constant(1, 0)), base, templateTestStyles.simple())


const base2 = new Plane3(new Rect2(Vec2.ZERO, new Vec2(8, 5)), 0)
templateBuilderExport(templateTestBuilders.borderPrism(), base2, templateTestStyles.simple())
*/