//             _____
//         ___/     \___        |  |
//      ##/  _.- _.-    \##  -  |  |                       -
//      ##\#=_  '    _=#/##  |  |  |  /---\  |      |      |   ===\  |  __
//      ##   \\#####//   ##  |  |  |  |___/  |===\  |===\  |   ___|  |==/
//      ##       |       ##  |  |  |  |      |   |  |   |  |  /   |  |
//      ##       |       ##  |  \= \= \====  |   |  |   |  |  \___/  |
//      ##\___   |   ___/
//      ##    \__|__/

import { CheckUpdate, ObjectUpdate, VarUpdate } from "../../../connection/directives/update.js"
import { type FormOutput } from "../../../util/form.js"
import { RandomList } from "../../../util/random.js"
import { Style } from "./style.js"

export type MaterialUpdate = {
    id?: string,
    type?: string,
    fromImplementations?: string[],
    paints?: boolean
}

export const materialUpdate = new ObjectUpdate<MaterialUpdate>({
    id: new VarUpdate(),
    type: new VarUpdate(),
    fromImplementations: new VarUpdate(),
    paints: new CheckUpdate()
})

export type Paint = {
    id: string
    additional?: {}
}

export class Material {

    constructor(
        public paints: RandomList<Paint>,
        public type: string,
        public settings: {} = {}
    ) { }

    static fromJson(json: any): Material {
        return new Material(RandomList.fromJson(json.paints), json.type, json.settings)
    }

    buildMaterial(id: string, additional?: {}): Paint {
        return { id: id, additional: additional }
    }

    updateMaterial(paint: Paint, changes: any): Paint {
        return { id: changes.id ?? paint.id, additional: changes.additional ?? paint.additional }
    }

    pushMaterial(id: string, data: any = {}) {
        this.paints.push(this.buildMaterial(id, data))
    }

    editMaterial(index: number, changes: FormOutput) {
        this.paints.list[index] = this.updateMaterial(this.paints.list[index], changes)
    }

    deleteMaterial(index: number) {
        this.paints.remove(index)
    }

    toJson(): {} {
        return {
            paints: this.paints.toJson(),
            type: this.type,
            settings: this.settings
        }
    }

    copyMaterial(index: number): Paint {
        const paint = this.paints.list[index]
        return { id: paint.id, additional: paint.additional }
    }

    undefined(): Paint {
        return { id: '$undefined' }
    }
}

export class MaterialReference {

    protected constructor(
        protected defined: Material | undefined,
        protected ref: string | undefined,
        public attributes: Record<string, string | number | boolean> = {}
    ) { }

    static defined(material: Material, attributes: Record<string, string | number | boolean> = {}): MaterialReference {
        return new MaterialReference(material, undefined, attributes)
    }

    static ref(ref: string, attributes: Record<string, string | number | boolean> = {}): MaterialReference {
        return new MaterialReference(undefined, ref, attributes)
    }

    static fromJson(json: any): MaterialReference {
        return new MaterialReference(json.defined ? Material.fromJson(json.material) : undefined, json.ref, json.attributes)
    }

    isDefined(): boolean {
        return this.defined !== undefined
    }

    setDefined(defined: Material) {
        this.defined = defined
        this.ref = undefined
    }

    setRef(ref: string) {
        this.defined = undefined
        this.ref = ref
    }

    getDefined(): Material | undefined {
        return this.defined
    }

    getRef(): string | undefined {
        return this.ref
    }

    getMaterial(style: Style): Material {
        return this.defined ?? style.getMaterial(this.ref!)
    }

    toJson() {
        return {
            defined: this.defined?.toJson(),
            ref: this.ref,
            attributes: this.attributes
        }
    }
}