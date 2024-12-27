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
import { projectsDir } from "./paths.js"
import { Builder } from "./builder/builder.js"
import { DataPack } from "./builder/data-pack/data-pack.js"
import { Architect } from "./connection/architect.js"
import { OnMessage, Server } from "./connection/server.js"

export let project: Project

export function setProject(pj: Project) {
    project = pj
    loadedProjects = Object.fromEntries([
        [pj.identifier, pj]
    ])
}

export let loadedProjects: Record<string, Project>

/**
* @param identifier should be no.space.with.dots
*/
export type ProjectData = {
    identifier: string

    name: string
    authors: string
    description: string

    architect: string

    type: ProjectType
    builder: string | null
}

export class Project {

    readonly identifier: string

    name: string
    authors: string
    description: string

    readonly architect: Architect

    readonly type: ProjectType
    builder: Builder | null
    dataPack: DataPack

    constructor(data: ProjectData, architect: Architect) {
        this.identifier = data.identifier
        this.name = data.name
        this.authors = data.authors
        this.description = data.description
        this.architect = architect
        this.type = data.type
        this.builder = null
        this.dataPack = new DataPack(this.identifier, data.name)
    }

    async init(on: (progress: number) => void) {
        await this.dataPack.initChanneled(on)
    }

    random(): number {
        return Math.random()
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
        client.respond(id, {
            identifier: project.identifier,
            name: project.name,
            authors: project.authors,
            description: project.description,
            architect: project.architect.clientData,
            type: project.type
        })
    })

    onMessage.set('init', async (data, client, id) => {
        await project.init((progress) => client.respond(id, progress))
        client.respond(id, '$close')
    })

    // File Manager

    onMessage.set('file/read-text', (data, client, id) => client.respond(id, project.readText(data.path)))
    onMessage.set('file/read-json', (data, client, id) => client.respond(id, project.read(data.path)))
    onMessage.set('file/write-text', (data) => project.writeText(data.path, data.data))
    onMessage.set('file/write-json', (data) => project.write(data.path, data.data))
    onMessage.set('file/exists', (data, client, id) => client.respond(id, project.exists(data.path)))
    onMessage.set('file/mkdir', (data) => project.mkDir(data.path))
    onMessage.set('file/read-dir', (data, client, id) => client.respond(id, project.readDir(data.path, data.recursive)))
    onMessage.set('file/map-dir', (data, client, id) => client.respond(id, project.mapDir(data.path)))
}