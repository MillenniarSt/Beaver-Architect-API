//             _____
//         ___/     \___        |  |
//      ##/  _.- _.-    \##  -  |  |                       -
//      ##\#=_  '    _=#/##  |  |  |  /---\  |      |      |   ===\  |  __
//      ##   \\#####//   ##  |  |  |  |___/  |===\  |===\  |   ___|  |==/
//      ##       |       ##  |  |  |  |      |   |  |   |  |  /   |  |
//      ##       |       ##  |  \= \= \====  |   |  |   |  |  \___/  |
//      ##\___   |   ___/
//      ##    \__|__/

import path from "path"
import { getProject } from "../../instance.js"
import { type FileNode } from "../../project/project.js"
import { Engineer, type ReferenceData } from "../engineer.js"
import { StructureEngineer, StructureReference } from "./structure/structure.js"
import { Style, StyleReference } from "./style/style.js"
import { Component, ComponentReference } from "./component/component.js"

export const loadedDataPacks = new Map<string, DataPack>()

export class DataPack {

    constructor(
        readonly styles: Map<string, Style>,
        readonly components: Map<string, Component>,
        readonly structures: Map<string, StructureEngineer>
    ) { }

    static async create(pack: string): Promise<DataPack> {
        const project = getProject(pack)
        
        project.mkDir(path.join('data_pack', 'styles'))
        project.mkDir(path.join('data_pack', 'components'))
        project.mkDir(path.join('data_pack', 'structures'))
        return await DataPack.load(pack)
    }

    static async load(pack: string): Promise<DataPack> {
        return new DataPack(
            await this.loadEngineers<Style>(pack,
                getProject(pack).mapDir(path.join('data_pack', 'styles')),
                (ref) => Style.loadFromRef(new StyleReference(ref))
            ),
            await this.loadEngineers<Component>(pack,
                getProject(pack).mapDir(path.join('data_pack', 'components')),
                (ref) => Component.loadFromRef(new ComponentReference(ref))
            ),
            await this.loadEngineers<StructureEngineer>(pack,
                getProject(pack).mapDir(path.join('data_pack', 'structures')),
                (ref) => StructureEngineer.loadFromRef(new StructureReference(ref))
            )
        )
    }

    protected static async loadEngineers<E extends Engineer>(pack: string, fileNodes: FileNode[], load: (ref: ReferenceData) => E): Promise<Map<string, E>> {
        const map = new Map<string, E>()
        for (let i = 0; i < fileNodes.length; i++) {
            await this.loadEngineer(pack, map, fileNodes[i], load, fileNodes[i].name)
        }
        return map
    }

    protected static async loadEngineer<E extends Engineer>(pack: string, map: Map<string, E>, node: FileNode, load: (ref: ReferenceData) => E, location: string) {
        if (node.children === undefined) {
            location = location.substring(0, location.lastIndexOf('.'))
            const engineer = load({ pack: pack, location: location })
            await engineer.init()
            map.set(location, engineer)
        } else {
            for (let i = 0; i < node.children.length; i++) {
                await this.loadEngineer(pack, map, node.children[i], load, `${location}/${node.children[i].name}`)
            }
        }
    }
}