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
import { Prism } from "../../world/geo.js"
import { RaisedBiGeo } from "../../world/raised.js"
import { ResourceReference } from "../builder.js"
import { DataTypes } from "../data-pack/data-pack.js"
import { DataTemplate } from "../data-pack/data.js"
import { Floor, FloorStyle } from "../data-pack/floor.js"
import { Gadget, GadgetStyle } from "../data-pack/gadget.js"
import { Wall, WallStyle } from "../data-pack/wall.js"

export class RoomStyle extends DataTemplate<Room<BiGeo>> {

    floor: ResourceReference<FloorStyle> | null
    ceiling: ResourceReference<FloorStyle> | null

    /**
     * List of preferred gadgets
     */
    gadgets: ResourceReference<GadgetStyle>[]

    constructor(pack: string, location: string, json: any) {
        super(pack, DataTypes.ROOMS, location, json)

        this.floor = json.floor ? ResourceReference.fromString<FloorStyle>(json.floor, DataTypes.FLOORS) : null
        this.ceiling = json.ceiling ? ResourceReference.fromString<FloorStyle>(json.ceiling, DataTypes.FLOORS) : null
        this.gadgets = Array.isArray(json.gadgets) ?
            json.gadgets.map((value: string) => ResourceReference.fromString<GadgetStyle>(value, DataTypes.GADGETS)) :
            [ResourceReference.fromString<GadgetStyle>(json.gadgets, DataTypes.GADGETS)]
    }

    generate<G extends BiGeo>(room: Room<G>): void {
        if(this.floor) {
            room.floor = new Floor(this.floor.get(), RaisedBiGeo.flat(room.geo.root))
        }
        if(this.ceiling) {
            room.ceiling = new Floor(this.ceiling.get(), RaisedBiGeo.flat(room.geo.root), room.geo.y + room.geo.height)
        }
    }
}

export class Room<G extends BiGeo> {

    geo: Prism<G>

    floor: Floor<G> | null = null
    ceiling: Floor<G> | null = null

    gadgets: Gadget[] = []

    constructor(geo: Prism<G>) {
        this.geo = geo
    }

    generateWallAround(style: WallStyle): Wall {
        return new Wall(style, this.geo.root.perimeter.to3d(this.geo.y), this.geo.height, 1)
    }
}