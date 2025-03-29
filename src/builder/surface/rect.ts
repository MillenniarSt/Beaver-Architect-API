//             _____
//         ___/     \___        |  |
//      ##/  _.- _.-    \##  -  |  |                       -
//      ##\#=_  '    _=#/##  |  |  |  /---\  |      |      |   ===\  |  __
//      ##   \\#####//   ##  |  |  |  |___/  |===\  |===\  |   ___|  |==/
//      ##       |       ##  |  |  |  |      |   |  |   |  |  /   |  |
//      ##       |       ##  |  \= \= \====  |   |  |   |  |  \___/  |
//      ##\___   |   ___/
//      ##    \__|__/

import { MaterialReference } from "../../engineer/data-pack/style/material.js";
import { GenerationStyle } from "../../engineer/data-pack/style/style.js";
import { NodeTypedBuilder } from "../../engineer/editors/rete/nodes/builder.js";
import { Option } from "../../util/option.js";
import { RandomList, RandomVec2, RandomVec4, Seed } from "../../util/random.js";
import { Rect2 } from "../../world/bi-geo/plane.js";
import { Plane3 } from "../../world/geo/surface.js";
import { Vec2, Vec4 } from "../../world/vector.js";
import { BuilderResult, SurfaceBuilder } from "../builder.js";
import { SingleChildBuilder } from "../collective.js";
import { EmptyBuilder } from "../generic/empty.js";

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
    get: (getChild, getChildren, getOption, materials) => new GridRectBuilder(getChildren('child')[0] ?? new EmptyBuilder(), {}, materials)
})
@SingleChildBuilder((json) => {
    return {
        alignment: Option.fromJson(json.alignment),
        cell: Option.fromJson(json.cell),
        gap: Option.fromJson(json.gap),
        padding: Option.fromJson(json.padding)
    }
})
export class GridRectBuilder extends SurfaceBuilder<Plane3<Rect2>, {
    alignment: Option<[GridAxisAlignment, GridAxisAlignment] | undefined>
    cell: Option<Vec2>
    gap: Option<Vec2>
    padding: Option<Vec4>
}, {}> {

    constructor(
        protected child: SurfaceBuilder<Plane3<Rect2>>,
        options: {
            alignment?: Option<[GridAxisAlignment, GridAxisAlignment] | undefined>
            cell?: Option<Vec2>
            gap?: Option<Vec2>
            padding?: Option<Vec4>
        } = {},
        materials: RandomList<MaterialReference> = new RandomList()
    ) {
        super({
            alignment: options.alignment ?? new Option(RandomList.constant([GridAxisAlignment.FILL, GridAxisAlignment.FILL])),
            cell: options.cell ?? new Option(RandomVec2.constant(1)),
            gap: options.gap ?? new Option(RandomVec2.constant(0)),
            padding: options.padding ?? new Option(RandomVec4.constant(0))
        }, materials)
    }

    buildChildren(context: Plane3<Rect2>, style: GenerationStyle, seed: Seed): BuilderResult[] {
        const gap = this.options.gap.get(style, seed)
        const padding = this.options.padding.get(style, seed)
        const alignment = this.options.alignment.get(style, seed)!
        let cell = this.options.cell.get(style, seed)

        const size = context.plane.size.subtract(new Vec2(padding.b + padding.d, padding.a + padding.c))

        if (context.plane.size.isLess(cell)) {
            if (size.isLess(cell)) {
                console.warn('GridRectBuilder: size is less than a cell with padding')
                return [this.child.build(context, style, seed)]
            } else {
                console.warn('GridRectBuilder: size is less than a cell')
                const rect = new Rect2(context.plane.pos.add(new Vec2(padding.d, padding.c)), size)
                return [this.child.build(context.withPlane(rect), style, seed)]
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
                results.push(this.child.build(context.withPlane(rect), style, seed))
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