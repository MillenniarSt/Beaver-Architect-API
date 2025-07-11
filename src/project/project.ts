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
import type { JsonFormat } from "../util/util.js"
import { Terrain } from "./terrain.js"

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
    public terrains: Record<string, Terrain> = {}
    public structures: Structure[] = []

    private constructor(
        readonly dir: string,
        readonly version: Version,
        readonly identifier: string,
        public name: string,
        public authors: string,
        public description: string,
        public dependencies: Project[],
        public info: string
    ) { }

    /**
     * Generates new project with all his necessary resources
     */
    static async create(dir: string, data: ProjectData, architect: ArchitectData): Promise<Project> {
        const project = new Project(
            dir,
            new Version(data.version),
            data.identifier, data.name, data.authors, data.description, [], ''
        )

        fs.mkdirSync(project.dir)
        fs.writeFileSync(path.join(project.dir, 'project.json'), JSON.stringify(project.toData()), 'utf-8')
        fs.writeFileSync(path.join(project.dir, 'info.html'), '', 'utf-8')
        fs.writeFileSync(path.join(project.dir, 'architect.json'), JSON.stringify(architect), 'utf-8')
        fs.mkdirSync(path.join(project.dir, 'dependencies'))
        fs.mkdirSync(path.join(project.dir, 'architect'))
        fs.writeFileSync(path.join(project.dir, 'users.json'), JSON.stringify({}), 'utf-8')

        loadProject(project)
        setMainProject(project)

        return project
    }

    static load(dir: string, data: ProjectData, isMain: boolean = true): Project {
        const loaded = getProjectOrNull(data.identifier)
        if (loaded) {
            return loaded
        }

        if(!fs.existsSync(path.join(dir, 'dependencies'))) {
            fs.mkdirSync(path.join(dir, 'dependencies'))
        }
        const dependencies: Project[] = []
        for (let i = 0; i < data.dependencies.length; i++) {
            const identifier = data.dependencies[i].identifier
            const version = new Version(data.dependencies[i].version)
            const dependenciesDir = path.join(dir, 'dependencies', `${identifier}:${version.toJson()}`)
            if (!fs.existsSync(dependenciesDir)) {
                throw new Error(`Invalid dependency: ${identifier}:${version.toJson()} does not exists or it is not installed`)
            }
            dependencies.push(Project.load(dependenciesDir, JSON.parse(fs.readFileSync(path.join(dependenciesDir, 'project.json'), 'utf-8')), false))
        }

        let info: string
        if(fs.existsSync(path.join(dir, 'info.html'))) {
            info = fs.readFileSync(path.join(dir, 'info.html'), 'utf-8')
        } else {
            info = ''
            fs.writeFileSync(path.join(dir, 'info.html'), '', 'utf-8')
        }

        const project = new Project(
            dir,
            new Version(data.version),
            data.identifier, data.name, data.authors, data.description,
            dependencies,
            info
        )
        loadProject(project)
        if (isMain) {
            setMainProject(project)
        }
        return project
    }

    /**
     * Initializes the Project and load all his files
     */
    async init() {
        for(let i = 0; i < this.dependencies.length; i++) {
            await this.dependencies[i].init()
        }

        this._dataPack = await DataPack.load(this.identifier)

        this.ensureDir('terrains')
        let project = this
        function recursiveInitTerrain(file: FileNode) {
            if(file.children === undefined) {
                project.terrains[file.path.substring('terrains/'.length, file.path.lastIndexOf('.'))] = Terrain.fromJson(project.read(file.path))
            } else {
                file.children.forEach((child) => recursiveInitTerrain(child))
            }
        }
        this.mapDir('terrains').forEach((node) => recursiveInitTerrain(node))
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

    /**
     * Use this methods to read and write files instead of package fs
     */

    read(relPath: string): any {
        return JSON.parse(fs.readFileSync(this.getAndCheckFilePath(relPath), 'utf8'))
    }

    readText(relPath: string): string {
        return fs.readFileSync(this.getAndCheckFilePath(relPath), 'utf8')
    }

    readOrCreate(relPath: string, data: {}): any {
        if(this.exists(relPath)) {
            return this.read(relPath)
        }
        this.write(relPath, data)
        return data
    }

    write(relPath: string, json: JsonFormat) {
        const filePath = this.getFilePath(relPath)
        this.ensureDir(path.dirname(relPath))
        fs.writeFileSync(filePath, JSON.stringify(json))
    }

    writeText(relPath: string, text: string) {
        const filePath = this.getFilePath(relPath)
        this.ensureDir(path.dirname(relPath))
        fs.writeFileSync(filePath, text)
    }

    exists(relPath: string): boolean {
        return fs.existsSync(this.getFilePath(relPath))
    }

    ensureDir(relPath: string) {
        if(!this.exists(relPath)) {
            this.mkDir(relPath)
        }
    }

    mkDir(relPath: string) {
        fs.mkdirSync(this.getFilePath(relPath), { recursive: true })
    }

    readDir(relPath: string, recursive: boolean = false): string[] | Buffer[] {
        return fs.readdirSync(this.getAndCheckFilePath(relPath), { recursive: recursive })
    }

    mapDir(relPath: string): FileNode[] {
        return fs.readdirSync(this.getAndCheckFilePath(relPath), { withFileTypes: true }).map((entry) => {
            const filePath = path.join(relPath, entry.name)
            return {
                name: entry.name,
                path: filePath,
                children: entry.isDirectory() ? this.mapDir(filePath) : undefined
            }
        })
    }

    rename(relPath: string, newRelPath: string) {
        const newFilePath = this.getFilePath(newRelPath)
        this.ensureDir(path.dirname(newRelPath))
        fs.renameSync(this.getAndCheckFilePath(relPath), newFilePath)
    }

    cleanDir(relPath: string, baseDir: string = '') {
        if(relPath !== baseDir && this.readDir(relPath).length === 0) {
            this.removeDir(relPath)
            this.cleanDir(path.dirname(relPath))
        }
    }

    renameAndClean(relPath: string, newRelPath: string, baseDir?: string) {
        this.rename(relPath, newRelPath)
        this.cleanDir(path.dirname(relPath), baseDir)
    }

    remove(relPath: string) {
        fs.rmSync(this.getAndCheckFilePath(relPath))
    }

    removeAndClean(relPath: string, baseDir?: string) {
        this.remove(relPath)
        this.cleanDir(path.dirname(relPath), baseDir)
    }

    removeDir(relPath: string) {
        fs.rmdirSync(this.getAndCheckFilePath(relPath))
    }

    removeDirAndClean(relPath: string, baseDir?: string) {
        this.removeDir(relPath)
        this.cleanDir(path.dirname(relPath), baseDir)
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

export function registerProjectMessages(onMessage: OnMessage) {
    onMessage.set('get', (data, client, id) => {
        const project = getProject(data.identifier)
        client.respond(id, {
            identifier: project.identifier,
            version: project.version.toJson(),
            dependencies: project.dependencies.map((dependency) => dependency.identifier),
            name: project.name,
            authors: project.authors,
            description: project.description,
            info: project.info
        })
    })
    onMessage.set('get-architect', (data, client, id) => {
        client.respond(id, getArchitect().toJson())
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
            case 'dependences': client.ensurePermission(PERMISSIONS.ACCESS_DEPENDENCIES); break;
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
            case 'dependences': client.ensurePermission(PERMISSIONS.MANAGE_DEPENDENCIES); break;
            default: client.ensurePermission(PERMISSIONS.WRITE_ALL_FILE)
        }
        write(getProject(data.identifier), path, data.data)
    }
}