import { Architect } from './project/architect.js';
import { Project } from './project/project.js';

// Architect

let _architect: Architect | undefined

export function setArchitect(architect: Architect) {
    if(_architect === undefined) {
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

export function setProject(project: Project) {
    if(_project === undefined) {
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