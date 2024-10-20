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

import { Pos3D, Rotation3D } from "../../world/world3D.js"
import { ResourceReference } from "../builder.js"
import { DataTypes } from "./data-pack.js"
import { DataStyle } from "./data.js"

export class Model extends DataStyle {

    /**
     * On Config
     * Map {
     *   shematic-id: single   - "shematic-location"
     *                multiple - ["shematic-location-1", "shematic-location-2"]
     * }
     * On Object
     * Map {
     *   shematic-id: [shematic-1, shematic-2]
     * }
     */
    readonly schematics = new Map<string, ResourceReference<Schematic>[]>()
    
    /**
     * On Config
     * List of parts or a part
     * On Object
     * List of parts
     */
    readonly parts: ModelPart[]

    constructor(pack: string, location: string, json: any) {
        super(pack, DataTypes.MODELS, location, json)
        json.schematics.forEach((value: string[] | string, key: string) => {
            this.schematics.set(key, Array.isArray(value) ? 
                value.map((schematic) => ResourceReference.fromString<Schematic>(schematic, DataTypes.SCHEMATICS)) : 
                [ResourceReference.fromString<Schematic>(value, DataTypes.SCHEMATICS)]
            )
        })
        this.parts = Array.isArray(json.parts) ? json.parts.map((part: any) => new ModelPart(part)) : [new ModelPart(json.parts)]
    }
}

export class ModelPart {

    /**
     * - [x, y, z]
     * - {top: n, right: n, bottom: n, left: n}
     */
    readonly pos: Pos3D

    /**
     * On Config
     * - {x: n, y: n, z: n}
     * On Object
     * Rotation3D
     */
    readonly rotation: Rotation3D

    /**
     * string of the shematic-id from the model
     */
    readonly schematic: string

    constructor(json: any) {
        this.pos = Pos3D.fromJson(json.pos)
        this.rotation = new Rotation3D(json.rotation.x ?? 0, json.rotation.y ?? 0, json.rotation.z ?? 0)
        this.schematic = json.schematic
    }
}

export class Schematic extends DataStyle {

    readonly content: any

    constructor(pack: string, location: string, json: any) {
        super(pack, DataTypes.SCHEMATICS, location, json)
        this.content = json
    }
}