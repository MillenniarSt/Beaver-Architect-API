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

import { Size3D } from "../../world/world3D.js"
import { ResourceReference } from "../builder.js"
import { DataTypes } from "./data-pack.js"

export abstract class DataStyle {

    private reference: ResourceReference<DataStyle>
    name: string

    constructor(pack: string, folder: DataTypes, location: string, json: any) {
        this.reference = new ResourceReference(pack, folder, location)
        this.name = json.name ?? 'undefined'
    }

    get getReference(): ResourceReference<DataStyle> {
        return this.reference
    }

    set setReference(reference: ResourceReference<DataStyle>) {
        this.reference = reference
    }
}

export abstract class DataTemplate<T> extends DataStyle {

    abstract generate(object: T): void
}

export class ResizeLimitation {

    constructor(readonly min: Size3D | null, readonly max: Size3D | null) { }

    static unlimited(): ResizeLimitation {
        return new ResizeLimitation(null, null)
    }

    static block(size: Size3D | null): ResizeLimitation {
        return new ResizeLimitation(size, size)
    }

    static fromJson(json: any): ResizeLimitation {
        if(!json) {
            return ResizeLimitation.unlimited()
        } else if(Array.isArray(json)) {
            return ResizeLimitation.block(Size3D.fromJson(json))
        } else {
            return new ResizeLimitation(json.min ? Size3D.fromJson(json.min) : null, json.max ? Size3D.fromJson(json.max) : null)
        }
    }
}