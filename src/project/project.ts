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
import { projectsDir } from "../util/paths.js"
import { OnMessage } from "./../connection/server.js"
import { DataPack } from "./../engineer/data-pack/data-pack.js"
import { StructureEngineer } from "./../engineer/structure/structure.js"
import { getArchitect, getProject } from "../instance.js"

/**
* @param identifier should be no.space.with.dots
*/
export type ProjectData = {
    identifier: string

    name: string
    authors: string
    description: string

    type: ProjectType
    builder: string | null
}

export class Project {

    readonly identifier: string

    name: string
    authors: string
    description: string

    readonly type: ProjectType

    dataPack: DataPack
    structures: Map<string, StructureEngineer> = new Map()

    constructor(data: ProjectData) {
        this.identifier = data.identifier
        this.name = data.name
        this.authors = data.authors
        this.description = data.description
        this.type = data.type
        this.dataPack = new DataPack(this.identifier, data.name)
    }

    async init(on: (progress: number) => void) {
        await this.dataPack.initChanneled(on)
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
            architect: getArchitect().clientData,
            type: project.type
        })
    })

    onMessage.set('init', async (data, client, id) => {
        await getProject(data.identifier).init((progress: any) => client.respond(id, progress))
        client.respond(id, '$close')
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