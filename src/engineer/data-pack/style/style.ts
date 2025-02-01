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

import { Material, materialUpdate, MaterialUpdate } from "./material.js";
import { BuilderDirective, ListUpdate, ObjectUpdate, VarUpdate } from "../../../connection/directives/update.js";
import { ClientDirector } from "../../../connection/director.js";
import { Engineer, ResourceReference } from "../../engineer.js";
import { getProject } from "../../../instance.js";

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
    materials?: {
        id: string,
        mode?: 'push' | 'delete',
        data?: MaterialUpdate
    }[]
}

export const styleUpdate = new ObjectUpdate<StyleUpdate>({
    isAbstract: new VarUpdate<boolean>(),
    implementations: new ListUpdate(new VarUpdate<{
        pack?: string,
        location: string
    }>()),
    materials: new ListUpdate(materialUpdate)
})

export class StyleReference extends ResourceReference<Style> {

    get folder(): string {
        return 'data_pack\\styles'
    }

    protected _get(): Style | undefined {
        return getProject(this.pack).dataPack.engineers.styles.get(this.location)
    }
}

export class Style extends Engineer {

    isAbstract: boolean
    implementations: ResourceReference<Style>[]

    materials: Map<string, Material>

    constructor(ref: ResourceReference<Style>, isAbstract: boolean = false, implementations: ResourceReference<Style>[] = [], materials: Map<string, Material> = new Map()) {
        super(ref)
        this.materials = materials
        this.isAbstract = isAbstract
        this.implementations = implementations
    }

    get completeMaterials(): [string, Material][] {
        let entries: [string, Material][] = []
        this.implementations.forEach((implementation) => {
            entries.push(...implementation.get().completeMaterials)
        })
        entries.push(...Object.entries(this.materials))
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

    implementationsOfMaterial(id: string, includeSelf: boolean = false): ResourceReference<Style>[] {
        let implementations: ResourceReference<Style>[] = []
        if (this.materials.has(id) && includeSelf) {
            implementations.push(this.reference)
        }
        this.implementations.forEach((implementation) => implementations.push(...implementation.get().implementationsOfMaterial(id, true)))
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
            implementation.get().materials.forEach((material, id) => {
                if (!this.materials.has(id)) {
                    this.pushMaterial(director, id, material)
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
            implementation.get().materials.forEach((material, id) => {
                if (this.implementationsOfMaterial(id).length === 1) {
                    this.deleteMaterial(director, id)
                } else {
                    this.update(director, {
                        materials: [{
                            id: id,
                            data: {
                                fromImplementations: this.implementationsOfMaterial(id).map((ref) => ref.toString())
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

    getMaterial(id: string): Material {
        const material = this.materials.get(id)
        if (!material) {
            throw new Error(`Can not find material with id ${id}, it not exists in ${this.reference.toString()}`)
        }
        return material
    }

    pushMaterial(director: ClientDirector, id: string, material: Material) {
        if (this.materials.has(id)) {
            console.warn(`Can not push material with id ${id}, it already exists in ${this.reference.toString()}`)
        } else {
            this.materials.set(id, material)
            this.update(director, {
                materials: [{
                    id: id,
                    mode: 'push',
                    data: {
                        type: material.type,
                        fromImplementations: this.implementationsOfMaterial(id).map((ref) => ref.toString())
                    }
                }]
            })
            this.saveDirector(director)
        }
    }

    editMaterial(director: ClientDirector, id: string, changes: { id?: string }) {
        const material = this.materials.get(id)
        if (material) {
            if (changes.id) {
                this.materials.delete(id)
                this.materials.set(changes.id, material)
                this.update(director, {
                    materials: [{
                        id: id,
                        data: {
                            id: changes.id
                        }
                    }]
                })
            }
            this.saveDirector(director)
        } else {
            console.warn(`Can not edit material with id ${id}, it not exists in ${this.reference.toString()}`)
        }
    }

    deleteMaterial(director: ClientDirector, id: string) {
        if (this.materials.has(id)) {
            this.materials.delete(id)
            this.update(director, {
                materials: [{
                    id: id,
                    mode: 'delete'
                }]
            })
            this.saveDirector(director)
        } else {
            console.warn(`Can not delete material with id ${id}, it not exists in ${this.reference.toString()}`)
        }
    }

    materialUndoChanges(id: string, changes: { id?: string }): { id?: string } {
        const undoChanges: { id?: string } = {}
        if (changes.id) undoChanges.id = id
        return undoChanges
    }

    updateMaterial(director: ClientDirector, material: string) {
        this.update(director, {
            materials: [{
                id: material,
                data: { paints: true }
            }]
        })
        this.saveDirector(director)
    }

    update(director: ClientDirector, update: StyleUpdate) {
        director.addDirective(BuilderDirective.update('data-pack/styles/update', this.reference, styleUpdate, update))
    }

    mapMaterials(map: (material: Material, id: string) => any): any[] {
        let materials: any[] = []
        this.materials.forEach((material, id) => materials.push(map(material, id)))
        return materials
    }

    static loadFromRef(ref: ResourceReference<Style>): Style {
        const data = getProject(ref.pack).read(ref.path)
        return new Style(ref,
            data.isAbstract,
            data.implementations.map((implementation: string) => new StyleReference(implementation)),
            new Map(data.materials.map((material: any) => [material.id, Material.fromJson(material.data)]))
        )
    }

    toJson(): {} {
        return {
            isAbstract: this.isAbstract,
            implementations: this.implementations.map((implementation) => implementation.toJson()),
            materials: this.mapMaterials((material, id) => {
                return {
                    id: id,
                    data: material.toJson()
                }
            })
        }
    }

    get reference(): ResourceReference<Style> {
        return this._reference as ResourceReference<Style>
    }
}

export class GenerationStyle {

    constructor(
        
    ) { }
}

export class PostGenerationStyle {

    constructor(
        readonly materials: Record<string, Material>
    ) { }
}