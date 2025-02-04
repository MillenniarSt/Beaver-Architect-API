import { MaterialReference } from '../../engineer/data-pack/style/material.js';
import { GenerationStyle } from '../../engineer/data-pack/style/style.js';
import { FormData, FormOutput } from '../../util/form.js';
import { NumberOption, ObjectOption, Vec2Option } from '../../util/option.js';
import { RandomList, RandomNumber, RandomVec2, Seed } from '../../util/random.js';
import { Plane2 } from '../../world/bi-geo/plane.js';
import { Prism } from '../../world/geo/object.js';
import { Vec3 } from '../../world/vector.js';
import { Builder, BuilderResult, ChildrenManager, ObjectBuilder } from '../builder.js';
import { NamedBuilder } from '../collective.js';
import { EmptyBuilder } from '../generic/empty.js';

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

@NamedBuilder(FlexPrismBuilder.fromJson)
export class FlexPrismBuilder<P extends Plane2 = Plane2> extends ObjectBuilder<Prism<P>, {
    alignment: ObjectOption<FlexAlignment>
    repeat: ObjectOption<RepetitionMode>
    gap: NumberOption
    padding: Vec2Option
}> implements ChildrenManager {

    constructor(
        protected _children: {
            builder: ObjectBuilder<Prism<P>>,
            height: RandomNumber
        }[],
        options: {
            alignment?: ObjectOption<FlexAlignment>
            repeat?: ObjectOption<RepetitionMode>
            gap?: NumberOption
            padding?: Vec2Option
        } = {},
        materials: RandomList<MaterialReference> = new RandomList()
    ) {
        super({
            alignment: options.alignment ?? new ObjectOption(FlexAlignment.START),
            repeat: options.repeat ?? new ObjectOption(RepetitionMode.NONE),
            gap: options.gap ?? new NumberOption(RandomNumber.constant(0)),
            padding: options.padding ?? new Vec2Option(RandomVec2.constant(0))
        }, materials)
    }

    static fromJson(json: any): FlexPrismBuilder {
        const data = json.data
        return new FlexPrismBuilder(
            json.data.children.map((child: any) => {
                return {
                    builder: Builder.fromJson(child.builder),
                    height: RandomNumber.fromJson(child.height)
                }
            }),
            {
                alignment: ObjectOption.fromJson(json.options.alignment),
                repeat: ObjectOption.fromJson(json.options.repeat),
                gap: NumberOption.fromJson(json.options.gap),
                padding: Vec2Option.fromJson(json.options.padding)
            },
            RandomList.fromJson(json.materials, MaterialReference.fromJson)
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
        this._children.push({
            builder: new EmptyBuilder('object'),
            height: RandomNumber.constant(1)
        })
    }

    protected buildChildren(context: Prism<P>, style: GenerationStyle, seed: Seed): BuilderResult[] {
        const padding = this.options.padding.get(style, seed)
        const gap = this.options.gap.get(style, seed)
        const repeat = this.options.repeat.get(style, seed)
        const alignment = this.options.alignment.get(style, seed)
        const size = context.height - padding.x - padding.y
        const base = context.base.z + padding.x

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
        if (repeat === RepetitionMode.BLOCK || repeat === RepetitionMode.BUILDER) {
            repetitions = Math.floor(size / childrenHeight) * this.children.length
            childrenHeight = childrenHeight * (repetitions / this.children.length) + gap * (repetitions - 1)
        }
        if (repeat === RepetitionMode.BUILDER) {
            for (let i = 0; i < this.children.length; i++) {
                if (childrenHeight + childrenHeights[i] <= size) {
                    repetitions++
                    childrenHeight += childrenHeights[i] + gap
                } else {
                    break
                }
            }
        }

        if (alignment === FlexAlignment.FILL) {
            const stretch = (size - childrenHeight) / repetitions

            let results: BuilderResult[] = []
            let z = base
            for (let i = 0; i < repetitions; i++) {
                const height = childrenHeights[i % this.children.length] + stretch
                const prism = new Prism(context.base.move(new Vec3(0, 0, z)), height)
                z += height + gap
                results.push(this.children[i % this.children.length].build(prism, style, seed))
            }
            return results
        } else {
            let z: number = 0
            switch (alignment) {
                case FlexAlignment.START:
                    z = base; break
                case FlexAlignment.END:
                    z = base + size - childrenHeight; break
                case FlexAlignment.CENTER:
                    z = base + (size - childrenHeight) / 2; break
            }

            let results: BuilderResult[] = []
            for (let i = 0; i < repetitions; i++) {
                const height = childrenHeights[i % this.children.length]
                const prism = new Prism(context.base.move(new Vec3(0, 0, z)), height)
                z += height + gap
                results.push(this.children[i % this.children.length].build(prism, style, seed))
            }
            return results
        }
    }

    get children(): ObjectBuilder<Prism<P>>[] {
        return this._children.map((child) => child.builder)
    }

    toJsonData(): {} {
        return {
            children: this._children.map((child) => {
                return {
                    builder: child.builder.toJson(),
                    height: child.height.toJson()
                }
            })
        }
    }
}