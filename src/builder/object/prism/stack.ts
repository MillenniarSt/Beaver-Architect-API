//             _____
//         ___/     \___        |  |
//      ##/  _.- _.-    \##  -  |  |                       -
//      ##\#=_  '    _=#/##  |  |  |  /---\  |      |      |   ===\  |  __
//      ##   \\#####//   ##  |  |  |  |___/  |===\  |===\  |   ___|  |==/
//      ##       |       ##  |  |  |  |      |   |  |   |  |  /   |  |
//      ##       |       ##  |  \= \= \====  |   |  |   |  |  \___/  |
//      ##\___   |   ___/
//      ##    \__|__/

import { MaterialReference } from '../../../engineer/data-pack/style/material.js';
import { GenerationStyle } from '../../../engineer/data-pack/style/style.js';
import { Option } from '../../../util/option.js';
import { RandomList, RandomNumber, RandomVec2, Seed } from '../../../util/random.js';
import { Plane2 } from '../../../world/bi-geo/plane.js';
import { Prism } from '../../../world/geo/object.js';
import { Vec2, Vec3 } from '../../../world/vector.js';
import { BuilderChild, BuilderResult, ChildrenManager, ObjectBuilder } from '../../builder.js';
import { MultiChildOptionBuilder } from '../../collective.js';
import { EmptyBuilder } from '../../generic/empty.js';

export enum StackAlignment {
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

@MultiChildOptionBuilder((json) => {
    return {
        alignment: Option.fromJson(json.alignment),
        repeat: Option.fromJson(json.repeat),
        gap: Option.fromJson(json.gap),
        padding: Option.fromJson(json.padding)
    }
}, (json) => {
    return {
        height: Option.fromJson(json.height)
    }
})
export class StackPrismBuilder<P extends Plane2 = Plane2> extends ObjectBuilder<Prism<P>, {
    alignment: Option<StackAlignment | undefined>
    repeat: Option<RepetitionMode | undefined>
    gap: Option<number>
    padding: Option<Vec2>
}, {
    height: Option<number>
}> implements ChildrenManager {

    constructor(
        public children: BuilderChild<ObjectBuilder<Prism<P>>, {
            height: Option<number>
        }>[],
        options: {
            alignment?: Option<StackAlignment | undefined>
            repeat?: Option<RepetitionMode | undefined>
            gap?: Option<number>
            padding?: Option<Vec2>
        } = {},
        materials: RandomList<MaterialReference> = new RandomList()
    ) {
        super({
            alignment: options.alignment ?? new Option(StackAlignment.START),
            repeat: options.repeat ?? new Option(RepetitionMode.NONE),
            gap: options.gap ?? new Option(RandomNumber.constant(0)),
            padding: options.padding ?? new Option(RandomVec2.constant(0))
        }, materials)
    }

    canAddChild(): boolean {
        return true
    }

    addChild(): void {
        this.children.push({
            builder: new EmptyBuilder(),
            options: {
                height: new Option(RandomNumber.constant(1))
            }
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
            console.warn('StackPrismBuilder: size is less than 0')
            return []
        }

        let childrenHeights = this.children.map((child) => child.options.height.get(style, seed))
        let childrenHeight = -gap
        childrenHeights.forEach((height) => {
            childrenHeight += height + gap
        })

        if (childrenHeight > size) {
            console.warn('StackPrismBuilder: children height is greater than size')
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

        if (alignment === StackAlignment.FILL) {
            const stretch = (size - childrenHeight) / repetitions

            let results: BuilderResult[] = []
            let z = base
            for (let i = 0; i < repetitions; i++) {
                const height = childrenHeights[i % this.children.length] + stretch
                const prism = new Prism(context.base.move(new Vec3(0, 0, z)), height)
                z += height + gap
                results.push(this.children[i % this.children.length].builder.build(prism, style, seed))
            }
            return results
        } else {
            let z: number = 0
            switch (alignment) {
                case StackAlignment.START:
                    z = base; break
                case StackAlignment.END:
                    z = base + size - childrenHeight; break
                case StackAlignment.CENTER:
                    z = base + (size - childrenHeight) / 2; break
            }

            let results: BuilderResult[] = []
            for (let i = 0; i < repetitions; i++) {
                const height = childrenHeights[i % this.children.length]
                const prism = new Prism(context.base.move(new Vec3(0, 0, z)), height)
                z += height + gap
                results.push(this.children[i % this.children.length].builder.build(prism, style, seed))
            }
            return results
        }
    }
}