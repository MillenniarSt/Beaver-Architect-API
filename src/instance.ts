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
import { Permission, PermissionLevel } from './connection/permission.js';
import { ServerSide } from './connection/sides.js';
import { Architect } from './project/architect.js';
import { Project } from './project/project.js';
import readline from 'readline';

// Server Side

const serverSide: ServerSide = new ServerSide(new PermissionLevel(Permission.owner()))

// Commander

export const commander = new ConsoleCommander(
    readline.createInterface({
        input: process.stdin,
        output: process.stdout
    }),
    serverSide,
    commands
)

// Architect

let _architect: Architect | undefined

export function setArchitect(architect: Architect) {
    if (_architect === undefined) {
        _architect = architect
    } else {
        console.error('Architect already set')
    }
}

export function getArchitect(): Architect {
    return _architect!
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