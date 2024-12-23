import { v4 } from "uuid"
import { FormDataInput, FormDataOutput, RelativeNumber, SizeLimitation } from "../../util.js"
import { Dimension3D, Pos3D, Size3D } from "../../world/world3D.js"
import { Anchor, BuilderElement, BuilderElementNode, BuilderElementUpdate, EditGraph, ElementView } from "./elements.js"
import { BuilderElementArchitect } from "./architect.js"
import { CheckUpdate, TreeUpdate } from "../../connection/directives/update.js"

export class BuilderElementGroup extends BuilderElement {

    constructor(
        public label: string,
        private dimension: Dimension3D,
        public children: BuilderElement[] = [],
        public flex: FlexGroup = new FlexGroup(),
        limitation: SizeLimitation = SizeLimitation.unlimited(),
        anchor: Anchor = new Anchor(),
        id?: string
    ) {
        super(id ?? v4(), limitation, anchor)
    }

    static fromJson(json: any): BuilderElementGroup {
        return new BuilderElementGroup(json.label, Dimension3D.fromJson(json.dimension), json.children.map(
            (child: { type: string }) => BuilderElementGroup.getChildren[child.type](child)
        ), FlexGroup.fromJson(json.flex), SizeLimitation.fromJson(json.limitation), Anchor.fromJson(json.anchor), json.id)
    }

    static getChildren: Record<string, (json: any) => BuilderElement> = {
        group: BuilderElementGroup.fromJson,
        architect: BuilderElementArchitect.fromJson
    }

    static generate(label: string, children: BuilderElement[]): BuilderElementGroup {
        let dimension = Dimension3D.ZERO
        children.forEach((child) => {
            dimension = dimension.plus(child.getDimension())
        })

        return new BuilderElementGroup(label, dimension, children)
    }

    async init(): Promise<void> {
        for (let i = 0; i < this.children.length; i++) {
            await this.children[i].init()
        }
    }

    getDimension(): Dimension3D {
        return this.dimension
    }

    async setDimension(dimension: Dimension3D): Promise<BuilderElementUpdate> {
        if (this.dimension.equals(dimension)) {
            return {}
        }

        this.flex.update(this.dimension, dimension, this.children)
        this.dimension = dimension
        return {
            view: this.view(),
            editGraph: true,
            form: true
        }
    }

    node(): BuilderElementNode {
        return {
            id: this.id,
            label: this.label,
            isGroup: true,
            children: this.children?.map((child) => child.node())
        }
    }

    view(): ElementView {
        return {
            id: this.id,
            objects: [],
            children: this.children.map((child) => child.view())
        }
    }

    async form(): Promise<FormDataInput[]> {
        return [
            {
                id: 'pos',
                name: 'Position',
                type: 'vec3',
                value: this.dimension.pos.toJSON()
            },
            {
                id: 'size',
                name: 'Size',
                type: 'vec3',
                value: this.dimension.size.toJSON()
            }
        ]
    }

    async editGraph(): Promise<EditGraph> {
        return {
            modes: {
                move: [1, 1, 1]
            },
            dimension: this.dimension.toJSON()
        }
    }

    async updateForm(updates: FormDataOutput): Promise<BuilderElementUpdate> {
        const dimensionUpdates = await this.setDimension(new Dimension3D(
            updates.pos ? Pos3D.fromJson(updates.pos) : this.dimension.pos,
            updates.size ? Size3D.fromJson(updates.size) : this.dimension.size
        ))
        return dimensionUpdates
    }

    toJson(): {} {
        return {
            id: this.id,
            type: 'group',
            label: this.label,
            dimension: this.dimension.toJSON(),
            children: this.children?.map((child) => child.toJson()),
            limitation: this.limitation.toJson(),
            anchor: this.anchor.toJson(),
            flex: this.flex.toJson(),
        }
    }

    indexOfChild(id: string): number {
        return this.children.findIndex((child) => child.id === id)
    }
}

export class FlexGroup {

    constructor(
        public x?: FlexGroupAxis,
        public y?: FlexGroupAxis,
        public z?: FlexGroupAxis
    ) { }

    static fromJson(json: any): FlexGroup {
        return new FlexGroup(
            json.x ? FlexGroupAxis.fromJson(json.x) : undefined,
            json.y ? FlexGroupAxis.fromJson(json.y) : undefined,
            json.z ? FlexGroupAxis.fromJson(json.z) : undefined
        )
    }

    update(from: Dimension3D, to: Dimension3D, children: BuilderElement[]) {
        let xUpdate: [number, number][] = []
        let yUpdate: [number, number][] = []
        let zUpdate: [number, number][] = []

        if (this.x) {
            xUpdate = this.x.update(
                [to.pos.x, to.size.width],
                children.map((child) => [child.getDimension().pos.x, child.getDimension().size.width])
            )
        } else {
            children.forEach((child) => {
                xUpdate.push(child.anchor.updateAxisPos(
                    child.anchor.x,
                    [from.pos.x, from.size.width], [to.pos.x, to.size.width], [child.getDimension().pos.x, child.getDimension().size.width]
                ))
            })
        }
        if (this.y) {
            yUpdate = this.y.update(
                [to.pos.y, to.size.height],
                children.map((child) => [child.getDimension().pos.y, child.getDimension().size.height])
            )
        } else {
            children.forEach((child) => {
                yUpdate.push(child.anchor.updateAxisPos(
                    child.anchor.y,
                    [from.pos.y, from.size.height], [to.pos.y, to.size.height], [child.getDimension().pos.y, child.getDimension().size.height]
                ))
            })
        }
        if (this.z) {
            zUpdate = this.z.update(
                [to.pos.z, to.size.length],
                children.map((child) => [child.getDimension().pos.z, child.getDimension().size.length])
            )
        } else {
            children.forEach((child) => {
                zUpdate.push(child.anchor.updateAxisPos(
                    child.anchor.z,
                    [from.pos.z, from.size.length], [to.pos.z, to.size.length], [child.getDimension().pos.z, child.getDimension().size.length]
                ))
            })
        }

        children.forEach((child, i) => {
            child.setDimension(new Dimension3D(
                new Pos3D(xUpdate[i][0], yUpdate[i][0], zUpdate[i][0]),
                new Size3D(xUpdate[i][1], yUpdate[i][1], zUpdate[i][1])
                    .range(child.limitation.min ?? Size3D.ZERO, child.limitation.max ?? new Size3D(Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE))
            ))
        })
    }

