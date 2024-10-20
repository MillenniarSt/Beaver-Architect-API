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

import { BiGeo, Rectangle } from "../../world/bigeo.js"
import { Line } from "../../world/line.js"
import { Dimension2D, Pos2D, Size2D } from "../../world/world2D.js"
import { Pos3D } from "../../world/world3D.js"
import { ResourceReference } from "../builder.js"
import { DataTypes } from "./data-pack.js"
import { DataStyle } from "./data.js"
import { Door, DoorStyle } from "./door.js"
import { Gadget, GadgetStyle } from "./gadget.js"
import { Model } from "./model.js"
import { WallWindowStyle } from "./window.js"

export class WallStyle extends DataStyle {

    /**
     * List of preferred windows
     */
    windows: ResourceReference<WallWindowStyle>[]
    /**
     * List of preferred doors
     */
    doors: ResourceReference<DoorStyle>[]
    /**
     * List of preferred gadgets
     */
    gadgets: ResourceReference<GadgetStyle>[]

    model: ResourceReference<Model>

    constructor(pack: string, location: string, json: any) {
        super(pack, DataTypes.WALLS, location, json)

        this.windows = Array.isArray(json.windows) ?
            json.windows.map((value: string) => ResourceReference.fromString<WallWindowStyle>(value, DataTypes.WINDOWS)) :
            [ResourceReference.fromString<WallWindowStyle>(json.windows, DataTypes.WINDOWS)]
        this.doors = Array.isArray(json.windows) ?
            json.doors.map((value: string) => ResourceReference.fromString<DoorStyle>(value, DataTypes.DOORS)) :
            [ResourceReference.fromString<DoorStyle>(json.doors, DataTypes.DOORS)]
        this.gadgets = Array.isArray(json.windows) ?
            json.gadgets.map((value: string) => ResourceReference.fromString<GadgetStyle>(value, DataTypes.GADGETS)) :
            [ResourceReference.fromString<GadgetStyle>(json.gadgets, DataTypes.GADGETS)]
        
        this.model = ResourceReference.fromString<Model>(json.model, DataTypes.MODELS)
    }
}

export class Wall {

    style: WallStyle

    line: Line<Pos3D>

    shape: BiGeo

    thickness: number

    windows: Window[] = []
    doors: Door[] = []
    gadgets: Gadget[] = []

    constructor(style: WallStyle, line: Line<Pos3D>, height: number, thickness = 1, shape?: BiGeo) {
        this.style = style
        this.line = line
        this.shape = shape ?? new Rectangle(new Dimension2D(new Pos2D(0, 0), new Size2D(1, 1)))
        this.thickness = thickness ?? 1
    }
}