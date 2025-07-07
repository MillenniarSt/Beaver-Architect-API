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
import { GeoRegistry } from "../../../register/geo.js";
import { RandomTypeRegistry } from "../../../register/random.js";
import { Plane2 } from "../../../world/bi-geo/plane.js";
import { Prism } from "../../../world/geo/object.js";
import { Vec3 } from "../../../world/vector.js";
import { Builder, type BuilderChild, BuilderMultipleChild, BuilderResult, StandardBuilder } from "../../builder.js";
import type { Option } from "../../option.js";
import type { Seed } from "../../random/random.js";

export type FlexPrismBuilderChildOptions = {
    isStatic: Option<boolean>,
    weight: Option<number>
}

export const FLEX_PRISM_STRUCTURE = {
    geo: GeoRegistry.PRISM,
    children: {
        children: { options: { isStatic: RandomTypeRegistry.BOOLEAN, weight: RandomTypeRegistry.NUMBER }, geo: GeoRegistry.PRISM, multiple: true }
    },
    options: {}
}

export class FlexPrismBuilder<P extends Plane2 = Plane2> extends StandardBuilder<Prism<P>, { children: BuilderMultipleChild<Prism<P>, FlexPrismBuilderChildOptions> }, {}> {

    get type(): string {
        return 'flex_prism'
    }

    constructor(
        children: BuilderMultipleChild<Prism<P>, FlexPrismBuilderChildOptions>
    ) {
        super({ children }, {})
    }

    get structure(): { geo: GeoRegistry; children: { children: { options: Record<string, RandomTypeRegistry>; geo: GeoRegistry; multiple: boolean; }; }; options: {}; } {
        return FLEX_PRISM_STRUCTURE
    }

    static fromData(children: Record<string, BuilderChild>, options: Record<string, Option>): FlexPrismBuilder {
        return new FlexPrismBuilder(children['children'] as BuilderMultipleChild<Prism, FlexPrismBuilderChildOptions>)
    }

    protected buildChildren(context: Prism<P>, style: GenerationStyle, parameters: GenerationStyle, seed: Seed): BuilderResult[] {
        const height = context.height

        let staticsHeight = 0
        let totalWeight = 0
        const children = this.children.children.entries.map((child) => {
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
}