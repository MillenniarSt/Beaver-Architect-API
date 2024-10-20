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

import { BiGeo } from "../../world/bigeo.js"
import { RaisedBiGeo } from "../../world/raised.js"
import { ResourceReference } from "../builder.js"
import { DataTypes } from "./data-pack.js"
import { DataStyle } from "./data.js"
import { GadgetStyle } from "./gadget.js"
import { Model } from "./model.js"

export class RoofStyle extends DataStyle {

    /**
     * List of preferred gadgets
     */
    gadgets: ResourceReference<GadgetStyle>

    model

    constructor(pack: string, location: string, json: any) {
        super(pack, DataTypes.ROOFS, location, json)
        
        this.gadgets = Array.isArray(json.windows) ?
            json.gadgets.map((value: string) => ResourceReference.fromString<GadgetStyle>(value, DataTypes.GADGETS)) :
            [ResourceReference.fromString<GadgetStyle>(json.gadgets, DataTypes.GADGETS)]

        this.model = ResourceReference.fromString<Model>(json.model, DataTypes.MODELS)
    }
}

export class Roof<G extends BiGeo> {

    constructor(public style: RoofStyle, public geo: RaisedBiGeo<G>, public y: number = 0) { }
}