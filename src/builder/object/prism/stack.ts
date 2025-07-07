//             _____
//         ___/     \___        |  |
//      ##/  _.- _.-    \##  -  |  |                       -
//      ##\#=_  '    _=#/##  |  |  |  /---\  |      |      |   ===\  |  __
//      ##   \\#####//   ##  |  |  |  |___/  |===\  |===\  |   ___|  |==/
//      ##       |       ##  |  |  |  |      |   |  |   |  |  /   |  |
//      ##       |       ##  |  \= \= \====  |   |  |   |  |  \___/  |
//      ##\___   |   ___/
//      ##    \__|__/

import type { GenerationStyle } from '../../../engineer/data-pack/style/rule.js';
import { GeoRegistry } from '../../../register/geo.js';
import { RandomRegistry, RandomTypeRegistry } from '../../../register/random.js';
import { Plane2 } from '../../../world/bi-geo/plane.js';
import { Prism } from '../../../world/geo/object.js';
import { Vec2, Vec3 } from '../../../world/vector.js';
import { type BuilderChild, BuilderMultipleChild, BuilderResult, StandardBuilder } from '../../builder.js';
import { Option } from '../../option.js';
import { ConstantEnum, type Align, type RepetitionMode } from '../../random/enum.js';
import { ConstantNumber } from '../../random/number.js';
import type { Seed } from '../../random/random.js';
import { ConstantVec2 } from '../../random/vec/vec2.js';

export type StackPrismBuilderOptions = {
    alignment: Option<Align>
    repeat: Option<RepetitionMode>
    gap: Option<number>
    padding: Option<Vec2>
}

export type FlexPrismBuilderChildOptions = {
    height: Option<number>
}

export const STACK_PRISM_STRUCTURE = {
    geo: GeoRegistry.PRISM,
    children: {
        children: { options: { height: RandomTypeRegistry.NUMBER }, geo: GeoRegistry.PRISM, multiple: true }
    },
    options: {
        alignment: RandomTypeRegistry.ALIGN,
        repeat: RandomTypeRegistry.REPETITION,
        gap: RandomTypeRegistry.NUMBER,
        padding: RandomTypeRegistry.VEC2
    }
}

export class StackPrismBuilder<P extends Plane2 = Plane2> extends StandardBuilder<Prism<P>, { children: BuilderMultipleChild<Prism<P>, FlexPrismBuilderChildOptions> }, StackPrismBuilderOptions> {

    get type(): string {
        return 'stack_prism'
    }

    constructor(
        children: BuilderMultipleChild<Prism<P>, FlexPrismBuilderChildOptions>,
        options: Partial<StackPrismBuilderOptions> = {}
    ) {
        super({ children }, {
            alignment: options.alignment ?? Option.random(new ConstantEnum<Align[]>(RandomRegistry.ALIGN.id, 'start')),
            repeat: options.repeat ?? Option.random(new ConstantEnum<RepetitionMode[]>(RandomRegistry.REPETITION.id, 'none')),
            gap: options.gap ?? Option.random(new ConstantNumber(0)),
            padding: options.padding ?? Option.random(new ConstantVec2(Vec2.ZERO))
        })
    }

    get structure(): { geo: GeoRegistry; children: { children: { options: Record<string, RandomTypeRegistry>; geo: GeoRegistry; multiple: boolean; }; }; options: { alignment: RandomTypeRegistry<any>; repeat: RandomTypeRegistry<any>; gap: RandomTypeRegistry<any>; padding: RandomTypeRegistry<any>; }; } {
        return STACK_PRISM_STRUCTURE
    }

    static fromData(children: Record<string, BuilderChild>, options: Record<string, Option>): StackPrismBuilder {
        return new StackPrismBuilder(children['children'] as BuilderMultipleChild<Prism, FlexPrismBuilderChildOptions>, options)
    }

    protected buildChildren(context: Prism<P>, style: GenerationStyle, parameters: GenerationStyle, seed: Seed): BuilderResult[] {
        const padding = this.options.padding.get(style, parameters, seed)
        const gap = this.options.gap.get(style, parameters, seed)
        const repeat = this.options.repeat.get(style, parameters, seed)
        const alignment = this.options.alignment.get(style, parameters, seed)
        const size = context.height - padding.x - padding.y
        const base = context.base.z + padding.x

        if (size <= 0) {
            console.warn('StackPrismBuilder: size is less than 0')
            return []
        }

        let childrenHeights = this.children.children.entries.map((child) => child.options.height.get(style, parameters, seed))
        let childrenHeight = -gap
        childrenHeights.forEach((height) => {
            childrenHeight += height + gap
        })

        if (childrenHeight > size) {
            console.warn('StackPrismBuilder: children height is greater than size')
        }

        let repetitions = this.children.children.length
        if (repeat === 'block' || repeat === 'every') {
            repetitions = Math.floor(size / childrenHeight) * this.children.children.length
            childrenHeight = childrenHeight * (repetitions / this.children.children.length) + gap * (repetitions - 1)
        }
        if (repeat === 'every') {
            for (let i = 0; i < this.children.children.length; i++) {
                if (childrenHeight + childrenHeights[i] <= size) {
                    repetitions++
                    childrenHeight += childrenHeights[i] + gap
                } else {
                    break
                }
            }
        }

        if (alignment === 'fill') {
            const stretch = (size - childrenHeight) / repetitions

            let results: BuilderResult[] = []
            let z = base
            for (let i = 0; i < repetitions; i++) {
                const height = childrenHeights[i % this.children.children.length] + stretch
                const prism = new Prism(context.base.move(new Vec3(0, 0, z)), height)
                z += height + gap
                results.push(this.children.children.entries[i % this.children.children.length].builder.build(prism, style, parameters, seed))
            }
            return results
        } else {
            let z: number = 0
            switch (alignment) {
                case 'start':
                    z = base; break
                case 'end':
                    z = base + size - childrenHeight; break
                case 'center':
                    z = base + (size - childrenHeight) / 2; break
            }

            let results: BuilderResult[] = []
            for (let i = 0; i < repetitions; i++) {
                const height = childrenHeights[i % this.children.children.length]
                const prism = new Prism(context.base.move(new Vec3(0, 0, z)), height)
                z += height + gap
                results.push(this.children.children.entries[i % this.children.children.length].builder.build(prism, style, parameters, seed))
            }
            return results
        }
    }
}