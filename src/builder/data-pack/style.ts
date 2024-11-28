import { project } from "../../project.js";
import { OnMessage, WsActions } from "../../server.js";
import { Size3D } from "../../world/world3D.js";
import { Builder, ResourceReference } from "../builder.js";
import { DataTypes } from "./data-pack.js";
import { BasicMaterialPattern, Material, MaterialPattern, materialTypes } from "./materials.js";

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
        materials?: Material[]
    }[]
}

export class Style extends Builder {

    isAbstract: boolean

    patterns: Record<string, MaterialPattern<any>>

    constructor(pack: string, location: string, isAbstract: boolean = false, patterns: Record<string, MaterialPattern<any>> = {}) {
        super(new ResourceReference(pack, DataTypes.STYLES, location))
        this.patterns = patterns
        this.isAbstract = isAbstract
    }

    static fromRef(ref: ResourceReference<Style>): Style {
        const data = project.read(ref.path)
        return new Style(ref.pack, ref.location,
            data.isAbstract,
            Object.fromEntries(data.patterns.map((material: any) => [material.id, materialTypes[material.type](material.data)]))
        )
    }

    jsonPatterns(): { id: string, materials: Material[] }[] {
        return Object.entries(this.patterns).map((entry) => {
            return {
                id: entry[0],
                materials: entry[1].materials
            }
        })
    }

    toJson(): {} {
        return {
            isAbstract: this.isAbstract,
            patterns: this.jsonPatterns()
        }
    }
}

let opened: Map<string, Style> = new Map()

export function registerStyleMessages(onMessage: OnMessage) {
    onMessage.set('data-pack/styles/create', (data, ws) => {
        new Style(project.identifier, data.ref).save()
        ws.respond()
    })
    onMessage.set('data-pack/styles/open', (data, ws) => {
        const ref = ResourceReference.fromString<Style>(data.ref, DataTypes.STYLES)
        let style = opened.get(ref.toJson())
        if (!style) {
            style = Style.fromRef(ref)
            opened.set(ref.toJson(), style)
        }

        console.log({
            patterns: style.jsonPatterns()
        })
        ws.respond({
            patterns: style.jsonPatterns()
        })
    })
    onMessage.set('data-pack/styles/close', (data) => {
        opened.delete(data.ref)
    })

    onMessage.set('data-pack/styles/create-pattern', (data, ws) => ensureStyle(data.ref, ws, async (style) => {
        const pattern = new BasicMaterialPattern([])
        if(!style.isAbstract) {
            pattern.pushMaterial(await project.architect.connection.request('data-pack/materials/default'))
        }
        style.patterns[data.id] = pattern
        return {
            save: true,
            updates: [{
                id: data.id,
                mode: 'push',
                materials: pattern.materials
            }]
        }
    }))
    onMessage.set('data-pack/styles/add-material', (data, ws) => ensureStyle(data.ref, ws, async (style) => {
        const pattern = style.patterns[data.pattern]
        if(pattern.pushMaterial(data.id)) {
            return {
                save: true,
                updates: [{
                    id: data.id,
                    materials: pattern.materials
                }]
            }
        }
        return {}
    }))
    onMessage.set('data-pack/styles/edit-material', (data, ws) => ensureStyle(data.ref, ws, async (style) => {
        const pattern = style.patterns[data.pattern]
        pattern.editMaterial(data.id, data.changes)
        return {
            save: true,
            updates: [{
                id: data.id,
                materials: pattern.materials
            }]
        }
    }))
    onMessage.set('data-pack/styles/delete-material', (data, ws) => ensureStyle(data.ref, ws, async (style) => {
        const pattern = style.patterns[data.pattern]
        pattern.deleteMaterial(data.id)
        return {
            save: true,
            updates: [{
                id: data.id,
                materials: pattern.materials
            }]
        }
    }))
    onMessage.set('data-pack/styles/delete-pattern', (data, ws) => ensureStyle(data.ref, ws, async (style) => {
        delete style.patterns[data.id]
        return {
            save: true,
            updates: [{
                id: data.id,
                mode: 'delete'
            }]
        }
    }))
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
                ws.send('data-pack/styles/update-client', { ref: ref, client: updates.client })
            }
            if (updates.updates) {
                ws.sendAll('data-pack/styles/update', { ref: ref, updates: updates.updates })
            }
        }
    } else {
        throw new Error(`Can not access to Schematic '${ref}', it is not opened`)
    }
}