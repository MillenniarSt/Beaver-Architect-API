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

import { CheckUpdate, ObjectUpdate, VarUpdate } from "../../../connection/directives/update.js"
import { project } from "../../../project.js"
import { FormDataOutput } from "../../../util.js"
import { Size3D } from "../../../world/world3D.js"

export type PatternUpdate = {
    id?: string,
    type?: string,
    fromImplementations?: string[],
    materials?: boolean
}

export const patternUpdate = new ObjectUpdate<PatternUpdate>({
    id: new VarUpdate(),
    type: new VarUpdate(),
    fromImplementations: new VarUpdate(),
    materials: new CheckUpdate()
})

export type Material = {
    id: string,
    weight: number
}

export abstract class MaterialPattern<M extends Material> {

    abstract get type(): string

    constructor(
        public materials: M[]
    ) { }

    abstract generate(size: Size3D): string[][][]

    abstract buildMaterial(id: string, data: any): M

    abstract updateMaterial(material: M, changes: any): M

    length(): number {
        return this.materials.reduce((sum, material) => sum + material.weight, 0)
    }

    randomMaterial(length: number = this.length()): M {
        let random = project.random() * length

        for (const material of this.materials) {
            if (random < material.weight) {
                return material
            }
            random -= material.weight
        }

        return this.undefined()
    }

    materialsWeighted(): M[] {
        let materials: M[] = []
        this.materials.forEach((material) => length += material.weight)
        return materials
    }

    pushMaterial(id: string, data: any = {}) {
        this.materials.push(this.buildMaterial(id, data))
    }

    editMaterial(index: number, changes: FormDataOutput) {
        this.materials[index] = this.updateMaterial(this.materials[index], changes)
    }

    deleteMaterial(index: number) {
        this.materials.splice(index, 1)
    }

    dataJson(): {} {
        return {
            materials: this.materials
        }
    }

    copyMaterial(index: number): M {
        const material = this.materials[index]
        return { id: material.id, weight: material.weight } as M
    }

    undefined(): M {
        return { id: '$undefined', weight: 1 } as M
    }
}

export class BasicMaterialPattern extends MaterialPattern<Material> {

    get type(): string {
        return 'basic'
    }

    static fromData(data: any): BasicMaterialPattern {
        return new BasicMaterialPattern(data.materials)
    }

    generate(size: Size3D): string[][][] {
        let pattern: string[][][] = []
        const length = this.length()
        for (let x = 0; x < size.width; x++) {
            pattern.push([])
            for (let y = 0; y < size.height; y++) {
                pattern[x].push([])
                for (let z = 0; z < size.length; z++) {
                    pattern[x][y].push(this.randomMaterial(length).id)
                }
            }
        }
        return pattern
    }

    buildMaterial(id: string, data: any): Material {
        return { id: id, weight: data.weight ?? 1 }
    }

    updateMaterial(material: Material, changes: any): Material {
        return { id: changes.id ?? material.id, weight: changes.weight ?? material.weight }
    }
}

export const materialTypes: Record<string, (data: any) => MaterialPattern<any>> = {
    basic: BasicMaterialPattern.fromData
}