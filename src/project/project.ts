//             _____
//         ___/     \___        |  |
//      ##/  _.- _.-    \##  -  |  |                       -
//      ##\#=_  '    _=#/##  |  |  |  /---\  |      |      |   ===\  |  __
//      ##   \\#####//   ##  |  |  |  |___/  |===\  |===\  |   ___|  |==/
//      ##       |       ##  |  |  |  |      |   |  |   |  |  /   |  |
//      ##       |       ##  |  \= \= \====  |   |  |   |  |  \___/  |
//      ##\___   |   ___/
//      ##    \__|__/
//

import fs from "fs"
import path from "path"
import { librariesDir, projectsDir } from "../util/paths.js"
import { OnMessage } from "./../connection/server.js"
import { DataPack } from "./../engineer/data-pack/data-pack.js"
import { getArchitect, getProject, getProjectOrNull, loadProject } from "../instance.js"
import { Structure } from "./structure.js"
import { StyleDependence } from "../engineer/data-pack/style/dependence.js"

/**
* @param identifier should be no.space.with.dots
*/
export type ProjectData = {
    identifier: string

    name: string
    authors: string
    description: string

    dependencies: {
        identifier: string,
        version: string
    }[]
}

export class Project {

    private constructor(
        readonly dir: string,
        readonly identifier: string,
        public name: string,
        public authors: string,
        public description: string,
        public dependencies: Project[],
        public styleDependence: StyleDependence,
        public dataPack: DataPack,
        public structures: Structure[]
    ) { }

    static async init(dir: string, data: ProjectData): Promise<Project> {
        const loaded = getProjectOrNull(data.identifier)
        if(loaded) {
            return loaded
        }

        const dependencies: Project[] = []
        for(let i = 0; i < data.dependencies.length; i++) {
            const dir = path.join(librariesDir, `${data.dependencies[i].identifier}:${data.dependencies[i].version}`)
            if(!fs.existsSync(dir)) {
                throw new Error(`Invalid dependency: ${data.dependencies[i].identifier}:${data.dependencies[i].version} does not exists or it is not installed`)
            }
            dependencies.push(await Project.init(dir, JSON.parse(fs.readFileSync(path.join(dir, 'project.json'), 'utf-8'))))
        }
        const dataPack = await DataPack.init(data.identifier)
        
        const project = new Project(
            dir,
            data.identifier, data.name, data.authors, data.description,
            dependencies,
            StyleDependence.join([...dependencies.map((dependency) => dependency.dataPack.styleDependence), dataPack.styleDependence]),
            dataPack,
            []  // TODO
        )
        loadProject(project)
        return project
    }

    read(relPath: string): any {
        return JSON.parse(fs.readFileSync(this.getAndCheckFilePath(relPath), 'utf8'))
    }

    readText(relPath: string): string {
        return fs.readFileSync(this.getAndCheckFilePath(relPath), 'utf8')
    }

    write(relPath: string, json: {}) {
        fs.writeFileSync(this.getFilePath(relPath), JSON.stringify(json))
    }

    writeText(relPath: string, text: string) {
        fs.writeFileSync(this.getFilePath(relPath), text)
    }

    exists(relPath: string): boolean {
        return fs.existsSync(this.getFilePath(relPath))
    }

    mkDir(relPath: string) {
        fs.mkdirSync(this.getFilePath(relPath), { recursive: true })
    }

    readDir(relPath: string, recursive: boolean = false): string[] | Buffer[] {
        return fs.readdirSync(this.getAndCheckFilePath(relPath), { recursive: recursive })
    }

    mapDir(relPath: string, dir: string = this.getAndCheckFilePath(relPath)): FileNode[] {
        return fs.readdirSync(dir, { withFileTypes: true }).map((entry) => {
            const relFilePath = path.join(relPath, entry.name)
            return {
                name: entry.name,
                path: relFilePath,
                children: entry.isDirectory() ? this.mapDir(path.join(dir, entry.name), relFilePath) : undefined
            }
        })
    }

    getAndCheckFilePath(relPath: string): string {
        const filePath = this.getFilePath(relPath)
        if (!fs.existsSync(filePath)) {
            throw new Error(`Can not read file, it does not exist [${filePath}]`)
        }
        return filePath
    }

    getFilePath(relPath: string): string {
        return path.join(projectsDir, this.identifier, relPath)
    }
}

export type FileNode = { name: string, path: string, children?: FileNode[] }

export enum ProjectType {
    WORLD = 'world',
    STRUCTURE = 'structure',
    TERRAIN = 'terrain',
    BIOME = 'biome',
    DATA_PACK = 'data_pack'
}

export function registerProjectMessages(onMessage: OnMessage) {
    onMessage.set('get', (data, client, id) => {
        const project = getProject(data.identifier)
        client.respond(id, {
            identifier: project.identifier,
            name: project.name,
            authors: project.authors,
            description: project.description,
            architect: getArchitect().clientData
        })
    })

    // File Manager

    onMessage.set('file/read-text', (data, client, id) => client.respond(id, getProject(data.identifier).readText(data.path)))
    onMessage.set('file/read-json', (data, client, id) => client.respond(id, getProject(data.identifier).read(data.path)))
    onMessage.set('file/write-text', (data) => getProject(data.identifier).writeText(data.path, data.data))
    onMessage.set('file/write-json', (data) => getProject(data.identifier).write(data.path, data.data))
    onMessage.set('file/exists', (data, client, id) => client.respond(id, getProject(data.identifier).exists(data.path)))
    onMessage.set('file/mkdir', (data) => getProject(data.identifier).mkDir(data.path))
    onMessage.set('file/read-dir', (data, client, id) => client.respond(id, getProject(data.identifier).readDir(data.path, data.recursive)))
    onMessage.set('file/map-dir', (data, client, id) => client.respond(id, getProject(data.identifier).mapDir(data.path)))
}