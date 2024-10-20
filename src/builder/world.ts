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

import { Builder, ResourceReference } from "./builder.js"
import { DataStyle } from "./data-pack/data.js"
import { Structure } from "./structure/structure.js"
import { Terrain } from "./terrain/terrain.js"

export class World extends Builder {

    structures: Structure[] = []

    terrain: Terrain

    constructor(reference: ResourceReference<DataStyle>, name: string, terrain: Terrain) {
        super(reference, name)
        this.terrain = terrain
    }
}