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
import { Prism, Rect3 } from "../../../world/geo/object.js";
import { Plane3 } from "../../../world/geo/surface.js";
import { Direction, Rotation2, Rotation3 } from "../../../world/quaternion.js";
import { Vec2, Vec3 } from "../../../world/vector.js";
import { Builder, BuilderChild, BuilderResult, BuilderSingleChild, StandardBuilder } from "../../builder.js";
import { EmptyBuilder } from "../../generic/empty.js";
import type { GenerationStyle } from "../../../engineer/data-pack/style/rule.js";
import { GeoRegistry } from "../../../register/geo.js";
import type { RandomTypeRegistry } from "../../../register/random.js";
import type { Option } from "../../option.js";
import { CauseError, TODO } from "../../../dev/decorators.js";

export const TO_FACES_RECT_STRUCTURE = {
    geo: GeoRegistry.RECT3,
    children: {
        north: { options: {}, geo: GeoRegistry.PLANE3, multiple: false },
        east: { options: {}, geo: GeoRegistry.PLANE3, multiple: false },
        south: { options: {}, geo: GeoRegistry.PLANE3, multiple: false },
        west: { options: {}, geo: GeoRegistry.PLANE3, multiple: false },
        top: { options: {}, geo: GeoRegistry.PLANE3, multiple: false },
        bottom: { options: {}, geo: GeoRegistry.PLANE3, multiple: false }
    },
    options: {}
}

export class ToFacesRectBuilder extends StandardBuilder<Rect3, {
    north: BuilderSingleChild<Plane3<Rect2>, {}>,
    east: BuilderSingleChild<Plane3<Rect2>, {}>,
    south: BuilderSingleChild<Plane3<Rect2>, {}>,
    west: BuilderSingleChild<Plane3<Rect2>, {}>,
    top: BuilderSingleChild<Plane3<Rect2>, {}>,
    bottom: BuilderSingleChild<Plane3<Rect2>, {}>
}, {}> {

    get type(): string {
        return 'to_faces_rect'
    }

    constructor(
        children: {
            north?: Builder<Plane3<Rect2>>,
            east?: Builder<Plane3<Rect2>>,
            south?: Builder<Plane3<Rect2>>,
            west?: Builder<Plane3<Rect2>>,
            top?: Builder<Plane3<Rect2>>,
            bottom?: Builder<Plane3<Rect2>>
        }
    ) {
        super({
            north: new BuilderSingleChild(children.north ?? EmptyBuilder.VOID, {}),
            east: new BuilderSingleChild(children.east ?? EmptyBuilder.VOID, {}),
            south: new BuilderSingleChild(children.south ?? EmptyBuilder.VOID, {}),
            west: new BuilderSingleChild(children.west ?? EmptyBuilder.VOID, {}),
            top: new BuilderSingleChild(children.top ?? EmptyBuilder.VOID, {}),
            bottom: new BuilderSingleChild(children.bottom ?? EmptyBuilder.VOID, {})
        }, {})
    }

    get structure() {
        return TO_FACES_RECT_STRUCTURE
    }

    static fromData(children: Record<string, BuilderChild>, options: Record<string, Option>): ToFacesRectBuilder {
        return new ToFacesRectBuilder(children)
    }

    @TODO()
    @CauseError()
    protected buildChildren(context: Rect3, style: GenerationStyle, parameters: GenerationStyle, seed: Seed): BuilderResult[] {
        return [
            this.children.north.builder.build(new Plane3(new Rect2(new Vec2(context.pos.x, context.pos.y), new Vec2(context.size.x, context.size.y)), context.pos.z).rotateAround(Direction.NORTH), style, parameters, seed),
            this.children.east.builder.build(new Plane3(new Rect2(new Vec2(context.pos.x - (context.size.z / 2), context.pos.y), new Vec2(context.size.z, context.size.y)), context.pos.z + (context.size.z / 2)).rotateAround(Direction.EAST), style, parameters, seed),
            this.children.south.builder.build(new Plane3(new Rect2(new Vec2(context.pos.x, context.pos.y), new Vec2(context.size.x, context.size.y)), context.pos.z + context.size.z).rotateAround(Direction.SOUTH), style, parameters, seed),
            this.children.west.builder.build(new Plane3(new Rect2(new Vec2(context.pos.x + context.size.x - (context.size.z / 2), context.pos.y), new Vec2(context.size.z, context.size.y)), context.pos.z + (context.size.z / 2)).rotateAround(Direction.WEST), style, parameters, seed),
            this.children.top.builder.build(new Plane3(new Rect2(new Vec2(context.pos.x, context.pos.y + context.size.y - (context.size.z / 2)), new Vec2(context.size.x, context.size.z)), context.pos.z + (context.size.z / 2)).rotateAround(Direction.UP), style, parameters, seed),
            this.children.bottom.builder.build(new Plane3(new Rect2(new Vec2(context.pos.x, context.pos.y  - (context.size.z / 2)), new Vec2(context.size.x, context.size.z)), context.pos.z + (context.size.z / 2)).rotateAround(Direction.DOWN), style, parameters, seed)
        ]
    }
}