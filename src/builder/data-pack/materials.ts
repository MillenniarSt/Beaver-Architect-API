import { project } from "../../project.js"
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

    pushMaterial(id: string, data: any = {}): boolean {
        if(this.materials.find((material) => material.id === id)) {
            return false
        }
        this.materials.push(this.buildMaterial(id, data))
        return true
    }

    editMaterial(id: string, changes: any) {
        this.materials[this.materials.findIndex((material) => material.id === id)] = this.buildMaterial(id, changes)
    }

    deleteMaterial(id: string) {
        this.materials.splice(this.materials.findIndex((material) => material.id === id), 1)
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
}

export const materialTypes: Record<string, (data: any) => MaterialPattern<any>> = {
    basic: BasicMaterialPattern.fromData
}