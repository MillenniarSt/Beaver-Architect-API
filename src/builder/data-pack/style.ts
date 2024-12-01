import { loadedProjects, project } from "../../project.js";
import { OnMessage, WsActions } from "../../server.js";
import { Builder, ReferenceData, ResourceReference } from "../builder.js";
import { BasicMaterialPattern, Material, MaterialPattern, materialTypes } from "./materials.js";

export type StyleUpdate = {
    save?: boolean
    client?: {
        materials?: Material[]
        preview?: string[][][]
    }
    updates?: {
        id: string,
        mode?: 'push' | 'delete',
        newId?: string,
        materials?: boolean
    }[]
}

export class StyleReference extends ResourceReference<Style> {

    get folder(): string {
        return 'data_pack\\styles'
    }

    get(): Style {
        return loadedProjects[this.pack].dataPack.builders.styles.get(this.location)!
    }
}

export class Style extends Builder {

    isAbstract: boolean

    patterns: Record<string, MaterialPattern<any>>

    constructor(ref: ResourceReference<Style>, isAbstract: boolean = false, patterns: Record<string, MaterialPattern<any>> = {}) {
        super(ref)
        this.patterns = patterns
        this.isAbstract = isAbstract
    }

    static loadFromRef(ref: ResourceReference<Style>): Style {
        const data = project.read(ref.path)
        return new Style(ref,
            data.isAbstract,
            Object.fromEntries(data.patterns.map((pattern: any) => [pattern.id, materialTypes[pattern.type](pattern.data)]))
        )
    }

    toJson(): {} {
        return {
            isAbstract: this.isAbstract,
            patterns: Object.entries(this.patterns).map((entry) => {
                return {
                    id: entry[0], 
                    type: entry[1].type,
                    data: entry[1].dataJson()
                }
            })
        }
    }
}

export function registerStyleMessages(onMessage: OnMessage) {
    onMessage.set('data-pack/styles/create', (data, ws) => {
        new Style(new StyleReference(data.ref), data.abstract ?? false).save()
        ws.respond()
    })

    onMessage.set('data-pack/styles/get', (data, ws) => ensureStyle(data.ref, ws, async (style) => {
        ws.respond({
            patterns: Object.entries(style.patterns).map((entry) => {
                return { id: entry[0] }
            })
        })
    }))

    onMessage.set('data-pack/styles/create-pattern', (data, ws) => ensureStyle(data.ref, ws, async (style) => {
        const pattern = new BasicMaterialPattern([])
        if(!style.isAbstract) {
            pattern.pushMaterial((await project.architect.connection.request('data-pack/materials/default')).id)
        }
        style.patterns[data.id] = pattern
        return {
            save: true,
            updates: [{
                id: data.id,
                mode: 'push'
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
    onMessage.set('data-pack/styles/get-pattern', (data, ws) => ensureStyle(data.ref, ws, async (style) => {
        const pattern = style.patterns[data.pattern]
        return {
            client: {
                materials: pattern.materials
            }
        }
    }))

    onMessage.set('data-pack/styles/add-material', (data, ws) => ensureStyle(data.ref, ws, async (style) => {
        const pattern = style.patterns[data.pattern]
        if(pattern.pushMaterial(data.id)) {
            return {
                save: true,
                updates: [{
                    id: data.id,
                    materials: true
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
                materials: true
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
                materials: true
            }]
        }
    }))
}

async function ensureStyle(ref: ReferenceData, ws: WsActions, callback: (style: Style) => Promise<StyleUpdate> | Promise<void> | void) {
    const style = new StyleReference(ref).get()
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