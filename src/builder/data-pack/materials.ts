import { project } from "../../project.js"
import { FormDataOutput } from "../../util.js"
import { Size3D } from "../../world/world3D.js"

export type Material = {
    id: string,
    weight: number
}

export abstract class MaterialPattern<M extends Material> {

    abstract get type(): string

    constructor(
        public materials: M[]
    ) { }

    abstract generatePattern(size: Size3D): string[][][]

    abstract buildMaterial(id: string, data: any): M

    abstract updateMaterial(material: M, changes: any): M

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
}

export class BasicMaterialPattern extends MaterialPattern<Material> {

    get type(): string {
        return 'basic'
    }

    static fromData(data: any): BasicMaterialPattern {
        return new BasicMaterialPattern(data.materials)
    }

    generatePattern(size: Size3D): string[][][] {
        let pattern: string[][][] = []
        for (let x = 0; x < size.width; x++) {
            for (let y = 0; y < size.height; y++) {
                for (let z = 0; z < size.length; z++) {
                    pattern[x][y][z] = this.materials[Math.floor(project.random() * this.materials.length)].id
                }
            }
        }
        return pattern
    }

    buildMaterial(id: string, data: any): Material {
        return { id: id, weight: data.weight ?? 1}
    }

    updateMaterial(material: Material, changes: any): Material {
        return { id: changes.id ?? material.id, weight: changes.weight ?? material.weight }
    }
}

export const materialTypes: Record<string, (data: any) => MaterialPattern<any>> = {
    basic: BasicMaterialPattern.fromData
}