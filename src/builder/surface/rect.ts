import { MaterialReference } from "../../engineer/data-pack/style/material.js";
import { FormData, FormOutput } from "../../util/form.js";
import { RandomInteger, RandomList, RandomVec2, RandomVec4, Seed } from "../../util/random.js";
import { Rect2 } from "../../world/bi-geo/plane.js";
import { Plane3 } from "../../world/geo/surface.js";
import { Vec2 } from "../../world/vector.js";
import { Builder, BuilderResult, ChildrenManager, SurfaceBuilder } from "../builder.js";
import { NamedBuilder } from "../collective.js";
import { EmptySurfaceBuilder } from "./empty.js";

export enum GridAxisAlignment {
    START = 'start',
    CENTER = 'center',
    END = 'end',
    FILL = 'fill'
}

@NamedBuilder(GridRectBuilder.fromJson)
export class GridRectBuilder extends SurfaceBuilder<Plane3<Rect2>> implements ChildrenManager {

    protected _children: SurfaceBuilder<Plane3<Rect2>>[] = []

    protected alignment: [GridAxisAlignment, GridAxisAlignment] = [GridAxisAlignment.FILL, GridAxisAlignment.FILL]
    protected cell: RandomVec2 = RandomVec2.constant(1)
    protected gap: RandomVec2 = RandomVec2.constant(0)
    protected padding: RandomVec4 = RandomVec4.constant(0)
    protected randomGetter: RandomInteger = RandomInteger.constant(0)

    constructor(data: {
        children?: SurfaceBuilder<Plane3<Rect2>>[]
        alignment?: [GridAxisAlignment, GridAxisAlignment]
        cell?: RandomVec2
        gap?: RandomVec2
        padding?: RandomVec4
        randomGetter?: RandomInteger
    } = {},
        materials: RandomList<MaterialReference> = new RandomList()
    ) {
        super(materials)
        this._children = data.children ?? []
        this.alignment = data.alignment ?? [GridAxisAlignment.FILL, GridAxisAlignment.FILL]
        this.cell = data.cell ?? RandomVec2.constant(1)
        this.gap = data.gap ?? RandomVec2.constant(0)
        this.padding = data.padding ?? RandomVec4.constant(0)
        this.randomGetter = data.randomGetter ?? new RandomInteger(0, this._children.length -1)
    }

    static fromJson(json: any): GridRectBuilder {
        const data = json.data
        return new GridRectBuilder({
            children: data.children.map((child: any) => Builder.fromJson(child)),
            cell: RandomVec2.fromJson(data.cell),
            gap: RandomVec2.fromJson(data.gap),
            padding: RandomVec4.fromJson(data.padding),
            randomGetter: RandomInteger.fromJson(data.randomGetter)
        }, RandomList.fromJson(json.materials, MaterialReference.fromJson))
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
        this._children.push(new EmptySurfaceBuilder())
        this.randomGetter = new RandomInteger(0, this._children.length -1)
    }

    buildChildren(context: Plane3<Rect2>, seed: Seed): BuilderResult[] {
        const gap = this.gap.seeded(seed)
        const padding = this.padding.seeded(seed)
        let cell = this.cell.seeded(seed)

        const size = context.plane.size.subtract(new Vec2(padding.b + padding.d, padding.a + padding.c))

        if (context.plane.size.isLess(cell)) {
            if (size.isLess(cell)) {
                console.warn('GridRectBuilder: size is less than a cell with padding')
                return [this._children[this.randomGetter.seeded(seed)].build(context, seed)]
            } else {
                console.warn('GridRectBuilder: size is less than a cell')
                const rect = new Rect2(context.plane.pos.add(new Vec2(padding.d, padding.c)), size)
                return [this._children[this.randomGetter.seeded(seed)].build(context.withPlane(rect), seed)]
            }
        }

        // TODO fix the repetitions algorithm -> cell.x + gap.x <-
        const repetitions = new Vec2(Math.floor(size.x / (cell.x + gap.x)), Math.floor(size.y / (cell.y + gap.y)))
        if (this.alignment[0] === GridAxisAlignment.FILL) {
            cell = cell.add(new Vec2((size.x - (repetitions.x * (cell.x + gap.x))) / repetitions.x, 0))
        }
        if (this.alignment[1] === GridAxisAlignment.FILL) {
            cell = cell.add(new Vec2((size.y - (repetitions.y * (cell.y + gap.y))) / repetitions.y, 0))
        }

        let x = 0
        let y = 0
        if (this.alignment[0] === GridAxisAlignment.CENTER) {
            x = (size.x - (repetitions.x * (cell.x + gap.x)) - gap.x) / 2
        } else if (this.alignment[0] === GridAxisAlignment.END) {
            x = size.x - (repetitions.x * (cell.x + gap.x)) - gap.x
        }
        if (this.alignment[1] === GridAxisAlignment.CENTER) {
            y = (size.y - (repetitions.y * (cell.y + gap.y)) - gap.y) / 2
        } else if (this.alignment[1] === GridAxisAlignment.END) {
            x = size.y - (repetitions.y * (cell.y + gap.y)) - gap.y
        }

        const results: BuilderResult<Plane3<Rect2>>[] = []
        for (let i = 0; i < repetitions.x; i++) {
            for (let j = 0; j < repetitions.y; j++) {
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