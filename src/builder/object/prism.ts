import { FormData, FormOutput } from '../../util/form.js';
import { RandomNumber, RandomVec2, Seed } from '../../util/random.js';
import { Plane2 } from '../../world/bi-geo/plane.js';
import { Prism } from '../../world/geo/object.js';
import { BuilderResult, ChildrenManager, ObjectBuilder, EmptyBuilder } from '../builder.js';
import { builderFromJson, NamedBuilder } from '../collective.js';

export enum FlexAlignment {
    START = 'start',
    CENTER = 'center',
    END = 'end',
    FILL = 'fill'
}

export enum RepetitionMode {
    NONE = 'none',
    BLOCK = 'block',
    BUILDER = 'builder'
}

@NamedBuilder()
export class FlexPrismBuilder<P extends Plane2 = Plane2> extends ObjectBuilder<Prism<P>> implements ChildrenManager {

    protected _children: {
        builder: ObjectBuilder<Prism<P>>,
        height: RandomNumber
    }[] = []

    protected alignment: FlexAlignment = FlexAlignment.START
    protected repeat: RepetitionMode = RepetitionMode.NONE
    protected gap: RandomNumber = RandomNumber.constant(0)
    protected padding: RandomVec2 = RandomVec2.constant(0)

    static create<P extends Plane2 = Plane2>(data: {
        children: {
            builder: ObjectBuilder<Prism<P>>,
            height: RandomNumber
        }[]
        alignment: FlexAlignment
        repeat: RepetitionMode
        gap: RandomNumber
        padding: RandomVec2
    }): FlexPrismBuilder<P> {
        const builder = new FlexPrismBuilder<P>()
        builder._children = data.children ?? []
        builder.alignment = data.alignment ?? FlexAlignment.START
        builder.repeat = data.repeat ?? RepetitionMode.NONE
        builder.gap = data.gap ?? RandomNumber.constant(0)
        builder.padding = data.padding ?? RandomVec2.constant(0)
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
        this._children.push({
            builder: new EmptyBuilder(),
            height: RandomNumber.constant(1)
        })
    }

    protected buildChildren(context: Prism<P>, seed: Seed): BuilderResult[] {
        const padding = this.padding.seeded(seed)
        const gap = this.gap.seeded(seed)
        const size = context.height - padding.x - padding.y
        const base = context.y + padding.x

        if (size <= 0) {
            console.warn('FlexPrismBuilder: size is less than 0')
            return []
        }

        let childrenHeights = this._children.map((child) => child.height.seeded(seed))
        let childrenHeight = -gap
        childrenHeights.forEach((height) => {
            childrenHeight += height + gap
        })

        if (childrenHeight > size) {
            console.warn('FlexPrismBuilder: children height is greater than size')
        }

        let repetitions = this.children.length
        if (this.repeat === RepetitionMode.BLOCK || this.repeat === RepetitionMode.BUILDER) {
            repetitions = Math.floor(size / childrenHeight) * this.children.length
            childrenHeight = childrenHeight * (repetitions / this.children.length) + gap * (repetitions - 1)
        }
        if (this.repeat === RepetitionMode.BUILDER) {
            for (let i = 0; i < this.children.length; i++) {
                if (childrenHeight + childrenHeights[i] <= size) {
                    repetitions++
                    childrenHeight += childrenHeights[i] + gap
                } else {
                    break
                }
            }
        }

        if (this.alignment === FlexAlignment.FILL) {
            const stretch = (size - childrenHeight) / repetitions

            let results: BuilderResult[] = []
            let y = base
            for (let i = 0; i < repetitions; i++) {
                const height = childrenHeights[i % this.children.length] + stretch
                const prism = new Prism<P>(context.plane, y, height)
                y += height + gap
                results.push(this.children[i % this.children.length].build(prism, seed))
            }
            return results
        } else {
            let y: number = 0
            switch (this.alignment) {
                case FlexAlignment.START:
                    y = base; break
                case FlexAlignment.END:
                    y = base + size - childrenHeight; break
                case FlexAlignment.CENTER:
                    y = base + (size - childrenHeight) / 2; break
            }

            let results: BuilderResult[] = []
            for (let i = 0; i < repetitions; i++) {
                const height = childrenHeights[i % this.children.length]
                const prism = new Prism<P>(context.plane, y, height)
                y += height + gap
                results.push(this.children[i % this.children.length].build(prism, seed))
            }
            return results
        }
    }

    get children(): ObjectBuilder<Prism<P>>[] {
        return this._children.map((child) => child.builder)
    }

    fromJsonData(data: any): void {
        this._children = data.children ? data.children.map((child: any) => {
            return {
                builder: builderFromJson(child.type),
                height: RandomNumber.fromJson(child.height)
            }
        }) : []
        this.alignment = data.alignment ?? FlexAlignment.START
        this.repeat = data.repeat ?? RepetitionMode.NONE
        this.gap = data.gap ? RandomNumber.fromJson(data.gap) : RandomNumber.constant(0)
        this.padding = data.padding ? RandomVec2.fromJson(data.padding) : RandomVec2.constant(0)
    }

    toJsonData(): {} {
        return {
            children: this._children.map((child) => {
                return {
                    builder: child.builder.toJson(),
                    height: child.height.toJson()
                }
            }),
            alignment: this.alignment,
            repeat: this.repeat,
            gap: this.gap.toJson(),
            padding: this.padding.toJson()
        }
    }
}