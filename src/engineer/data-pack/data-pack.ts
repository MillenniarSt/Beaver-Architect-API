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

import { getProject } from "../../instance.js"
import { FileNode } from "../../project/project.js"
import { AbstractEngineer, Engineer, ReferenceData } from "../engineer.js"
import { Style, StyleReference } from "./style/style.js"

export const loadedDataPacks = new Map<string, DataPack>()

export class DataPack extends AbstractEngineer {

    constructor(readonly pack: string, public name: string) {
        super()
    }

    engineers: {
        styles: Map<string, Style>
    } = {
        styles: new Map()
    }

    async init() {
        await this.initChanneled((i) => {})
    }

    async initChanneled(on: (progress: number) => void) {
        this.engineers = {
            styles: new Map()
        }

        this.engineers.styles = await this.loadEngineers<Style>(
            getProject(this.pack).mapDir('data_pack\\styles'),
            (ref) => Style.loadFromRef(new StyleReference(ref))
        )
        on(1)
    }

    protected async loadEngineers<E extends Engineer>(fileNodes: FileNode[], load: (ref: ReferenceData) => E): Promise<Map<string, E>> {
        const map = new Map<string, E>()
        for(let i = 0; i < fileNodes.length; i++) {
            await this.loadEngineer(map, fileNodes[i], load, fileNodes[i].name)
        }
        return map
    }

    protected async loadEngineer<E extends Engineer>(map: Map<string, E>, node: FileNode, load: (ref: ReferenceData) => E, location: string) {
        if(node.children === undefined) {
            location = location.substring(0, location.lastIndexOf('.'))
            const engineer = load({ pack: this.pack, location: location })
            await engineer.init()
            map.set(location, engineer)
        } else {
            for(let i = 0; i < node.children.length; i++) {
                await this.loadEngineer(map, node.children[i], load, `${location}/${node.children[i].name}`)
            }
        }
    }
}