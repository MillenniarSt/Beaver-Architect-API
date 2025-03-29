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
import { librariesDir, projectsDir } from "../util/paths.js"
import { type OnMessage } from "./../connection/server.js"
import { DataPack } from "./../engineer/data-pack/data-pack.js"
import { getArchitect, getProject, getProjectOrNull, loadProject, setMainProject } from "../instance.js"
import { Structure } from "./structure.js"
import { StyleDependency } from "../engineer/data-pack/style/dependency.js"
import type { ArchitectData } from "./architect.js"

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
        public dependencies: Project[],
        protected _styleDependence: StyleDependency
    ) { }

    static create(data: ProjectData, architect: ArchitectData): Project {
        const project = new Project(
            path.join(projectsDir, data.identifier),
            new Version(data.version),
            data.identifier, data.name, data.authors, data.description, [],
            new StyleDependency([], [])
        )

        fs.mkdirSync(project.dir)
        fs.writeFileSync(path.join(project.dir, 'project.json'), JSON.stringify(project.toData()), 'utf-8')
        fs.writeFileSync(path.join(project.dir, 'info.html'), '', 'utf-8')
        fs.writeFileSync(path.join(project.dir, 'architect.json'), JSON.stringify(architect), 'utf-8')
        fs.mkdirSync(path.join(project.dir, 'dependeces'))
        fs.mkdirSync(path.join(project.dir, 'architect'))
        fs.mkdirSync(path.join(project.dir, 'data_pack'))
        fs.mkdirSync(path.join(project.dir, 'data_pack', 'structures'))
        fs.mkdirSync(path.join(project.dir, 'data_pack', 'styles'))
        fs.writeFileSync(path.join(project.dir, 'data_pack', 'style_dependence.json'), JSON.stringify(project.styleDependence.toJson()), 'utf-8')

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
            const dir = path.join(librariesDir, `${identifier}:${version.toJson()}`)
            if (!fs.existsSync(dir)) {
                throw new Error(`Invalid dependency: ${identifier}:${version.toJson()} does not exists or it is not installed`)
            }
            dependencies.push(await Project.load(dir, JSON.parse(fs.readFileSync(path.join(dir, 'project.json'), 'utf-8')), false))
        }

        const project = new Project(
            dir,
            new Version(data.version),
            data.identifier, data.name, data.authors, data.description,
            dependencies,
            StyleDependency.join(dependencies.map((dependency) => dependency.dataPack.styleDependence))
        )
        loadProject(project)
        if (isMain) {
            setMainProject(project)
        }
        await project.init()
        return project
    }

    private async init() {
        this._dataPack = await DataPack.create(this.identifier)
        this._styleDependence = StyleDependency.join([this.styleDependence, this.dataPack.styleDependence])
    }

    get dataPack(): DataPack {
        return this._dataPack!
    }

    get styleDependence(): StyleDependency {
        return this._styleDependence
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