    toJson(): {} {
        return {
            x: this.x?.toJson(),
            y: this.y?.toJson(),
            z: this.z?.toJson()
        }
    }
}

export enum FlexGroupAlignment {
    LEFT = 'left',
    CENTER = 'center',
    RIGHT = 'right',
    FILL = 'fill'
}

export enum RepetitionMode {
    NONE = 'none',
    BLOCK = 'block',
    ELEMENT = 'element'
}

export class FlexGroupAxis {

    private _repetitions = 1

    constructor(
        public alignment: FlexGroupAlignment,
        public repeat: RepetitionMode,
        public gap: RelativeNumber | undefined,
        public padding: [RelativeNumber, RelativeNumber]
    ) { }

    static fromJson(json: any): FlexGroupAxis {
        return new FlexGroupAxis(json.alignment, json.repeat,
            json.gap ? RelativeNumber.fromJson(json.gap) : undefined,
            [RelativeNumber.fromJson(json.padding[0]), RelativeNumber.fromJson(json.padding[1])]
        )
    }

    update(dimension: [number, number], values: [number, number][]): [number, number][] {
        const size = dimension[1] - this.padding[0].get(dimension[1]) - this.padding[1].get(dimension[1])
        if (this.alignment === FlexGroupAlignment.FILL) {
            if (this.repeat === RepetitionMode.NONE) {
                this._repetitions = values.length

                if (values.length === 1) {
                    return [[dimension[0] + this.padding[0].get(dimension[1]), size]]
                } else if (this.gap) {
                    const gap = this.gap.get(dimension[1])
                    const valueSize = (size - (gap * (values.length - 1))) / values.length
                    return values.map((value, i) => [dimension[0] + this.padding[0].get(dimension[1]) + (valueSize * i) + (gap * i), valueSize])
                } else {
                    let valuesSizes: number[] = []
                    values.forEach((value, i) => {
                        valuesSizes.push((valuesSizes[i - 1] ?? 0) + value[1])
                    })
                    const gap = (size - valuesSizes[valuesSizes.length - 1]) / (values.length - 1)
                    return values.map((value, i) => [dimension[0] + this.padding[0].get(dimension[1]) + valuesSizes[i] + (gap * i), value[1]])
                }
            } else {
                let valuesSizes: number[] = []
                values.forEach((value, i) => {
                    valuesSizes.push((valuesSizes[i - 1] ?? 0) + value[1] + (i > 0 && this.gap ? this.gap.get(dimension[1]) : 0))
                })

                if (this.repeat === RepetitionMode.BLOCK) {
                    this._repetitions = Math.round(size / valuesSizes[valuesSizes.length - 1])

                    if (this.gap) {
                        const gap = this.gap.get(dimension[1])
                        const stretch = (size - (this._repetitions * valuesSizes[valuesSizes.length - 1])) / values.length
                        return values.map((value, i) => [dimension[0] + this.padding[0].get(dimension[1]) + valuesSizes[i] + (gap * i), value[1] + stretch])
                    } else {
                        const gap = (size - (this._repetitions * valuesSizes[valuesSizes.length - 1])) / values.length
                        return values.map((value, i) => [dimension[0] + this.padding[0].get(dimension[1]) + valuesSizes[i] + (gap * i), value[1]])
                    }
                } else {
                    //TODO
                    return [[0, 0]]
                }
            }
        } else {
            const gap = this.gap?.get(dimension[1]) ?? 0
            let iPos = dimension[0]
            let ordered = values.map((value) => {
                const r: [number, number] = [iPos, value[1]]
                iPos += value[1] + gap
                return r
            })

            if (this.repeat === RepetitionMode.BLOCK) {
                this._repetitions = Math.floor(size / (iPos - dimension[0]))
                iPos += iPos * (this._repetitions - 1)
            } else if (this.repeat === RepetitionMode.ELEMENT) {
                this._repetitions = Math.floor(size / (iPos - dimension[0]))
                iPos += iPos * (this._repetitions - 1)
                for (let i = 0; i < values.length; i++) {
                    if (iPos + values[i][1] + gap > size) {
                        break
                    }
                    this._repetitions++
                    iPos += values[i][1] + gap
                }
            } else {
                this._repetitions = values.length
            }

            let start: number
            switch (this.alignment) {
                case FlexGroupAlignment.LEFT:
                    start = dimension[0] + this.padding[0].get(dimension[1])
                case FlexGroupAlignment.RIGHT:
                    start = iPos - gap - this.padding[1].get(dimension[1])
                case FlexGroupAlignment.CENTER:
                    start = dimension[0] + this.padding[0].get(dimension[1]) + (size - iPos - dimension[0] - gap / 2)
            }
            return ordered.map((child) => [child[0] + start, child[1]])
        }
    }

    get repetitions(): number {
        return this._repetitions
    }

    toJson(): {} {
        return {
            alignment: this.alignment,
            repeat: this.repeat,
            gap: this.gap?.toJson(),
            padding: this.padding.map((p) => p.toJson())
        }
    }
}