import { loadedProjects, project } from "../../project.js";
import { ServerOnMessage, WsServerActions } from "../../server.js";
import { Builder, ReferenceData, ResourceReference } from "../builder.js";
import { BasicMaterialPattern, Material, MaterialPattern, materialTypes } from "./materials.js";

export type StyleUpdate = {
    save?: boolean
    client?: {
        materials?: Material[]
        preview?: string[][][]
    },
    updates?: StyleUpdates
}

export type StyleUpdates = {
    isAbstract?: boolean
    implementations?: implementationUpdate[]
    patterns?: PatternUpdate[]
}

export type implementationUpdate = {
    data: {
        pack?: string,
        location: string
    },
    mode?: 'push' | 'delete'
}

export type PatternUpdate = {
    id: string,
    mode?: 'push' | 'delete',
    newId?: string,
    type?: string,
    materials?: boolean
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
    implementations: ResourceReference<Style>[]

    patterns: Map<string, MaterialPattern<any>>

    constructor(ref: ResourceReference<Style>, isAbstract: boolean = false, implementations: ResourceReference<Style>[] = [], patterns: Map<string, MaterialPattern<any>> = new Map()) {
        super(ref)
        this.patterns = patterns
        this.isAbstract = isAbstract
        this.implementations = implementations
    }

    get completePatterns(): [string, MaterialPattern<any>][] {
        let entries: [string, MaterialPattern<any>][] = []
        this.implementations.forEach((implementation) => {
            entries.push(...implementation.get().completePatterns)
        })
        entries.push(...Object.entries(this.patterns))
        return entries
    }

    edit(changes: { isAbstract?: boolean }): StyleUpdates {
        let updates: StyleUpdates = {}
        if (changes.isAbstract !== undefined) {
            this.isAbstract = changes.isAbstract
            updates.isAbstract = changes.isAbstract
        }
        return updates
    }

    containsImplementation(implementation: ResourceReference<Style>): boolean {
        if (implementation.equals(this.reference)) {
            return true
        }
        for (let i = 0; i < this.implementations.length; i++) {
            if (this.implementations[i].get().containsImplementation(this.implementations[i])) {
                return true
            }
        }
        return false
    }

    pushImplementation(implementation: ResourceReference<Style>): StyleUpdate {
        if (this.containsImplementation(implementation)) {
            console.warn(`Can not push implementation ${implementation}: it is already contained in ${this.reference.toString()}`)
            return {}
        } else {
            let updates: PatternUpdate[] = []
            implementation.get().patterns.forEach((pattern, id) => {
                if (!this.patterns.has(id)) {
                    updates.push(this.pushPattern(id, pattern))
                }
            })
            this.implementations.push(implementation)
            return {
                save: updates.length > 0,
                updates: {
                    implementations: [{
                        data: { pack: implementation.relativePack, location: implementation.location },
                        mode: 'push'
                    }],
                    patterns: updates
                }
            }
        }
    }

    deleteImplementation(implementation: ResourceReference<Style>): StyleUpdate {
        const index = this.implementations.findIndex((imp) => imp.equals(implementation))
        if (index >= 0) {
            this.implementations.splice(index, 1)
            let updates: PatternUpdate[] = []
            implementation.get().patterns.forEach((pattern, id) => {
                updates.push(this.deletePattern(id))
            })
            return {
                save: updates.length > 0,
                updates: {
                    implementations: [{
                        data: { pack: implementation.relativePack, location: implementation.location },
                        mode: 'delete'
                    }],
                    patterns: updates
                }
            }
        }
        console.warn(`Can not remove implementation ${implementation} that not exists in ${this.reference.toString()}`)
        return {}
    }

    pushPattern(id: string, pattern: MaterialPattern<any>): PatternUpdate {
        this.patterns.set(id, pattern)
        return {
            id: id,
            mode: 'push'
        }
    }

    editPattern(id: string, changes: { id?: string }): PatternUpdate {
        let update: PatternUpdate = {
            id: id
        }
        if (changes.id) {
            const pattern = this.patterns.get(id)!
            this.patterns.delete(id)
            this.patterns.set(changes.id, pattern)
            update.newId = changes.id
        }
        return update
    }

    deletePattern(id: string): PatternUpdate {
        this.patterns.delete(id)
        return {
            id: id,
            mode: 'delete'
        }
    }

    mapPatterns(map: (pattern: MaterialPattern<any>, id: string) => any): any[] {
        let patterns: any[] = []
        this.patterns.forEach((pattern, id) => patterns.push(map(pattern, id)))
        return patterns
    }

    static loadFromRef(ref: ResourceReference<Style>): Style {
        const data = project.read(ref.path)
        return new Style(ref,
            data.isAbstract,
            data.implementations.map((implementation: string) => new StyleReference(implementation)),
            new Map(data.patterns.map((pattern: any) => [pattern.id, materialTypes[pattern.type](pattern.data)]))
        )
    }

    toJson(): {} {
        return {
            isAbstract: this.isAbstract,
            implementations: this.implementations.map((implementation) => implementation.toJson()),
            patterns: this.mapPatterns((pattern, id) => {
                return {
                    id: id,
                    type: pattern.type,
                    data: pattern.dataJson()
                }
            })
        }
    }

    get reference(): ResourceReference<Style> {
        return this._reference as ResourceReference<Style>
    }
}

