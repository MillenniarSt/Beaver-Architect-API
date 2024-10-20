//          _____
//      ___/     \___
//    |/  _.- _.-    \|
//   ||\\=_  '    _=//||
//   ||   \\\===///   ||
//   ||       |       ||
//   ||       |       ||
//   ||\___   |   ___/||
//         \__|__/
//
//      By Millenniar
//

import { Pos3D } from "../world/world3D.js"
import { DataTypes, loadedDataPacks } from "./data-pack/data-pack.js"
import { DataStyle } from "./data-pack/data.js"

export abstract class AbstractBuilder {

    constructor(public name: string) { }

    abstract getStructure(folder: string): any[]
}

export abstract class Builder extends AbstractBuilder {

    constructor(private reference: ResourceReference<DataStyle>, name: string, public pos: Pos3D = new Pos3D(0, 0, 0)) {
        super(name)
    }

    getStructure(folder: string): any[] {
        return []
    }

    get getReference(): ResourceReference<DataStyle> {
        return this.reference
    }

    set setReference(reference: ResourceReference<DataStyle>) {
        this.reference = reference
    }
}

export class ResourceReference<D extends DataStyle> {

    constructor(readonly pack: string, readonly folder: DataTypes, readonly location: string) { }

    static fromString<D extends DataStyle>(string: string, folder: DataTypes): ResourceReference<D> {
        const unpack = string.split(':')
        return new ResourceReference<D>(unpack[0], folder, unpack[1])
    }

    get(): D {
        return loadedDataPacks.get(this.pack)!.dataStyles.get(this.folder)!.get(this.location) as D
    }
}