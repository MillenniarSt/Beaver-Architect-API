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
import { Project, ProjectData, registerProjectMessages } from "./project/project.js"
import { architectsDir, dir, librariesDir, projectsDir } from './util/paths.js'
import { registerStyleMessages } from './engineer/data-pack/style/messages.js'
import { OnMessage, server, ServerOnMessage } from './connection/server.js'
import { registerDirectorMessages } from './connection/director.js'
import { argv } from 'process'
import { setArchitect } from './instance.js'
import { ArchitectData, loadArchitect } from './project/architect.js'

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
import { Style, StyleReference } from './engineer/data-pack/style/style.js'
import { Material, MaterialReference } from './engineer/data-pack/style/material.js'
import { RandomList, RandomNumber, RandomVec2, Seed } from './util/random.js'
import { GridAxisAlignment, GridRectBuilder } from './builder/surface/rect.js'
import { SurfaceToPrismBuilder } from './builder/surface/to-prism.js'
import { StructureEngineer, StructureReference } from './engineer/structure/structure.js'
import { Structure } from './project/structure.js'
import { Rect2 } from './world/bi-geo/plane.js'
import { Vec2 } from './world/vector.js'
import { Plane3 } from './world/geo/surface.js'
import { Exporter } from './project/exporter.js'
import { NumberOption, ObjectOption, Vec2Option } from './util/option.js'
import { EmptyBuilder } from './builder/generic/empty.js'

const identifier = argv[3]
const port = argv[4] ? Number(argv[4]) : 8224
const isPublic = argv[3] === 'true'

if (!fs.existsSync(dir)) {
    console.info('Generating server resources for the first launch...')
    fs.mkdirSync(dir)
    fs.mkdirSync(projectsDir)
    fs.mkdirSync(architectsDir)
    fs.mkdirSync(librariesDir)
}

console.info(`Starting local project Server '${identifier}' on port ${port} ${isPublic ? '[PUBLIC]' : ''}...`)

const projectData: ProjectData = JSON.parse(fs.readFileSync(path.join(projectsDir, identifier, 'project.json'), 'utf8'))

await Project.create(path.join(projectsDir, identifier), projectData)

const architectData: ArchitectData = JSON.parse(fs.readFileSync(path.join(projectsDir, identifier, 'architect.json'), 'utf8'))

console.log(`Launching Architect ${architectData.name}...`)
const architect = await loadArchitect(architectData.identifier, projectData.identifier)
console.info(`Loaded Architect ${architect.name} [${architectData.identifier}]`)

setArchitect(architect)

const onServerMessage: ServerOnMessage = new Map()
registerProjectMessages(onServerMessage as OnMessage)
registerDirectorMessages(onServerMessage)
registerStyleMessages(onServerMessage)

const url = await server.open(port, isPublic, onServerMessage)
console.info(`Opened Project Server '${identifier}' on ${url ?? `port ${port}`}`)


// Builder + Exporter Testing

// Style

const style = new Style(new StyleReference('style-test'), false, [], new Map([
    ['base', new Material(new RandomList([{ id: 'minecraft:stone' }]), 'BaseMaterial')]
]))

// Structure

const builder = new GridRectBuilder(
    new SurfaceToPrismBuilder(
        new EmptyBuilder(new RandomList([MaterialReference.ref('base')])),
        {
            height: new NumberOption(new RandomNumber(2, 6))
        }
    ),
    {
        gap: new Vec2Option(RandomVec2.constant(1)),
        alignment: new ObjectOption(RandomList.constant([GridAxisAlignment.START, GridAxisAlignment.START]))
    }
)

const engineer = new StructureEngineer(new StructureReference('structure-test'), builder)

const structure = new Structure(new Plane3(new Rect2(Vec2.ZERO, new Vec2(11, 7)), 0), engineer)

// Export

const seed = new Seed()

const result = structure.build(style.toGenerationStyle(), seed)

const exporter = new Exporter(seed, result, style.toPostGenerationStyle())
exporter.exportToArchitect((data) => console.debug('Update', data))