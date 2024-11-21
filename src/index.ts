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
import { OnMessage, openSocketServer } from "./server.js"
import { projectsDir } from './paths.js'
import { loadArchitect } from './architect.js'
import { registerSchematicMessages } from './builder/data-pack/schematic.js'
import { registerStyleMessages } from './builder/data-pack/style.js'

const log = console.log
console.log = (...args) => {
    log('[     Server     ] ', ...args)
}

console.log('Waiting data...')

process.on('message', async (message) => {
    const data = JSON.parse(message as string)
    
    console.log(`Starting local project Server '${data.identifier}' on port ${data.port}...`)

    const projectData: ProjectData = JSON.parse(fs.readFileSync(path.join(projectsDir, data.identifier, 'project.json'), 'utf8'))

    console.log(`Launching Architect ${projectData.architect}...`)
    const architect = await loadArchitect(projectData.architect, projectData.identifier)
    console.log(`Loaded Architect ${architect.name} [${projectData.architect}]`)

    setProject(new Project(projectData, architect))

    await architect.open()

    const onSocketMessage: OnMessage = new Map()
    registerProjectMessages(onSocketMessage)
    registerStyleMessages(onSocketMessage)
    registerSchematicMessages(onSocketMessage)

    openSocketServer(data.port, onSocketMessage)
    console.log(`Opened local project Server '${data.identifier}' on port ${data.port}`)

    process.send!('done')
})