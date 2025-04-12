import { Rect2 } from '../world/bi-geo/plane.js'
import { Vec2 } from '../world/vector.js'
import { Plane3 } from '../world/geo/surface.js'
import { templateBuilderExport } from '../template/exporter.js'
import { Quaternion, Rotation3 } from '../world/quaternion.js'
import { templateTestBuilders } from '../template/builders/testing.js'
import { ConstantVec2 } from '../builder/random/vec/vec2.js'
import { templateMinecraftStyles } from '../template/styles/minecraft.js'

export function simpleGrid() {
    const base = new Plane3(new Rect2(Vec2.ZERO, new Vec2(40, 6)), 0, new Rotation3(Quaternion.UP))
    templateBuilderExport(templateTestBuilders.gridPrisms(new ConstantVec2(new Vec2(1, 1)) as any, new ConstantVec2(new Vec2(1, 1)) as any), base, templateMinecraftStyles.simple())
}

export function simpleBlockOfFlat() {
    const base = new Plane3(new Rect2(Vec2.ZERO, new Vec2(4, 4)), 0, new Rotation3(Quaternion.UP))
    templateBuilderExport(templateTestBuilders.flatBlock(), base, templateMinecraftStyles.simple())
}