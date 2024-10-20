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
import { Pos2D } from "../../world/world2D.js"
import { ResourceReference } from "../builder.js"
import { DataTypes } from "../data-pack/data-pack.js"
import { DataStyle } from "../data-pack/data.js"
import { Floor, FloorStyle } from "../data-pack/floor.js"
import { Wall, WallStyle } from "../data-pack/wall.js"
import { Room, RoomStyle } from "./room.js"

export class LayerStyle extends DataStyle {

    /**
     * Default attributes to create a new room
     */
    floor: ResourceReference<FloorStyle> | null
    ceiling: ResourceReference<FloorStyle> | null

    /**
     * Default attributes to create a new wall
     */
    wall: ResourceReference<WallStyle> | null

    /**
     * List of preferred rooms
     */
    rooms: ResourceReference<RoomStyle>[]

    constructor(pack: string, location: string, json: any) {
        super(pack, DataTypes.LAYERS, location, json)

        this.floor = json.floor ? ResourceReference.fromString<FloorStyle>(json.floor, DataTypes.FLOORS) : null
        this.ceiling = json.ceiling ? ResourceReference.fromString<FloorStyle>(json.ceiling, DataTypes.FLOORS) : null
        this.wall = json.wall ? ResourceReference.fromString<WallStyle>(json.wall, DataTypes.WALLS) : null

        this.rooms = Array.isArray(json.rooms) ?
            json.rooms.map((value: string) => ResourceReference.fromString<RoomStyle>(value, DataTypes.ROOMS)) :
            [ResourceReference.fromString<RoomStyle>(json.rooms, DataTypes.ROOMS)]
    }

    applyToRoom(room: Room<BiGeo>) {
        if(this.floor && !room.floor) {
            room.floor = new Floor(this.floor.get(), RaisedBiGeo.flat(room.geo.root))
        }
        if(this.ceiling && !room.ceiling) {
            room.ceiling = new Floor(this.ceiling.get(), RaisedBiGeo.flat(room.geo.root), room.geo.y + room.geo.height)
        }
    }

    getWall(): WallStyle | null {
        return this.wall ? this.wall.get() : null
    }
}

export class Layer {

    style: LayerStyle | null

    pos: Pos2D
    height: number

    rooms: Room<BiGeo>[] = []
    walls: Wall[] = []

    constructor(style: LayerStyle | null, pos: Pos2D, height: number = 4) {
        this.style = style
        this.pos = pos
        this.height = height
    }
}