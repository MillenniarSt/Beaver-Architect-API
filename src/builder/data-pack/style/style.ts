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

import { loadedProjects, project } from "../../../project.js";
import { Builder, ResourceReference } from "../../builder.js";
import { MaterialPattern, materialTypes, patternUpdate, PatternUpdate } from "./materials.js";
import { BuilderDirective, ListUpdate, ObjectUpdate, VarUpdate } from "../../../connection/directives/update.js";
import { ClientDirector } from "../../../connection/director.js";

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