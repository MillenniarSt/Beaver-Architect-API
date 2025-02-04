import { MaterialReference } from "../../engineer/data-pack/style/material.js";
import { GenerationStyle } from "../../engineer/data-pack/style/style.js";
import { FormData, FormOutput } from "../../util/form.js";
import { ObjectOption, Vec2Option, Vec4Option } from "../../util/option.js";
import { RandomInteger, RandomList, RandomVec2, RandomVec4, Seed } from "../../util/random.js";
import { Rect2 } from "../../world/bi-geo/plane.js";
import { Plane3 } from "../../world/geo/surface.js";
import { Vec2 } from "../../world/vector.js";
import { Builder, BuilderResult, ChildrenManager, SurfaceBuilder } from "../builder.js";
import { NamedBuilder } from "../collective.js";
import { EmptyBuilder } from "../generic/empty.js";

export enum GridAxisAlignment {
    START = 'start',
    CENTER = 'center',
    END = 'end',
    FILL = 'fill'
}

@NamedBuilder(GridRectBuilder.fromJson)
export class GridRectBuilder extends SurfaceBuilder<Plane3<Rect2>, {
    alignment: ObjectOption<[GridAxisAlignment, GridAxisAlignment]>
    cell: Vec2Option
    gap: Vec2Option
    padding: Vec4Option
}> implements ChildrenManager {

    protected randomGetter: RandomInteger

    constructor(
        protected _children: SurfaceBuilder<Plane3<Rect2>>[],
        options: {
            alignment?: ObjectOption<[GridAxisAlignment, GridAxisAlignment]>
            cell?: Vec2Option
            gap?: Vec2Option
            padding?: Vec4Option
        } = {},
        materials: RandomList<MaterialReference> = new RandomList(),
        randomGetter?: RandomInteger
    ) {
        super({
            alignment: options.alignment ?? new ObjectOption(RandomList.constant([GridAxisAlignment.FILL, GridAxisAlignment.FILL])),
            cell: options.cell ?? new Vec2Option(RandomVec2.constant(1)),
            gap: options.gap ?? new Vec2Option(RandomVec2.constant(0)),
            padding: options.padding ?? new Vec4Option(RandomVec4.constant(0))
        }, materials)
        this.randomGetter = randomGetter ?? new RandomInteger(0, this._children.length - 1)
    }

    static fromJson(json: any): GridRectBuilder {
        return new GridRectBuilder(
            json.data.children.map((child: any) => Builder.fromJson(child)),
            {
                alignment: ObjectOption.fromJson(json.options.alignment),
                cell: Vec2Option.fromJson(json.options.cell),
                gap: Vec2Option.fromJson(json.options.gap),
                padding: Vec4Option.fromJson(json.options.padding)
            },
            RandomList.fromJson(json.materials, MaterialReference.fromJson),
            RandomInteger.fromJson(json.data.randomGetter)
        )
    }

    form(): FormData {
        return {
            inputs: [
                // TODO
            ]
        }
    }

    edit(output: FormOutput): void {
        // TODO
    }

    canAddChild(): boolean {
        return true
    }

    addChild(): void {
        this._children.push(new EmptyBuilder('surface'))
        this.randomGetter = new RandomInteger(0, this._children.length - 1)
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
                return [this._children[this.randomGetter.seeded(seed)].build(context, style, seed)]
            } else {
                console.warn('GridRectBuilder: size is less than a cell')
                const rect = new Rect2(context.plane.pos.add(new Vec2(padding.d, padding.c)), size)
                return [this._children[this.randomGetter.seeded(seed)].build(context.withPlane(rect), style, seed)]
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
                const builder = this._children[this.randomGetter.seeded(seed)]
                const rect = new Rect2(new Vec2(x + (i * (cell.x + gap.x)), y + (j * (cell.y + gap.y))), cell)
                results.push(builder.build(context.withPlane(rect), style, seed))
            }
        }

        return results
    }

    get children(): Builder<any>[] {
        return this._children
    }

    toJsonData(): {} {
        return {
            children: this._children.map((child) => child.toJson()),
            randomGetter: this.randomGetter.toJson()
        }
    }
}