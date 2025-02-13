//             _____
//         ___/     \___        |  |
//      ##/  _.- _.-    \##  -  |  |                       -
//      ##\#=_  '    _=#/##  |  |  |  /---\  |      |      |   ===\  |  __
//      ##   \\#####//   ##  |  |  |  |___/  |===\  |===\  |   ___|  |==/
//      ##       |       ##  |  |  |  |      |   |  |   |  |  /   |  |
//      ##       |       ##  |  \= \= \====  |   |  |   |  |  \___/  |
//      ##\___   |   ___/
//      ##    \__|__/

import { MaterialReference } from "../../../engineer/data-pack/style/material.js";
import { GenerationStyle } from "../../../engineer/data-pack/style/style.js";
import { RandomList, Seed } from "../../../util/random.js";
import { Plane2, Rect2 } from "../../../world/bi-geo/plane.js";
import { Prism } from "../../../world/geo/object.js";
import { Plane3 } from "../../../world/geo/surface.js";
import { Quaternion, Rotation2, Rotation3 } from "../../../world/quaternion.js";
import { Vec2, Vec3 } from "../../../world/vector.js";
import { BuilderResult, ObjectBuilder, SurfaceBuilder } from "../../builder.js";
import { EmptyBuilder } from "../../generic/empty.js";

export class ToFacesPrismBuilder<P extends Plane2> extends ObjectBuilder<Prism<P>, {}, {}> {

    protected base: SurfaceBuilder<Plane3<P>>
    protected ceil: SurfaceBuilder<Plane3<P>>
    protected side: SurfaceBuilder<Plane3<Rect2>>

    constructor(
        children: {
            base?: SurfaceBuilder<Plane3<P>>
            ceil?: SurfaceBuilder<Plane3<P>>
            side?: SurfaceBuilder<Plane3<Rect2>>
        },
        materials: RandomList<MaterialReference> = new RandomList()
    ) {
        super({}, materials)
        this.base = children.base ?? new EmptyBuilder()
        this.ceil = children.ceil ?? new EmptyBuilder()
        this.side = children.side ?? new EmptyBuilder()
    }

    get children(): [
        { builder: SurfaceBuilder<Plane3<P>>, options: {} },
        { builder: SurfaceBuilder<Plane3<P>>, options: {} },
        { builder: SurfaceBuilder<Plane3<Rect2>>, options: {} }
    ] {
        return [
            { builder: this.base, options: {} },
            { builder: this.ceil, options: {} },
            { builder: this.side, options: {} }
        ]
    }

    protected buildChildren(context: Prism<P>, style: GenerationStyle, seed: Seed): BuilderResult[] {
        const rotation = context.base.rotation
        return [
            this.base.build(context.base, style, seed),
            this.ceil.build(context.base.rotate(new Rotation3(rotation.quaternion.withW(-rotation.quaternion.w), rotation.pivot)).move(new Vec3(0, 0, context.height)).rotate(rotation), style, seed),
            ...context.base.plane.edge.segments.map((segment) => 
                this.side.build(new Plane3(new Rect2(
                    segment[0], new Vec2(segment[0].distance(segment[1]), context.height), 
                    Rotation2.fromPoints(segment[0], segment[1], segment[0].add(new Vec2(segment[0].distance(segment[1]), 0)))
                ), context.base.z, new Rotation3(rotation.quaternion.add(Quaternion.DOWN), rotation.getVec(segment[0].toVec3(context.base.z)))), style, seed)
            )
        ]
    }
}