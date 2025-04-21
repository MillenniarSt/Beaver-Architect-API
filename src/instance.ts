//             _____
//         ___/     \___        |  |
//      ##/  _.- _.-    \##  -  |  |                       -
//      ##\#=_  '    _=#/##  |  |  |  /---\  |      |      |   ===\  |  __
//      ##   \\#####//   ##  |  |  |  |___/  |===\  |===\  |   ___|  |==/
//      ##       |       ##  |  |  |  |      |   |  |   |  |  /   |  |
//      ##       |       ##  |  \= \= \====  |   |  |   |  |  \___/  |
//      ##\___   |   ___/
//      ##    \__|__/

import { commands } from './command/commands.js';
import { ConsoleCommander } from './command/console.js';
import type { PermissionLevel } from './connection/permission.js';
import { server } from './connection/server.js';
import { ArchitectSide, ServerSide } from './connection/sides.js';
import { Architect } from './project/architect.js';
import { Project } from './project/project.js';
import readline from 'readline';

// Server Side

export const SERVER_SIDE: ServerSide = new ServerSide()

// Commander

export const commander = new ConsoleCommander(
    readline.createInterface({
        input: process.stdin,
        output: process.stdout
    }),
    SERVER_SIDE,
    commands
)

// Users

export const users: Map<string, PermissionLevel> = new Map()

// Architect

let _architectSide: ArchitectSide | undefined

export function setArchitect(architect: ArchitectSide) {
    if (_architectSide === undefined) {
        _architectSide = architect
    } else {
        console.error('ArchitectSide already set')
    }
}

export function getArchitectSide(): ArchitectSide {
    return _architectSide!
}

export function getArchitect(): Architect {
    return _architectSide!.architect
}

// Project

let _project: Project | undefined

export function setMainProject(project: Project) {
    if (_project === undefined) {
        _project = project
        loadProject(project)
    } else {
        console.error('Project already set')
    }
}

let loadedProjects: Record<string, Project> = {}

export function loadProject(project: Project) {
    Object.defineProperty(loadedProjects, project.identifier, { value: project, writable: false })
}

export function getAllProjects(): Project[] {
    return Object.entries(loadedProjects).map(([id, project]) => project)
}

export function getProject(identifier?: string): Project {
    return identifier ? loadedProjects[identifier] : _project!
}

export function getProjectOrNull(identifier: string): Project | null {
    return loadedProjects[identifier]
}

let isShuttingDown = false

export async function close() {
    if (isShuttingDown) return
    isShuttingDown = true

    console.info('Closing Beaver Architect Server...')

    commander.close()
    if(_architectSide) {
        getArchitect().process.kill()
    }
    await server.close()

    process.exit()
}