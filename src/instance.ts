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
import { ArchitectSide, ServerSide } from './connection/sides.js';
import type { LocalUser, User } from './connection/user.js';
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

let _localUser: LocalUser | undefined
export const users: Map<string, User> = new Map()

export function setLocalUser(localUser: LocalUser) {
    if (_localUser === undefined) {
        _localUser = localUser
    } else {
        console.error('Local User already set')
    }
}

export function getLocalUser(): LocalUser {
    return _localUser!
}

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

export function getProject(identifier?: string): Project {
    return identifier ? loadedProjects[identifier] : _project!
}

export function getProjectOrNull(identifier: string): Project | null {
    return loadedProjects[identifier]
}

export function close() {
    commander.close()
    getArchitect().process.kill()
    process.exit()
}