import { FormData, FormOutput } from "../../util/form.js";
import { RandomInteger, RandomVec2, RandomVec4, Seed } from "../../util/random.js";
import { Rect2 } from "../../world/bi-geo/plane.js";
import { Plane3 } from "../../world/geo/plane.js";
import { Vec2 } from "../../world/vector.js";
import { Builder, BuilderResult, ChildrenManager, PlaneBuilder, EmptyBuilder } from "../builder.js";
import { builderFromJson } from "../collective.js";

export enum GridAxisAlignment {
    START = 'start',
    CENTER = 'center',
    END = 'end',
    FILL = 'fill'
}

export class GridRectBuilder extends PlaneBuilder<Rect2> implements ChildrenManager {

    protected _children: PlaneBuilder<Rect2>[] = []

    protected alignment: [GridAxisAlignment, GridAxisAlignment] = [GridAxisAlignment.FILL, GridAxisAlignment.FILL]
    protected cell: RandomVec2 = RandomVec2.constant(1)
    protected gap: RandomVec2 = RandomVec2.constant(0)
    protected padding: RandomVec4 = RandomVec4.constant(0)
    protected randomGetter: RandomInteger = RandomInteger.constant(0)

    static create(properties: {
        children: PlaneBuilder<Rect2>[]
        alignment: [GridAxisAlignment, GridAxisAlignment]
        cell: RandomVec2
        gap: RandomVec2
        padding: RandomVec4
        randomGetter: RandomInteger
    }): GridRectBuilder {
        const builder = new GridRectBuilder()
        builder._children = properties.children ?? []
        builder.alignment = properties.alignment ?? [GridAxisAlignment.FILL, GridAxisAlignment.FILL]
        builder.cell = properties.cell ?? RandomVec2.constant(1)
        builder.gap = properties.gap ?? RandomVec2.constant(0)
        builder.padding = properties.padding ?? RandomVec4.constant(0)
        builder.randomGetter = properties.randomGetter ?? new RandomInteger(0, builder._children.length)
        return builder
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
        this._children.push(new EmptyBuilder())
        this.randomGetter = new RandomInteger(0, this._children.length)
    }

    buildChildren(context: Plane3<Rect2>, seed: Seed): BuilderResult[] {
        const gap = this.gap.seeded(seed)
        const padding = this.padding.seeded(seed)
        let cell = this.cell.seeded(seed)

        const size = context.plane.size.subtract(new Vec2(padding.b + padding.d, padding.a + padding.c))

        if(context.plane.size.isLess(cell)) {
            if(size.isLess(cell)) {
                console.warn('GridRectBuilder: size is less than a cell with padding')
                return [this._children[this.randomGetter.seeded(seed)].build(context, seed)]
            } else {
                console.warn('GridRectBuilder: size is less than a cell')
                const rect = new Rect2(context.plane.pos.add(new Vec2(padding.d, padding.c)), size)
                return [this._children[this.randomGetter.seeded(seed)].build(context.withPlane(rect), seed)]
            }
        }

        const repetitions = new Vec2(Math.floor(size.x / (cell.x + gap.x)), Math.floor(size.y / (cell.y + gap.y)))
        if(this.alignment[0] === GridAxisAlignment.FILL) {
            cell = cell.add(new Vec2((size.x - (repetitions.x * (cell.x + gap.x))) / repetitions.x, 0))
        }
        if(this.alignment[1] === GridAxisAlignment.FILL) {
            cell = cell.add(new Vec2((size.y - (repetitions.y * (cell.y + gap.y))) / repetitions.y, 0))
        }

        let x = 0
        let y = 0
        if(this.alignment[0] === GridAxisAlignment.CENTER) {
            x = (size.x - (repetitions.x * (cell.x + gap.x)) - gap.x) / 2
        } else if(this.alignment[0] === GridAxisAlignment.END) {
            x = size.x - (repetitions.x * (cell.x + gap.x)) - gap.x
        }
        if(this.alignment[1] === GridAxisAlignment.CENTER) {
            y = (size.y - (repetitions.y * (cell.y + gap.y)) - gap.y) / 2
        } else if(this.alignment[1] === GridAxisAlignment.END) {
            x = size.y - (repetitions.y * (cell.y + gap.y)) - gap.y
        }

        const results: BuilderResult<Plane3<Rect2>>[] = []
        for(let i = 0; i < repetitions.x; i++) {
            for(let j = 0; j < repetitions.y; j++) {
                const builder = this._children[this.randomGetter.seeded(seed)]
                const rect = new Rect2(new Vec2(x + (i * (cell.x + gap.x)), y + (j * (cell.y + gap.y))), cell)
                results.push(builder.build(context.withPlane(rect), seed))
            }
        }

        return results
    }

    get children(): Builder<any>[] {
        return this._children
    }

    fromJsonData(data: any): void {
        this._children = data.children.map((child: any) => builderFromJson(child))
        this.cell = RandomVec2.fromJson(data.cell)
        this.gap = RandomVec2.fromJson(data.gap)
        this.padding = RandomVec4.fromJson(data.padding)
        this.randomGetter = RandomInteger.fromJson(data.randomGetter)
    }

    toJsonData(): {} {
        return {
            children: this._children.map((child) => child.toJson()),
            cell: this.cell.toJson(),
            gap: this.gap.toJson(),
            padding: this.padding.toJson(),
            randomGetter: this.randomGetter.toJson()
        }
    }
}