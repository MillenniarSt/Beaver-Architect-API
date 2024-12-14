import { loadedProjects, project } from "../../project.js";
import { ServerOnMessage } from "../../connection/server.js";
import { Builder, ResourceReference } from "../builder.js";
import { BasicMaterialPattern, MaterialPattern, materialTypes } from "./materials.js";
import { BaseUpdate, BuilderDirective, ListUpdate, ObjectUpdate } from "../../connection/directives/update.js";
import { Director } from "../../connection/director.js";

export type StyleUpdate = {
    isAbstract?: BaseUpdate<boolean>
    implementations?: ListUpdate<{
        pack?: string,
        location: string
    }>
    patterns?: ListUpdate<{
        id?: string,
        type?: string,
        materials?: boolean
    }>
}

export class StyleReference extends ResourceReference<Style> {

    get folder(): string {
        return 'data_pack\\styles'
    }

    protected _get(): Style | undefined {
        return loadedProjects[this.pack].dataPack.builders.styles.get(this.location)
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

    edit(director: Director, changes: { isAbstract?: boolean }) {
        if (changes.isAbstract !== undefined) {
            this.isAbstract = changes.isAbstract
            this.update(director, { isAbstract: new BaseUpdate(changes.isAbstract) })
        }

        this.saveDirector(director)
    }

    pushImplementation(director: Director, implementation: ResourceReference<Style>) {
        if (this.containsImplementation(implementation)) {
            console.warn(`Can not push implementation ${implementation}: it is already contained in ${this.reference.toString()}`)
        } else if (implementation.get().containsImplementation(this.reference)) {
            console.warn(`Can not push implementation ${implementation}: it contains ${this.reference.toString()}`)
        } else {
            implementation.get().patterns.forEach((pattern, id) => {
                if (!this.patterns.has(id)) {
                    this.pushPattern(director, id, pattern)
                }
            })
            this.implementations.push(implementation)

            this.update(director, { implementations: new ListUpdate([{
                id: implementation.toString(),
                mode: 'push',
                data: { pack: implementation.relativePack, location: implementation.location }
            }]) })
            this.saveDirector(director)
        }
    }

    deleteImplementation(director: Director, implementation: ResourceReference<Style>) {
        const index = this.implementations.findIndex((imp) => imp.equals(implementation))
        if (index >= 0) {
            this.implementations.splice(index, 1)
            implementation.get().patterns.forEach((pattern, id) => {
                this.deletePattern(director, id)
            })
            
            this.update(director, { implementations: new ListUpdate([{
                id: implementation.toString(),
                mode: 'delete'
            }]) })
            this.saveDirector(director)
        }
        console.warn(`Can not remove implementation ${implementation} that not exists in ${this.reference.toString()}`)
    }

    pushPattern(director: Director, id: string, pattern: MaterialPattern<any>) {
        this.patterns.set(id, pattern)
        this.update(director, {
            patterns: new ListUpdate([{
                id: id,
                mode: 'push',
                data: {}
            }])
        })
        this.saveDirector(director)
    }

    editPattern(director: Director, id: string, changes: { id?: string }) {
        if (changes.id) {
            const pattern = this.patterns.get(id)!
            this.patterns.delete(id)
            this.patterns.set(changes.id, pattern)
            this.update(director, {
                patterns: new ListUpdate([{
                    id: id,
                    data: {
                        id: changes.id
                    }
                }])
            })
        }
        this.saveDirector(director)
    }

    deletePattern(director: Director, id: string) {
        this.patterns.delete(id)
        this.update(director, {
            patterns: new ListUpdate([{
                id: id,
                mode: 'delete'
            }])
        })
        this.saveDirector(director)
    }

    update(director: Director, update: StyleUpdate) {
        director.addDirective(BuilderDirective.update('data-pack/styles/update', this.reference, new ObjectUpdate(update)))
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
    onMessage.set('data-pack/styles/create', (data, client, id) => {
        const style = new Style(new StyleReference(data.ref), data.abstract ?? false)
        project.dataPack.builders.styles.set(style.reference.location, style)
        style.save()
        client.respond(id, {})
    })

    onMessage.set('data-pack/styles/get', (data, client, id) => {
        const style = new StyleReference(data.ref).get()
        client.respond(id, {
            isAbstract: style.isAbstract,
            implementations: style.implementations.map((implementation) => {
                return { pack: implementation.relativePack, location: implementation.location }
            }),
            patterns: style.mapPatterns((pattern, id) => {
                return { id: id, type: pattern.type }
            })
        })
    })

    onMessage.set('data-pack/styles/possible-implementations', (data, client, id) => {
        const style = new StyleReference(data.ref).get()

        let implementations: any[] = []
        project.dataPack.builders.styles.forEach((pStyle) => {
            if (!style.containsImplementation(pStyle.reference) && !pStyle.containsImplementation(style.reference)) {
                if (data.research && !pStyle.reference.pack.includes(data.research) && !pStyle.reference.location.includes(data.research)) {
                    return
                }
                implementations.push({ pack: pStyle.reference.relativePack, location: pStyle.reference.location })
            }
        })
        client.respond(id, implementations)
    })

    onMessage.set('data-pack/styles/edit', (data, client) => Director.execute(client, async (director) => {
        const style = new StyleReference(data.ref).get()
        style.edit(director, data.changes)
    }))
    onMessage.set('data-pack/styles/push-implementation', (data, client) => Director.execute(client, async (director) => {
        const style = new StyleReference(data.ref).get()
        return style.pushImplementation(director, new StyleReference(data.implementation))
    }))
    onMessage.set('data-pack/styles/delete-implementation', (data, client) => Director.execute(client, async (director) => {
        const style = new StyleReference(data.ref).get()
        return style.deleteImplementation(director, new StyleReference(data.implementation))
    }))

    onMessage.set('data-pack/styles/create-pattern', (data, client) => Director.execute(client, async (director) => {
        const style = new StyleReference(data.ref).get()
        const pattern = new BasicMaterialPattern([])
        if (!style.isAbstract) {
            pattern.pushMaterial((await project.architect.server.request('data-pack/materials/default')).id)
        }
        style.pushPattern(director, data.id, pattern)
    }))
    onMessage.set('data-pack/styles/edit-pattern', (data, client) => Director.execute(client, async (director) => {
        const style = new StyleReference(data.ref).get()
        style.editPattern(director, data.id, data.changes)
    }))
    onMessage.set('data-pack/styles/delete-pattern', (data, client) => Director.execute(client, async (director) => {
        const style = new StyleReference(data.ref).get()
        style.deletePattern(director, data.id)
    }))
    onMessage.set('data-pack/styles/get-pattern', (data, client, id) => {
        const style = new StyleReference(data.ref).get()
        const pattern = style.patterns.get(data.pattern)!
        client.respond(id, {
            type: pattern.type,
            materials: pattern.materials
        })
    })

    onMessage.set('data-pack/styles/add-material', (data, client) => Director.execute(client, async (director) => {
        const style = new StyleReference(data.ref).get()
        const pattern = style.patterns.get(data.pattern)!
        data.id = data.id ?? (await project.architect.server.request('data-pack/materials/default')).id
        pattern.pushMaterial(data.id)
        style.update(director, {
            patterns: new ListUpdate([{
                id: data.pattern,
                data: { materials: true }
            }])
        })
        style.saveDirector(director)
    }))
    onMessage.set('data-pack/styles/edit-material', (data, client) => Director.execute(client, async (director) => {
        const style = new StyleReference(data.ref).get()
        const pattern = style.patterns.get(data.pattern)!
        pattern.editMaterial(data.index, data.changes)
        style.update(director, {
            patterns: new ListUpdate([{
                id: data.pattern,
                data: { materials: true }
            }])
        })
        style.saveDirector(director)
    }))
    onMessage.set('data-pack/styles/delete-material', (data, client) => Director.execute(client, async (director) => {
        const style = new StyleReference(data.ref).get()
        const pattern = style.patterns.get(data.pattern)!
        pattern.deleteMaterial(data.index)
        style.update(director, {
            patterns: new ListUpdate([{
                id: data.pattern,
                data: { materials: true }
            }])
        })
        style.saveDirector(director)
    }))
}