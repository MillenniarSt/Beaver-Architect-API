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

export class WallWindowStyle extends DataStyle {

    /**
     * On Config
     * - Size3D
     * - Map {
     *     min: Size3D
     *     max: Size3D
     *   }
     */
    size: ResizeLimitation

    baseHeight: number
    spacing: number

    /**
     * On Config use "model" to specify both
     */
    modelOpen: ResourceReference<Model>
    modelClose: ResourceReference<Model>

    constructor(pack: string, location: string, json: any) {
        super(pack, DataTypes.WINDOWS, location, json)

        this.size = ResizeLimitation.fromJson(json.size)
        this.baseHeight = json.base_height ?? 1
        this.spacing = json.spacing ?? 2
        this.modelOpen = ResourceReference.fromString<Model>(json.model_open ?? json.model, DataTypes.MODELS)
        this.modelClose = ResourceReference.fromString<Model>(json.model_close ?? json.model, DataTypes.MODELS)
    }
}

export class WallWindow {

    constructor(public style: WallWindowStyle, public dimension: Dimension3D, public isOpen = false) { }
}