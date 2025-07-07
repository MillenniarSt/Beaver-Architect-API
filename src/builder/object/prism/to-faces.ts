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
import { Direction, Rotation3 } from "../../../world/quaternion.js";
import { Vec2, Vec3 } from "../../../world/vector.js";
import { Builder, BuilderChild, BuilderResult, BuilderSingleChild, StandardBuilder } from "../../builder.js";
import { EmptyBuilder } from "../../generic/empty.js";
import type { GenerationStyle } from "../../../engineer/data-pack/style/rule.js";
import { GeoRegistry } from "../../../register/geo.js";
import type { RandomTypeRegistry } from "../../../register/random.js";
import type { Option } from "../../option.js";
import { CauseError, TODO } from "../../../dev/decorators.js";

export const TO_FACES_PRISM_STRUCTURE = {
    geo: GeoRegistry.PRISM,
    children: {
        base: { options: {}, geo: GeoRegistry.PLANE3, multiple: false },
        ceil: { options: {}, geo: GeoRegistry.PLANE3, multiple: false },
        side: { options: {}, geo: GeoRegistry.PLANE3, multiple: false }
    },
    options: {}
}

export class ToFacesPrismBuilder<P extends Plane2 = Plane2> extends StandardBuilder<Prism<P>, { base: BuilderSingleChild<Plane3<P>, {}>, ceil: BuilderSingleChild<Plane3<P>, {}>, side: BuilderSingleChild<Plane3<Rect2>, {}> }, {}> {

    get type(): string {
        return 'to_faces_prism'
    }

    constructor(
        children: {
            base?: Builder<Plane3<P>>
            ceil?: Builder<Plane3<P>>
            side?: Builder<Plane3<Rect2>>
        }
    ) {
        super({
            base: new BuilderSingleChild(children.base ?? EmptyBuilder.VOID, {}),
            ceil: new BuilderSingleChild(children.ceil ?? EmptyBuilder.VOID, {}),
            side: new BuilderSingleChild(children.side ?? EmptyBuilder.VOID, {})
        }, {})
    }

    get structure(): { geo: GeoRegistry; children: { base: { options: Record<string, RandomTypeRegistry>; geo: GeoRegistry; multiple: boolean; }; ceil: { options: Record<string, RandomTypeRegistry>; geo: GeoRegistry; multiple: boolean; }; side: { options: Record<string, RandomTypeRegistry>; geo: GeoRegistry; multiple: boolean; }; }; options: {}; } {
        return TO_FACES_PRISM_STRUCTURE
    }

    static fromData(children: Record<string, BuilderChild>, options: Record<string, Option>): ToFacesPrismBuilder {
        return new ToFacesPrismBuilder(children)
    }

    @TODO()
    @CauseError()
    protected buildChildren(context: Prism<P>, style: GenerationStyle, parameters: GenerationStyle, seed: Seed): BuilderResult[] {
        return [
            this.children.base.builder.build(context.base, style, parameters, seed),
            this.children.ceil.builder.build(context.ceil, style, parameters, seed),
            ...context.base.plane.edge.segments.map((segment) =>
                this.children.side.builder.build(new Plane3(new Rect2(
                    segment[0], new Vec2(segment[0].distance(segment[1]), context.height)
                ), context.base.z, context.direction.add(Direction.DOWN)), style, parameters, seed)
            )
        ]
    }
}