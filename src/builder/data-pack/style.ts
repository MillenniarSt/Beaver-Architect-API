import { project } from "../../project.js";
import { OnMessage, WsActions } from "../../server.js";
import { Size3D } from "../../world/world3D.js";
import { Builder, ResourceReference } from "../builder.js";
import { DataTypes } from "./data-pack.js";

export type StyleUpdate = {
    save?: boolean
    client?: {
        patterns: {
            id: string,
            data: string[][][]
        }[]
    }
    updates?: {
        id: string,
        mode?: 'push' | 'delete',
        components?: MaterialComponent[],
        weight?: number
    }[]
}

export class Style extends Builder {

    materials: Record<string, Material<any>>

    constructor(pack: string, location: string, materials: Record<string, Material<any>>) {
        super(new ResourceReference(pack, DataTypes.SCHEMATICS, location))
        this.materials = materials
    }

    static fromRef(ref: ResourceReference<Style>): Style {
        const data = project.read(ref.path)
        return new Style(ref.pack, ref.location,
            Object.fromEntries(data.materials.map((material: any) => [material.id, materialTypes[material.type](material.data)]))
        )
    }

    jsonMaterials(): { id: string, data: {} }[] {
        return Object.entries(this.materials).map((entry) => {
            return {
                id: entry[0],
                data: entry[1].toJson()
            }
        })
    }

    toJson(): {} {
        return {
            materials: this.jsonMaterials()
        }
    }
}

export type MaterialComponent = {
    id: string,
    weight: number
}

export abstract class Material<M extends MaterialComponent> {

    abstract get type(): string

    constructor(
        public components: M[],
        public weight: number
    ) { }

    abstract generatePattern(size: Size3D): string[][][]

    toJson(): {} {
        return {
            type: this.type,
            components: this.components,
            weight: this.weight
        }
    }
}

export class BasicMaterial extends Material<MaterialComponent> {

    get type(): string {
        return 'basic'
    }

    static fromJson(json: any): BasicMaterial {
        return new BasicMaterial(json.components, json.weight)
    }

    generatePattern(size: Size3D): string[][][] {
        let pattern: string[][][] = []
        for (let x = 0; x < size.width; x++) {
            for (let y = 0; y < size.height; y++) {
                for (let z = 0; z < size.length; z++) {
                    pattern[x][y][z] = this.components[Math.floor(project.random() * this.components.length)].id
                }
            }
        }
        return pattern
    }
}

const materialTypes: Record<string, (json: any) => Material<any>> = {
    basic: BasicMaterial.fromJson
}

let opened: Map<string, Style> = new Map()

export function registerStyleMessages(onMessage: OnMessage) {
    onMessage.set('data-pack/styles/open', (data, ws) => {
        const ref = ResourceReference.fromString<Style>(data.ref, DataTypes.STYLES)
        let style = opened.get(ref.toJson())
        if (!style) {
            style = Style.fromRef(ref)
            opened.set(ref.toJson(), style)
        }

        ws.respond({
            materials: style.jsonMaterials()
        })
    })
    onMessage.set('data-pack/styles/close', (data) => {
        opened.delete(data.ref)
    })
}

async function ensureStyle(ref: string, ws: WsActions, callback: (style: Style) => Promise<StyleUpdate> | Promise<void> | void) {
    const style = opened.get(ref)
    if (style) {
        const updates = await callback(style)
        if (updates) {
            if (updates.save) {
                style.save()
            }
            if (updates.client) {
                ws.send('data-pack/schematics/update-client', { ref: ref, client: updates.client })
            }
            if (updates.updates) {
                ws.sendAll('data-pack/schematics/update', { ref: ref, updates: updates.updates })
            }
        }
    } else {
        throw new Error(`Can not access to Schematic '${ref}', it is not opened`)
    }
}