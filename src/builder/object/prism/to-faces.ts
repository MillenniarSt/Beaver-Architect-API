//             _____
//         ___/     \___        |  |
//      ##/  _.- _.-    \##  -  |  |                       -
//      ##\#=_  '    _=#/##  |  |  |  /---\  |      |      |   ===\  |  __
//      ##   \\#####//   ##  |  |  |  |___/  |===\  |===\  |   ___|  |==/
//      ##       |       ##  |  |  |  |      |   |  |   |  |  /   |  |
//      ##       |       ##  |  \= \= \====  |   |  |   |  |  \___/  |
//      ##\___   |   ___/
//      ##    \__|__/

import { Seed } from "../../random/random.js";
import { Plane2, Rect2 } from "../../../world/bi-geo/plane.js";
import { Prism } from "../../../world/geo/object.js";
import { Plane3 } from "../../../world/geo/surface.js";
import { Quaternion, Rotation2, Rotation3 } from "../../../world/quaternion.js";
import { Vec2, Vec3 } from "../../../world/vector.js";
import { Builder, BuilderResult, ObjectBuilder, SurfaceBuilder } from "../../builder.js";
import { EmptyBuilder } from "../../generic/empty.js";
import { builderFromJson } from "../../collective.js";
import type { GenerationStyle } from "../../../engineer/data-pack/style/rule.js";

export class ToFacesPrismBuilder<P extends Plane2> extends ObjectBuilder<Prism<P>, {}> {

    static readonly type = 'prismToFaces'

    protected base: SurfaceBuilder<Plane3<P>>
    protected ceil: SurfaceBuilder<Plane3<P>>
    protected side: SurfaceBuilder<Plane3<Rect2>>

    constructor(
        children: {
            base?: SurfaceBuilder<Plane3<P>>
            ceil?: SurfaceBuilder<Plane3<P>>
            side?: SurfaceBuilder<Plane3<Rect2>>
        }
    ) {
        super({})
        this.base = children.base ?? EmptyBuilder.VOID
        this.ceil = children.ceil ?? EmptyBuilder.VOID
        this.side = children.side ?? EmptyBuilder.VOID
    }

    static fromJson<P extends Plane2 = Plane2>(json: any): ToFacesPrismBuilder<P> {
        return new ToFacesPrismBuilder(
            {
                base: builderFromJson(json.base),
                ceil: builderFromJson(json.ceil),
                side: builderFromJson(json.side)
            }
        )
    }

    protected buildChildren(context: Prism<P>, style: GenerationStyle, parameters: GenerationStyle, seed: Seed): BuilderResult[] {
        const rotation = context.base.rotation
        return [
            this.base.build(context.base, style, parameters, seed),
            this.ceil.build(context.base.rotate(new Rotation3(rotation.quaternion.withW(-rotation.quaternion.w), rotation.pivot)).move(new Vec3(0, 0, context.height)).rotate(rotation), style, parameters, seed),
            ...context.base.plane.edge.segments.map((segment) =>
                this.side.build(new Plane3(new Rect2(
                    segment[0], new Vec2(segment[0].distance(segment[1]), context.height),
                    Rotation2.fromPoints(segment[0], segment[1], segment[0].add(new Vec2(segment[0].distance(segment[1]), 0)))
                ), context.base.z, new Rotation3(rotation.quaternion.add(Quaternion.DOWN), rotation.getVec(segment[0].toVec3(context.base.z)))), style, parameters, seed)
            )
        ]
    }

    protected additionalJson(): Record<string, any> {
        return {
            base: this.base.toJson(),
            ceil: this.ceil.toJson(),
            side: this.side.toJson()
        }
    }
}