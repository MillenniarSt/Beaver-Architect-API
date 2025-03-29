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
import { architectsDir, dir, librariesDir, projectsDir } from './util/paths.js'
import { registerStyleMessages } from './engineer/data-pack/style/messages.js'
import { type OnMessage, server, type ServerOnMessage } from './connection/server.js'
import { registerDirectorMessages } from './connection/director.js'
import { argv } from 'process'
import { commander, setArchitect } from './instance.js'
import { type ArchitectData, loadArchitect } from './project/architect.js'
import { registerEnStructureMessages } from './engineer/data-pack/structure/messages.js'
import { registerEditorMessages } from './engineer/editor.js'

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

const debug = console.debug
console.debug = (...args) => {
    debug('[     Server     ] | DEBUG |', ...args)
}

/**
 * Import all Builders here
 * so you make sure they are registered
 */
import './builder/surface/rect.js'
import './builder/surface/to-prism.js'
import './builder/object/prism/stack.js'
import './builder/object/prism/flex.js'
import { identifierToLabel, idToLabel, labelToId } from './util/form.js'
import { userInfo } from 'os'

const identifier = process.env.IDENTIFIER ?? `${labelToId(userInfo().username)}.project`
const port = process.env.PORT ? Number(process.env.PORT) : 8224
const isPublic = process.env.IS_PUBLIC === 'true'

if (!fs.existsSync(dir)) {
    console.info('Generating Beaver Architect default resources for the first launch...')
    fs.mkdirSync(dir)
    fs.mkdirSync(projectsDir)
    fs.mkdirSync(architectsDir)
    fs.mkdirSync(librariesDir)
}

console.info(`Starting local project Server '${identifier}' on port ${port} ${isPublic ? '[PUBLIC]' : ''}...`)

commander.open()

let projectData: ProjectData
let architectData: ArchitectData
if(fs.existsSync(path.join(projectsDir, identifier))) {
    projectData = JSON.parse(fs.readFileSync(path.join(projectsDir, identifier, 'project.json'), 'utf8'))
    architectData = JSON.parse(fs.readFileSync(path.join(projectsDir, identifier, 'architect.json'), 'utf8'))

    await Project.load(path.join(projectsDir, identifier), projectData)
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
    architectData = { identifier: 'minecraft', version: new Version('1.0.0').toJson(), name: 'Minecraft' }

    Project.create(projectData, architectData)
}

console.log(`Launching Architect ${architectData.name}...`)
const architect = await loadArchitect(architectData.identifier, projectData.identifier)
console.info(`Loaded Architect ${architect.name} [${architectData.identifier}]`)

setArchitect(architect)

const onServerMessage: ServerOnMessage = new Map()
registerProjectMessages(onServerMessage as OnMessage)
registerDirectorMessages(onServerMessage)
registerStyleMessages(onServerMessage)
registerEnStructureMessages(onServerMessage)
registerEditorMessages(onServerMessage)

const url = await server.open(port, isPublic, onServerMessage)
console.info(`Opened Project Server '${identifier}' on ${url ?? `port ${port}`}`)

import './command/commander.js'

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