export function registerStyleMessages(onMessage: ServerOnMessage) {
    onMessage.set('data-pack/styles/create', (data, ws) => {
        const style = new Style(new StyleReference(data.ref), data.abstract ?? false)
        project.dataPack.builders.styles.set(style.reference.location, style)
        style.save()
        ws.respond()
    })

    onMessage.set('data-pack/styles/get', (data, ws) => ensureStyle(data.ref, ws, async (style) => {
        ws.respond({
            isAbstract: style.isAbstract,
            implementations: style.implementations.map((implementation) => {
                return { pack: implementation.relativePack, location: implementation.location }
            }),
            patterns: style.mapPatterns((pattern, id) => {
                return { id: id, type: pattern.type }
            })
        })
    }))

    onMessage.set('data-pack/styles/possible-implementations', (data, ws) => ensureStyle(data.ref, ws, async (style) => {
        let implementations: any[] = []
        project.dataPack.builders.styles.forEach((pStyle) => {
            if (!style.containsImplementation(pStyle.reference)) {
                if(data.research && !pStyle.reference.pack.includes(data.research) && !pStyle.reference.location.includes(data.research)) {
                    return
                }
                implementations.push({ pack: pStyle.reference.relativePack, location: pStyle.reference.location })
            }
        })
        ws.respond(implementations)
    }))

    onMessage.set('data-pack/styles/edit', (data, ws) => ensureStyle(data.ref, ws, async (style) => {
        return {
            save: true,
            updates: style.edit(data.changes)
        }
    }))
    onMessage.set('data-pack/styles/push-implementation', (data, ws) => ensureStyle(data.ref, ws, async (style) => {
        return style.pushImplementation(new StyleReference(data.implementation))
    }))
    onMessage.set('data-pack/styles/delete-implementation', (data, ws) => ensureStyle(data.ref, ws, async (style) => {
        return style.deleteImplementation(new StyleReference(data.implementation))
    }))

    onMessage.set('data-pack/styles/create-pattern', (data, ws) => ensureStyle(data.ref, ws, async (style) => {
        const pattern = new BasicMaterialPattern([])
        if (!style.isAbstract) {
            pattern.pushMaterial((await project.architect.connection.request('data-pack/materials/default')).id)
        }
        return {
            save: true,
            updates: {
                patterns: [style.pushPattern(data.id, pattern)]
            }
        }
    }))
    onMessage.set('data-pack/styles/edit-pattern', (data, ws) => ensureStyle(data.ref, ws, async (style) => {
        return {
            save: true,
            updates: {
                patterns: [style.editPattern(data.id, data.changes)]
            }
        }
    }))
    onMessage.set('data-pack/styles/delete-pattern', (data, ws) => ensureStyle(data.ref, ws, async (style) => {
        return {
            save: true,
            updates: {
                patterns: [style.deletePattern(data.id)]
            }
        }
    }))
    onMessage.set('data-pack/styles/get-pattern', (data, ws) => ensureStyle(data.ref, ws, async (style) => {
        const pattern = style.patterns.get(data.pattern)!
        return {
            client: {
                type: pattern.type,
                materials: pattern.materials
            }
        }
    }))

    onMessage.set('data-pack/styles/add-material', (data, ws) => ensureStyle(data.ref, ws, async (style) => {
        const pattern = style.patterns.get(data.pattern)!
        data.id = data.id ?? (await project.architect.connection.request('data-pack/materials/default')).id
        pattern.pushMaterial(data.id)
        return {
            save: true,
            updates: {
                patterns: [{
                    id: data.pattern,
                    materials: true
                }]
            }
        }
    }))
    onMessage.set('data-pack/styles/edit-material', (data, ws) => ensureStyle(data.ref, ws, async (style) => {
        const pattern = style.patterns.get(data.pattern)!
        pattern.editMaterial(data.index, data.changes)
        return {
            save: true,
            updates: {
                patterns: [{
                    id: data.pattern,
                    materials: true
                }]
            }
        }
    }))
    onMessage.set('data-pack/styles/delete-material', (data, ws) => ensureStyle(data.ref, ws, async (style) => {
        const pattern = style.patterns.get(data.pattern)!
        pattern.deleteMaterial(data.index)
        return {
            save: true,
            updates: {
                patterns: [{
                    id: data.pattern,
                    materials: true
                }]
            }
        }
    }))
}

async function ensureStyle(ref: ReferenceData, ws: WsServerActions, callback: (style: Style) => Promise<StyleUpdate> | Promise<void> | void) {
    const style = new StyleReference(ref).get()
    if (style) {
        const update = await callback(style)
        if (update) {
            if (update.save) {
                style.save()
            }
            if (update.client) {
                ws.send('data-pack/styles/update-client', { ref: ref, client: update.client })
            }
            if (update.updates) {
                ws.sendAll('data-pack/styles/update', { ref: ref, update: update.updates })
            }
        }
    } else {
        throw console.error(`Can not access to Style '${ref}', it not exists or it is not registered`)
    }
}