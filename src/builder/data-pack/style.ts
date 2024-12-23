import { loadedProjects, project } from "../../project.js";
import { ServerOnMessage } from "../../connection/server.js";
import { Builder, ResourceReference } from "../builder.js";
import { BasicMaterialPattern, MaterialPattern, materialTypes, patternUpdate, PatternUpdate } from "./materials.js";
import { BuilderDirective, ListUpdate, ObjectUpdate, VarUpdate } from "../../connection/directives/update.js";
import { ClientDirector } from "../../connection/director.js";
import { Size3D } from "../../world/world3D.js";

export type StyleUpdate = {
    isAbstract?: boolean
    implementations?: {
        id: string,
        mode?: 'push' | 'delete',
        data?: {
            pack?: string,
            location: string
        }
    }[]
    patterns?: {
        id: string,
        mode?: 'push' | 'delete',
        data?: PatternUpdate
    }[]
}

export const styleUpdate = new ObjectUpdate<StyleUpdate>({
    isAbstract: new VarUpdate<boolean>(),
    implementations: new ListUpdate(new VarUpdate<{
        pack?: string,
        location: string
    }>()),
    patterns: new ListUpdate(patternUpdate)
})

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

    implementationsOfPattern(id: string, includeSelf: boolean = false): ResourceReference<Style>[] {
        let implementations: ResourceReference<Style>[] = []
        if (this.patterns.has(id) && includeSelf) {
            implementations.push(this.reference)
        }
        this.implementations.forEach((implementation) => implementations.push(...implementation.get().implementationsOfPattern(id, true)))
        return implementations
    }

    edit(director: ClientDirector, changes: { isAbstract?: boolean }) {
        if (changes.isAbstract !== undefined) {
            this.isAbstract = changes.isAbstract
            this.update(director, { isAbstract: changes.isAbstract })
        }

        this.saveDirector(director)
    }

    undoChanges(changes: { isAbstract?: boolean }): { isAbstract?: boolean } {
        const undoChanges: { isAbstract?: boolean } = {}
        if (changes.isAbstract) undoChanges.isAbstract = this.isAbstract
        return undoChanges
    }

    pushImplementation(director: ClientDirector, implementation: ResourceReference<Style>) {
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

            this.update(director, {
                implementations: [{
                    id: implementation.toString(),
                    mode: 'push',
                    data: { pack: implementation.relativePack, location: implementation.location }
                }]
            })
            this.saveDirector(director)
        }
    }

    deleteImplementation(director: ClientDirector, implementation: ResourceReference<Style>) {
        const index = this.implementations.findIndex((imp) => imp.equals(implementation))
        if (index >= 0) {
            this.implementations.splice(index, 1)
            implementation.get().patterns.forEach((pattern, id) => {
                if (this.implementationsOfPattern(id).length === 1) {
                    this.deletePattern(director, id)
                } else {
                    this.update(director, {
                        patterns: [{
                            id: id,
                            data: {
                                fromImplementations: this.implementationsOfPattern(id).map((ref) => ref.toString())
                            }
                        }]
                    })
                }
            })

            this.update(director, {
                implementations: [{
                    id: implementation.toString(),
                    mode: 'delete'
                }]
            })
            this.saveDirector(director)
        } else {
            console.warn(`Can not remove implementation ${implementation} that not exists in ${this.reference.toString()}`)
        }
    }

    getPattern(id: string): MaterialPattern<any> {
        const pattern = this.patterns.get(id)
        if (!pattern) {
            throw new Error(`Can not find pattern with id ${id}, it not exists in ${this.reference.toString()}`)
        }
        return pattern
    }

    pushPattern(director: ClientDirector, id: string, pattern: MaterialPattern<any>) {
        if (this.patterns.has(id)) {
            console.warn(`Can not push pattern with id ${id}, it already exists in ${this.reference.toString()}`)
        } else {
            this.patterns.set(id, pattern)
            this.update(director, {
                patterns: [{
                    id: id,
                    mode: 'push',
                    data: {
                        type: pattern.type,
                        fromImplementations: this.implementationsOfPattern(id).map((ref) => ref.toString())
                    }
                }]
            })
            this.saveDirector(director)
        }
    }

    editPattern(director: ClientDirector, id: string, changes: { id?: string }) {
        const pattern = this.patterns.get(id)
        if (pattern) {
            if (changes.id) {
                this.patterns.delete(id)
                this.patterns.set(changes.id, pattern)
                this.update(director, {
                    patterns: [{
                        id: id,
                        data: {
                            id: changes.id
                        }
                    }]
                })
            }
            this.saveDirector(director)
        } else {
            console.warn(`Can not edit pattern with id ${id}, it not exists in ${this.reference.toString()}`)
        }
    }

    deletePattern(director: ClientDirector, id: string) {
        if (this.patterns.has(id)) {
            this.patterns.delete(id)
            this.update(director, {
                patterns: [{
                    id: id,
                    mode: 'delete'
                }]
            })
            this.saveDirector(director)
        } else {
            console.warn(`Can not delete pattern with id ${id}, it not exists in ${this.reference.toString()}`)
        }
    }

    patternUndoChanges(id: string, changes: { id?: string }): { id?: string } {
        const undoChanges: { id?: string } = {}
        if (changes.id) undoChanges.id = id
        return undoChanges
    }

    updateMaterial(director: ClientDirector, pattern: string) {
        this.update(director, {
            patterns: [{
                id: pattern,
                data: { materials: true }
            }]
        })
        this.saveDirector(director)
    }

    update(director: ClientDirector, update: StyleUpdate) {
        director.addDirective(BuilderDirective.update('data-pack/styles/update', this.reference, styleUpdate, update))
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
                return { id: id, type: pattern.type, fromImplementations: style.implementationsOfPattern(id).map((ref) => ref.toString()) }
            })
        })
    })
    onMessage.set('data-pack/styles/generate-pattern', (data, client, id) => {
        const style = new StyleReference(data.ref).get()
        client.respond(id, style.getPattern(data.pattern).generate(Size3D.fromJson(data.size)))
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

    onMessage.set('data-pack/styles/edit', (data, client) => {
        const style = new StyleReference(data.ref).get()
        const undoChanges = style.undoChanges(data.changes)
        ClientDirector.execute(client,
            async (director) => style.edit(director, data.changes),
            async (director) => style.edit(director, undoChanges)
        )
    })
    onMessage.set('data-pack/styles/push-implementation', (data, client) => {
        const style = new StyleReference(data.ref).get()
        ClientDirector.execute(client,
            async (director) => style.pushImplementation(director, new StyleReference(data.implementation)),
            async (director) => style.deleteImplementation(director, new StyleReference(data.implementation))
        )
    })
    onMessage.set('data-pack/styles/delete-implementation', (data, client) => {
        const style = new StyleReference(data.ref).get()
        ClientDirector.execute(client,
            async (director) => style.deleteImplementation(director, new StyleReference(data.implementation)),
            async (director) => style.pushImplementation(director, new StyleReference(data.implementation))
        )
    })

    onMessage.set('data-pack/styles/create-pattern', (data, client) => {
        const style = new StyleReference(data.ref).get()
        ClientDirector.execute(client,
            async (director) => {
                const pattern = new BasicMaterialPattern([])
                if (!style.isAbstract) {
                    pattern.pushMaterial((await project.architect.server.request('data-pack/materials/default')).id)
                }
                style.pushPattern(director, data.id, pattern)
            },
            async (director) => style.deletePattern(director, data.id)
        )
    })
    onMessage.set('data-pack/styles/edit-pattern', (data, client) => {
        const style = new StyleReference(data.ref).get()
        const undoChanges = style.patternUndoChanges(data.id, data.changes)
        ClientDirector.execute(client,
            async (director) => style.editPattern(director, data.id, data.changes),
            async (director) => style.editPattern(director, data.id, undoChanges)
        )
    })
    onMessage.set('data-pack/styles/delete-pattern', (data, client) => {
        const style = new StyleReference(data.ref).get()
        const pattern = style.getPattern(data.id)
        ClientDirector.execute(client,
            async (director) => style.deletePattern(director, data.id),
            async (director) => style.pushPattern(director, data.id, pattern)
        )
    })
    onMessage.set('data-pack/styles/get-pattern', (data, client, id) => {
        const style = new StyleReference(data.ref).get()
        const pattern = style.getPattern(data.id)
        client.respond(id, {
            type: pattern.type,
            materials: pattern.materials
        })
    })

    onMessage.set('data-pack/styles/add-material', async (data, client) => {
        const style = new StyleReference(data.ref).get()
        const pattern = style.getPattern(data.pattern)
        data.id = data.id ?? (await project.architect.server.request('data-pack/materials/default')).id
        ClientDirector.execute(client,
            async (director) => {
                pattern.pushMaterial(data.id)
                style.updateMaterial(director, data.pattern)
            },
            async (director) => {
                pattern.deleteMaterial(pattern.materials.findIndex((material) => material.id === data.id))
                style.updateMaterial(director, data.pattern)
            }
        )
    })
    onMessage.set('data-pack/styles/edit-material', (data, client) => {
        const style = new StyleReference(data.ref).get()
        const pattern = style.getPattern(data.pattern)
        const material = pattern.copyMaterial(data.index)
        ClientDirector.execute(client,
            async (director) => {
                pattern.editMaterial(data.index, data.changes)
                style.updateMaterial(director, data.pattern)
            },
            async (director) => {
                pattern.materials[data.index] = material
                style.updateMaterial(director, data.pattern)
            }
        )
    })
    onMessage.set('data-pack/styles/delete-material', (data, client) => {
        const style = new StyleReference(data.ref).get()
        const pattern = style.getPattern(data.pattern)
        const material = pattern.materials[data.index]
        ClientDirector.execute(client,
            async (director) => {
                pattern.deleteMaterial(data.index)
                style.updateMaterial(director, data.pattern)
            },
            async (director) => {
                pattern.materials.push(material)
                style.updateMaterial(director, data.pattern)
            }
        )
    })
}