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

import { FileNode, project } from "../../project.js"
import { AbstractBuilder, Builder, ReferenceData } from "../builder.js"
import { Schematic, SchematicReference } from "./schematic.js"
import { Style, StyleReference } from "./style/style.js"

export const loadedDataPacks = new Map<string, DataPack>()

export class DataPack extends AbstractBuilder {

    constructor(readonly pack: string, public name: string) {
        super()
    }

    builders: {
        schematics: Map<string, Schematic>
        styles: Map<string, Style>
    } = {
        schematics: new Map(),
        styles: new Map()
    }

    async init() {
        await this.initChanneled((i) => {})
    }

    async initChanneled(on: (progress: number) => void) {
        this.builders = {
            schematics: new Map(),
            styles: new Map()
        }

        this.builders.schematics = await this.loadBuilders<Schematic>(
            project.mapDir('data_pack\\schematics'),
            (ref) => Schematic.loadFromRef(new SchematicReference(ref))
        )
        on(1)
        this.builders.styles = await this.loadBuilders<Style>(
            project.mapDir('data_pack\\styles'),
            (ref) => Style.loadFromRef(new StyleReference(ref))
        )
        on(1)
    }

    protected async loadBuilders<B extends Builder>(fileNodes: FileNode[], load: (ref: ReferenceData) => B): Promise<Map<string, B>> {
        const map = new Map<string, B>()
        for(let i = 0; i < fileNodes.length; i++) {
            await this.loadBuilder(map, fileNodes[i], load, fileNodes[i].name)
        }
        return map
    }

    protected async loadBuilder<B extends Builder>(map: Map<string, B>, node: FileNode, load: (ref: ReferenceData) => B, location: string) {
        if(node.children === undefined) {
            location = location.substring(0, location.lastIndexOf('.'))
            const builder = load({ pack: this.pack, location: location })
            await builder.init()
            map.set(location, builder)
        } else {
            for(let i = 0; i < node.children.length; i++) {
                await this.loadBuilder(map, node.children[i], load, `${location}/${node.children[i].name}`)
            }
        }
    }
}