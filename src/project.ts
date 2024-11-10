//          _____
//      ___/     \___
//    |/  _.- _.-    \|
//   ||\\=_  '    _=//||
//   ||   \\\===///   ||
//   ||       |       ||
//   ||       |       ||
//   ||\___   |   ___/||
//         \__|__/
//
//      By Millenniar
//

import fs from "fs-extra"
import path from "path"
import { WsActions } from "./socket.js"
import { projectsDir } from "./paths.js"
import { Builder } from "./builder/builder.js"
import { DataPack } from "./builder/data-pack/data-pack.js"

/**
* @param identifier should be no.space.with.dots
*/
export type ProjectData = {
    identifier: string

    name: string
    authors: string
    description: string
    info: string

    architect: string

    type: ProjectType
    builder: string | null
}

export class Project {

    identifier: string

    name: string
    authors: string
    description: string
    info: string

    architect: string

    type: ProjectType
    builder: Builder | null
    dataPack: DataPack

    constructor(data: ProjectData) {
        this.identifier = data.identifier
        this.name = data.name
        this.authors = data.authors
        this.description = data.description
        this.info = data.info
        this.architect = data.architect
        this.type = data.type
        this.builder = null
        this.dataPack = new DataPack(data.identifier, data.name)
    }
}

export enum ProjectType {

    WORLD = 'world',
    STRUCTURE = 'structure',
    TERRAIN = 'terrain',
    BIOME = 'biome',
    DATA_PACK = 'data_pack'
}

export const projectSocketPaths: 
    Map<string, (project: Project, data: any, ws: WsActions) => void>
    = new Map([
        
        // File Manager

        ['file/read-text', (project, data, ws) => {
            const filePath = path.join(projectsDir, project.identifier, data.path)
            if(fs.existsSync(filePath)) {
                ws.respond(fs.readFileSync(filePath, 'utf8'))
            }
        }],
        ['file/read-json', (project, data, ws) => {
            const filePath = path.join(projectsDir, project.identifier, data.path)
            if(fs.existsSync(filePath)) {
                ws.respond(JSON.parse(fs.readFileSync(filePath, 'utf8')))
            }
        }],
        ['file/write-text', (project, data) => {
            fs.writeFileSync(path.join(projectsDir, project.identifier, data.path), data.data)
        }],
        ['file/write-json', (project, data) => {
            fs.writeFileSync(path.join(projectsDir, project.identifier, data.path), JSON.stringify(data.data))
        }],
        ['file/exists', (project, data, ws) => {
            ws.respond(fs.existsSync(path.join(projectsDir, project.identifier, data.path)))
        }],
        ['file/mkdirs', (project, data) => {
            fs.mkdirsSync(path.join(projectsDir, project.identifier, data.path))
        }],
        ['file/read-dir', (project, data, ws) => {
            ws.respond(fs.readdirSync(path.join(projectsDir, project.identifier, data.path), { recursive: data.recursive }))
        }],
        ['file/read-all-dir', (project, data, ws) => {
            const readDir = (dir: string, relDir: string): {} => {
                return fs.readdirSync(dir, { withFileTypes: true }).map((entry) => {
                    const relFilePath = path.join(relDir, entry.name)
                    return {
                        name: entry.name,
                        path: relFilePath,
                        children: entry.isDirectory() ? readDir(path.join(dir, entry.name), relFilePath) : undefined
                    }
                })
            }
            ws.respond(readDir(path.join(projectsDir, project.identifier, data.path), data.path))
        }],

        // Data Pack

        ['data-pack/structure', (project, data, ws) => {
            ws.respond(project.dataPack.getStructure(path.join(projectsDir, project.identifier, 'data_pack')))
        }],
    ])