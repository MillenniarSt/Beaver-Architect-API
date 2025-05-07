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
import { Plane2 } from '../../../world/bi-geo/plane.js';
import { Prism } from '../../../world/geo/object.js';
import { Vec2, Vec3 } from '../../../world/vector.js';
import { Builder, type BuilderChild, BuilderResult, BuilderType } from '../../builder.js';
import { childrenFromJson, optionsFromJson } from '../../collective.js';
import { Option } from '../../option.js';
import { ConstantEnum, type Align, type RepetitionMode } from '../../random/enum.js';
import { ConstantNumber } from '../../random/number.js';
import type { Seed } from '../../random/random.js';
import { RandomType } from '../../random/type.js';
import { ConstantVec2 } from '../../random/vec/vec2.js';

export class StackPrismBuilder<P extends Plane2 = Plane2> extends Builder<Prism<P>, {
    alignment: Option<Align | undefined>
    repeat: Option<RepetitionMode | undefined>
    gap: Option<number>
    padding: Option<Vec2>
}> {

    static readonly type = new BuilderType('stackPrism', Prism.type, [
        { id: 'children', geo: Prism.type, options: [
            { id: 'height', type: RandomType.NUMBER }
        ], multiple: true }
    ], [
        { id: 'alignment', type: RandomType.ALIGN },
        { id: 'repeat', type: RandomType.REPETITION },
        { id: 'gap', type: RandomType.NUMBER },
        { id: 'padding', type: RandomType.VEC2 }
    ])

    constructor(
        public children: BuilderChild<Builder<Prism<P>>, {
            height: Option<number>
        }>[],
        options: {
            alignment?: Option<Align | undefined>
            repeat?: Option<RepetitionMode | undefined>
            gap?: Option<number>
            padding?: Option<Vec2>
        } = {}
    ) {
        super({
            alignment: options.alignment ?? Option.random(new ConstantEnum<Align[]>('start')),
            repeat: options.repeat ?? Option.random(new ConstantEnum<RepetitionMode[]>('none')),
            gap: options.gap ?? Option.random(new ConstantNumber(0)),
            padding: options.padding ?? Option.random(new ConstantVec2(Vec2.ZERO))
        })
    }

    static fromJson(json: any): StackPrismBuilder {
        return new StackPrismBuilder(
            childrenFromJson(json.children),
            optionsFromJson(json.options)
        )
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

        let childrenHeights = this.children.map((child) => child.options.height.get(style, parameters, seed))
        let childrenHeight = -gap
        childrenHeights.forEach((height) => {
            childrenHeight += height + gap
        })

        if (childrenHeight > size) {
            console.warn('StackPrismBuilder: children height is greater than size')
        }

        let repetitions = this.children.length
        if (repeat === 'block' || repeat === 'every') {
            repetitions = Math.floor(size / childrenHeight) * this.children.length
            childrenHeight = childrenHeight * (repetitions / this.children.length) + gap * (repetitions - 1)
        }
        if (repeat === 'every') {
            for (let i = 0; i < this.children.length; i++) {
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
                const height = childrenHeights[i % this.children.length] + stretch
                const prism = new Prism(context.base.move(new Vec3(0, 0, z)), height)
                z += height + gap
                results.push(this.children[i % this.children.length].builder.build(prism, style, parameters, seed))
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
                const height = childrenHeights[i % this.children.length]
                const prism = new Prism(context.base.move(new Vec3(0, 0, z)), height)
                z += height + gap
                results.push(this.children[i % this.children.length].builder.build(prism, style, parameters, seed))
            }
            return results
        }
    }

    protected additionalJson(): Record<string, any> {
        return {
            children: this.childrenToJson(this.children)
        }
    }
}