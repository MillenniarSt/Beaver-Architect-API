//             _____
//         ___/     \___        |  |
//      ##/  _.- _.-    \##  -  |  |                       -
//      ##\#=_  '    _=#/##  |  |  |  /---\  |      |      |   ===\  |  __
//      ##   \\#####//   ##  |  |  |  |___/  |===\  |===\  |   ___|  |==/
//      ##       |       ##  |  |  |  |      |   |  |   |  |  /   |  |
//      ##       |       ##  |  \= \= \====  |   |  |   |  |  \___/  |
//      ##\___   |   ___/
//      ##    \__|__/

import { Rect2 } from '../world/bi-geo/plane.js'
import { Vec2 } from '../world/vector.js'
import { Plane3 } from '../world/geo/surface.js'
import { templateBuilderExport, templateTerrainChunkExport, templateTerrainChunkTpcExport } from '../template/exporter.js'
import { Quaternion, Rotation3 } from '../world/quaternion.js'
import { templateTestBuilders } from '../template/builders/testing.js'
import { ConstantVec2 } from '../builder/random/vec/vec2.js'
import { templateMinecraftStyles } from '../template/styles/minecraft.js'
import { templateTestTerrains } from './terrains/testing.js'

export function simpleGrid() {
    const base = new Plane3(new Rect2(Vec2.ZERO, new Vec2(40, 6)), 0, new Rotation3(Quaternion.UP))
    templateBuilderExport(templateTestBuilders.gridPrisms(new ConstantVec2(new Vec2(1, 1)), new ConstantVec2(new Vec2(1, 1))), base, templateMinecraftStyles.simple())
}

export function simpleFlatTerrain() {
    templateTerrainChunkExport(templateTestTerrains.flat(16), templateMinecraftStyles.simple())
}

export function simpleTpcFlatTerrain() {
    templateTerrainChunkTpcExport(templateTestTerrains.flat(16), templateMinecraftStyles.simple())
}