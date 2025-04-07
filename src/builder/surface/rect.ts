//             _____
//         ___/     \___        |  |
//      ##/  _.- _.-    \##  -  |  |                       -
//      ##\#=_  '    _=#/##  |  |  |  /---\  |      |      |   ===\  |  __
//      ##   \\#####//   ##  |  |  |  |___/  |===\  |===\  |   ___|  |==/
//      ##       |       ##  |  |  |  |      |   |  |   |  |  /   |  |
//      ##       |       ##  |  \= \= \====  |   |  |   |  |  \___/  |
//      ##\___   |   ___/
//      ##    \__|__/

import { GenerationStyle } from "../../engineer/data-pack/style/style.js";
import { NodeTypedBuilder } from "../../engineer/editors/rete/nodes/builder.js";
import { Rect2 } from "../../world/bi-geo/plane.js";
import { Plane3 } from "../../world/geo/surface.js";
import { Vec2, Vec4 } from "../../world/vector.js";
import { BuilderResult, SurfaceBuilder } from "../builder.js";
import { Option } from "../option.js";
import { ConstantSquareEnum } from "../random/enum.js";
import type { Seed } from "../random/random.js";
import { ConstantVec2 } from "../random/vec/vec2.js";
import { ConstantVec4 } from "../random/vec/vec4.js";

export type GridAxisAlignmentValue = 'start' | 'center' | 'end' | 'fill'
export enum GridAxisAlignment {
    START = 'start',
    CENTER = 'center',
    END = 'end',
    FILL = 'fill'
}

@NodeTypedBuilder({
    label: 'Grid Builder',
    object: Rect2,
    outputs: {
        child: { object: Rect2, getChildren: (builder) => [builder.child] }
    },
    get: (getChild, getChildren, getOption, materials) => new GridRectBuilder(getChildren('child')[0], {})
})
export class GridRectBuilder extends SurfaceBuilder<Plane3<Rect2>, {
    alignment: Option<[GridAxisAlignmentValue, GridAxisAlignmentValue] | undefined>
    cell: Option<Vec2>
    gap: Option<Vec2>
    padding: Option<Vec4>
}> {

    constructor(
        protected child: SurfaceBuilder<Plane3<Rect2>>,
        options: {
            alignment?: Option<[GridAxisAlignmentValue, GridAxisAlignmentValue] | undefined>
            cell?: Option<Vec2>
            gap?: Option<Vec2>
            padding?: Option<Vec4>
        } = {}
    ) {
        super({
            alignment: options.alignment ?? Option.random(new ConstantSquareEnum<GridAxisAlignmentValue[]>([GridAxisAlignment.FILL, GridAxisAlignment.FILL])),
            cell: options.cell ?? Option.random(new ConstantVec2(Vec2.UNIT)),
            gap: options.gap ?? Option.random(new ConstantVec2(Vec2.ZERO)),
            padding: options.padding ?? Option.random(new ConstantVec4(Vec4.ZERO))
        })
    }

    buildChildren(context: Plane3<Rect2>, style: GenerationStyle, parameters: GenerationStyle, seed: Seed): BuilderResult[] {
        const gap = this.options.gap.get(style, parameters, seed)
        const padding = this.options.padding.get(style, parameters, seed)
        const alignment = this.options.alignment.get(style, parameters, seed)!
        let cell = this.options.cell.get(style, parameters, seed)

        const size = context.plane.size.subtract(new Vec2(padding.b + padding.d, padding.a + padding.c))

        if (context.plane.size.isLess(cell)) {
            if (size.isLess(cell)) {
                console.warn('GridRectBuilder: size is less than a cell with padding')
                return [this.child.build(context, style, parameters, seed)]
            } else {
                console.warn('GridRectBuilder: size is less than a cell')
                const rect = new Rect2(context.plane.pos.add(new Vec2(padding.d, padding.c)), size)
                return [this.child.build(context.withPlane(rect), style, parameters, seed)]
            }
        }

        // TODO fix the repetitions algorithm -> cell.x + gap.x <-
        const repetitions = new Vec2(Math.floor(size.x / (cell.x + gap.x)), Math.floor(size.y / (cell.y + gap.y)))
        if (alignment[0] === GridAxisAlignment.FILL) {
            cell = cell.add(new Vec2((size.x - (repetitions.x * (cell.x + gap.x))) / repetitions.x, 0))
        }
        if (alignment[1] === GridAxisAlignment.FILL) {
            cell = cell.add(new Vec2((size.y - (repetitions.y * (cell.y + gap.y))) / repetitions.y, 0))
        }

        let x = 0
        let y = 0
        if (alignment[0] === GridAxisAlignment.CENTER) {
            x = (size.x - (repetitions.x * (cell.x + gap.x)) - gap.x) / 2
        } else if (alignment[0] === GridAxisAlignment.END) {
            x = size.x - (repetitions.x * (cell.x + gap.x)) - gap.x
        }
        if (alignment[1] === GridAxisAlignment.CENTER) {
            y = (size.y - (repetitions.y * (cell.y + gap.y)) - gap.y) / 2
        } else if (alignment[1] === GridAxisAlignment.END) {
            x = size.y - (repetitions.y * (cell.y + gap.y)) - gap.y
        }

        const results: BuilderResult<Plane3<Rect2>>[] = []
        for (let i = 0; i < repetitions.x; i++) {
            for (let j = 0; j < repetitions.y; j++) {
                const rect = new Rect2(new Vec2(x + (i * (cell.x + gap.x)), y + (j * (cell.y + gap.y))), cell)
                results.push(this.child.build(context.withPlane(rect), style, parameters, seed))
            }
        }

        return results
    }

    get children(): [{
        builder: SurfaceBuilder<Plane3<Rect2>>,
        options: {}
    }] {
        return [{
            builder: this.child,
            options: {}
        }]
    }
}