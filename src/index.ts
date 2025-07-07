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
import { getFreePort, type OnMessage, server, type ServerOnMessage } from './connection/server.js'
import { registerDirectorMessages } from './connection/director.js'
import { close, commander, getProject, setArchitect, users } from './instance.js'
import { type ArchitectData, loadArchitect } from './project/architect.js'
import { registerEnStructureMessages } from './engineer/data-pack/structure/messages.js'
import { identifierToLabel, labelToId } from './util/form.js'
import { userInfo } from 'os'

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

['SIGINT', 'SIGTERM', 'SIGHUP'].forEach((signal) => {
    process.on(signal, () => {
        console.info(`Signal '${signal}' received`)
        close()
    })
})

process.on('exit', (code) => {
    console.info(`Process exited with code: ${code}`)
    close()
})

process.on('uncaughtException', (err) => {
    console.error('Uncaught exception:\n', err)
    close()
})

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled rejection:\n', reason)
    close()
})

/**
 * Import all Builders here
 * so you make sure they are registered
 */
import { PermissionLevel } from './connection/permission.js'
import { registerStyleMessages } from './engineer/data-pack/style/messages.js'
import { registerComponentMessages } from './engineer/data-pack/component/messages.js'
import { GEO_FORMS, GEOS } from './register/geo.js'
import { boxes, registerRegisterMessages } from './register/register.js'
import { RANDOM_TYPES, RANDOMS } from './register/random.js'
import { BUILDERS } from './register/builder.js'
import { simpleFlatTerrain, simpleTpcGridTerrain, simpleGrid, simpleTpcFlatTerrain } from './template/testing.js'
import { templateTerrainCppExport } from './template/exporter.js'
import { registerSocketExporterMessages } from './exporter/socket.js'
import { templateTestTerrains } from './template/terrains/testing.js'

start()

// Testing Generation
   //.then(simpleGrid)
   //.then(() => templateTerrainCppExport(null as any))
   //.then(simpleFlatTerrain)
   .then(simpleTpcGridTerrain)

async function start() {
    /**
    * Server arguments
    */
    const port = process.argv[2] && process.argv[2] !== 'any' ? Number(process.argv[2]) : await getFreePort()
    const isPublic = process.argv[3] === 'true'
    const dir = process.env.DEV_ENV === 'true' ?
        path.join(path.dirname(__dirname), 'run') :
        process.argv[4]! ?? path.join(path.dirname(process.execPath), 'project')
    const architectExe = process.argv[5] ?? path.join(dir, 'architect', 'architect.exe')

    console.info(`Starting local project Server on port ${port}${isPublic ? ' [PUBLIC]' : ''} on '${dir}'...`)

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

        Project.load(dir, projectData)
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
        architectData = { identifier: 'minecraft', version: new Version('1.0.0').toJson(), name: 'Minecraft' }

        Project.create(dir, projectData, architectData)
    }

    Object.entries(getProject().readOrCreate('users.json', {})).map(([id, level]) => {
        users.set(id, PermissionLevel.fromJson(level))
    })

    /**
     * Initialization of Registers and their Registries
     */
    boxes['geo_forms'] = GEO_FORMS
    boxes['geos'] = GEOS
    boxes['randoms'] = RANDOMS
    boxes['random_types'] = RANDOM_TYPES
    boxes['builders'] = BUILDERS

    /**
     * Registration of all server messages and opening of the WebSocket server
     */
    const onServerMessage: ServerOnMessage = new Map()
    registerProjectMessages(onServerMessage as OnMessage)
    registerRegisterMessages(onServerMessage as OnMessage)
    registerDirectorMessages(onServerMessage)
    registerStyleMessages(onServerMessage)
    registerComponentMessages(onServerMessage)
    registerEnStructureMessages(onServerMessage)
    registerSocketExporterMessages(onServerMessage)

    const url = await server.open(port, isPublic, onServerMessage)
    console.info(`Opened Project Server '${getProject().identifier}' on ${url ?? `port ${port}`}`)

    /**
     * Launch architect installed on ./project$dir/architect/architect.exe
     * and wait its setup
     */
    console.log(`Launching Architect ${architectData.name}...`)
    const architectSide = await loadArchitect(architectData, projectData.identifier, architectExe)
    setArchitect(architectSide)
    console.info(`Loaded Architect ${architectSide.architect.name} [${architectData.identifier}]`)

    /**
     * Initialize Project and its Dependencies
     */
    await getProject().init()

    //getProject().write('terrains/test.json', templateTestTerrains.flat(16).toJson())

    console.log(`Started Project ${getProject().name} [${getProject().identifier}]`)
}