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

import { Dimension3D } from "../../world/world3D.js"
import { ResourceReference } from "../builder.js"
import { DataTypes } from "./data-pack.js"
import { DataStyle, ResizeLimitation } from "./data.js"
import { Model } from "./model.js"

export class GadgetStyle extends DataStyle {

    /**
     * On Config
     * - Size3D
     * - Map {
     *     min: Size3D
     *     max: Size3D
     *   }
     */
    readonly size: ResizeLimitation

    readonly model: ResourceReference<Model>

    constructor(pack: string, location: string, json: any) {
        super(pack, DataTypes.GADGETS, location, json)
        this.size = ResizeLimitation.fromJson(json.size)
        this.model = ResourceReference.fromString<Model>(json.model, DataTypes.MODELS)
    }
}

export class Gadget {

    constructor(public style: GadgetStyle, public dimension: Dimension3D) { }
}