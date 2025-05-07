//             _____
//         ___/     \___        |  |
//      ##/  _.- _.-    \##  -  |  |                       -
//      ##\#=_  '    _=#/##  |  |  |  /---\  |      |      |   ===\  |  __
//      ##   \\#####//   ##  |  |  |  |___/  |===\  |===\  |   ___|  |==/
//      ##       |       ##  |  |  |  |      |   |  |   |  |  /   |  |
//      ##       |       ##  |  \= \= \====  |   |  |   |  |  \___/  |
//      ##\___   |   ___/
//      ##    \__|__/

import type { GenerationStyle } from "../../../engineer/data-pack/style/rule.js";
import { Plane2 } from "../../../world/bi-geo/plane.js";
import { Prism } from "../../../world/geo/object.js";
import { Vec3 } from "../../../world/vector.js";
import { Builder, type BuilderChild, BuilderResult, BuilderType } from "../../builder.js";
import { childrenFromJson } from "../../collective.js";
import type { Option } from "../../option.js";
import type { Seed } from "../../random/random.js";
import { RandomType } from "../../random/type.js";

export class FlexPrismBuilder<P extends Plane2 = Plane2> extends Builder<Prism<P>, {}> {

    static readonly type = new BuilderType('flexPrism', Prism.type, [
        { id: 'children', geo: Prism.type, options: [
            { id: 'isStatic', type: RandomType.BOOLEAN },
            { id: 'weight', type: RandomType.NUMBER }
        ], multiple: true }
    ], [])

    constructor(
        public children: BuilderChild<Builder<Prism<P>>, {
            isStatic: Option<boolean>,
            weight: Option<number>
        }>[]
    ) {
        super({})
    }

    static fromJson(json: any): FlexPrismBuilder {
        return new FlexPrismBuilder(
            childrenFromJson(json.children)
        )
    }

    protected buildChildren(context: Prism<P>, style: GenerationStyle, parameters: GenerationStyle, seed: Seed): BuilderResult[] {
        const height = context.height

        let staticsHeight = 0
        let totalWeight = 0
        const children = this.children.map((child) => {
            const isStatic = child.options.isStatic.get(style, parameters, seed)
            const weight = child.options.weight.get(style, parameters, seed)
            if (isStatic) {
                staticsHeight += weight
            } else {
                totalWeight += weight
            }
            return {
                builder: child.builder,
                isStatic: isStatic,
                weight: weight
            }
        })

        if (staticsHeight >= height) {
            console.warn('FlexPrismBuilder: height of statics children is greater than the prism height')
            let results: BuilderResult[] = []
            let z = 0
            children.forEach((child) => {
                if (child.isStatic) {
                    results.push(child.builder.build(new Prism(context.base.move(new Vec3(0, 0, z)), child.weight), style, parameters, seed))
                    z += child.weight
                }
            })
            return results
        }

        let results: BuilderResult[] = []
        let z = 0
        children.forEach((child) => {
            if (child.isStatic) {
                results.push(child.builder.build(new Prism(context.base.move(new Vec3(0, 0, z)), child.weight), style, parameters, seed))
                z += child.weight
            } else {
                results.push(child.builder.build(new Prism(context.base.move(new Vec3(0, 0, z)), (totalWeight / child.weight) * height), style, parameters, seed))
            }
        })
        return results
    }

    protected additionalJson(): Record<string, any> {
        return {
            children: this.childrenToJson(this.children)
        }
    }
}