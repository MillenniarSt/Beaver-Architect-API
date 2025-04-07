//             _____
//         ___/     \___        |  |
//      ##/  _.- _.-    \##  -  |  |                       -
//      ##\#=_  '    _=#/##  |  |  |  /---\  |      |      |   ===\  |  __
//      ##   \\#####//   ##  |  |  |  |___/  |===\  |===\  |   ___|  |==/
//      ##       |       ##  |  |  |  |      |   |  |   |  |  /   |  |
//      ##       |       ##  |  \= \= \====  |   |  |   |  |  \___/  |
//      ##\___   |   ___/
//      ##    \__|__/

import fs from "fs"
import path from "path"
import { type MessageFunction, type OnMessage } from "./../connection/server.js"
import { DataPack } from "./../engineer/data-pack/data-pack.js"
import { getArchitect, getProject, getProjectOrNull, loadProject, setMainProject } from "../instance.js"
import { Structure } from "./structure.js"
import type { ArchitectData } from "./architect.js"
import { PERMISSIONS } from "../connection/permission.js"

/**
* @param identifier should be no.space.with.dots
*/
export type ProjectData = {
    identifier: string

    name: string
    authors: string
    description: string

    version: string,
    dependencies: {
        identifier: string,
        version: string
    }[]
}

export class Version {

    readonly v: number[]

    constructor(data: string) {
        this.v = data.split('.').map((v) => Number(v))
    }

    toJson(): string {
        return this.v.join('.')
    }
}

export class Project {

    protected _dataPack?: DataPack
    public structures!: Structure[]

    private constructor(
        readonly dir: string,
        readonly version: Version,
        readonly identifier: string,
        public name: string,
        public authors: string,
        public description: string,
        public dependencies: Project[]
    ) { }

    static async create(dir: string, data: ProjectData, architect: ArchitectData): Promise<Project> {
        const project = new Project(
            dir,
            new Version(data.version),
            data.identifier, data.name, data.authors, data.description, []
        )

        fs.mkdirSync(project.dir)
        fs.writeFileSync(path.join(project.dir, 'project.json'), JSON.stringify(project.toData()), 'utf-8')
        fs.writeFileSync(path.join(project.dir, 'info.html'), '', 'utf-8')
        fs.writeFileSync(path.join(project.dir, 'architect.json'), JSON.stringify(architect), 'utf-8')
        fs.mkdirSync(path.join(project.dir, 'dependences'))
        fs.mkdirSync(path.join(project.dir, 'architect'))
        fs.writeFileSync(path.join(project.dir, 'users.json'), JSON.stringify({}), 'utf-8')

        loadProject(project)
        setMainProject(project)
        project._dataPack = await DataPack.create(project.identifier)

        return project
    }

    static async load(dir: string, data: ProjectData, isMain: boolean = true): Promise<Project> {
        const loaded = getProjectOrNull(data.identifier)
        if (loaded) {
            return loaded
        }

        const dependencies: Project[] = []
        for (let i = 0; i < data.dependencies.length; i++) {
            const identifier = data.dependencies[i].identifier
            const version = new Version(data.dependencies[i].version)
            const dependeciesDir = path.join(dir, 'dependences', `${identifier}:${version.toJson()}`)
            if (!fs.existsSync(dependeciesDir)) {
                throw new Error(`Invalid dependency: ${identifier}:${version.toJson()} does not exists or it is not installed`)
            }
            dependencies.push(await Project.load(dependeciesDir, JSON.parse(fs.readFileSync(path.join(dependeciesDir, 'project.json'), 'utf-8')), false))
        }

        const project = new Project(
            dir,
            new Version(data.version),
            data.identifier, data.name, data.authors, data.description,
            dependencies
        )
        loadProject(project)
        if (isMain) {
            setMainProject(project)
        }
        await project.init()
        return project
    }

    private async init() {
        this._dataPack = await DataPack.load(this.identifier)
    }

    get dataPack(): DataPack {
        return this._dataPack!
    }

    toData(): ProjectData {
        return {
            identifier: this.identifier,

            name: this.name,
            authors: this.authors,
            description: this.description,

            version: this.version.toJson(),
            dependencies: [] // TODO
        }
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

    protected getAndCheckFilePath(relPath: string): string {
        const filePath = this.getFilePath(relPath)
        if (!fs.existsSync(filePath)) {
            throw new Error(`Can not read file, it does not exist [${filePath}]`)
        }
        return filePath
    }

    getFilePath(relPath: string): string {
        return path.join(this.dir, relPath)
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

    onMessage.set('file/read-text', ensureReadAll((project, path) => project.readText(path)))
    onMessage.set('file/read-json', ensureReadAll((project, path) => project.read(path)))
    onMessage.set('file/write-text', ensureWriteAll((project, path, data) => project.writeText(path, data)))
    onMessage.set('file/write-json', ensureWriteAll((project, path, data) => project.write(path, data)))
    onMessage.set('file/exists', ensureReadAll((project, path) => project.exists(path)))
    onMessage.set('file/mkdir', ensureWriteAll((project, path) => project.mkDir(path)))
    onMessage.set('file/read-dir', ensureReadAll((project, path, data) => project.readDir(path, data.recursive)))
    onMessage.set('file/map-dir', ensureReadAll((project, path) => project.mapDir(path)))
}

function ensureReadAll(read: (project: Project, path: string, data: any) => any): MessageFunction {
    return (data, client, id) => {
        const path: string = data.path.replace('/', '\\')
        switch(path.split('\\')[0]) {
            case 'datapack': client.ensurePermission(PERMISSIONS.ACCESS_DATAPACK); break;
            case 'architect': client.ensurePermission(PERMISSIONS.MANAGE_ARCHITECT_FILE); break;
            case 'dependences': client.ensurePermission(PERMISSIONS.ACCESS_DEPENDENCES); break;
            default: client.ensurePermission(PERMISSIONS.READ_ALL_FILE)
        }
        client.respond(id, read(getProject(data.identifier), path, data))
    }
}

function ensureWriteAll(write: (project: Project, path: string, data: any) => void): MessageFunction {
    return (data, client) => {
        const path: string = data.path.replace('/', '\\')
        switch(path.split('\\')[0]) {
            case 'datapack': client.ensurePermission(PERMISSIONS.ACCESS_DATAPACK); break;
            case 'architect': client.ensurePermission(PERMISSIONS.MANAGE_ARCHITECT_FILE); break;
            case 'dependences': client.ensurePermission(PERMISSIONS.MANAGE_DEPENDENCES); break;
            default: client.ensurePermission(PERMISSIONS.WRITE_ALL_FILE)
        }
        write(getProject(data.identifier), path, data.data)
    }
}