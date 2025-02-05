//             _____
//         ___/     \___        |  |
//      ##/  _.- _.-    \##  -  |  |                       -
//      ##\#=_  '    _=#/##  |  |  |  /---\  |      |      |   ===\  |  __
//      ##   \\#####//   ##  |  |  |  |___/  |===\  |===\  |   ___|  |==/
//      ##       |       ##  |  |  |  |      |   |  |   |  |  /   |  |
//      ##       |       ##  |  \= \= \====  |   |  |   |  |  \___/  |
//      ##\___   |   ___/
//      ##    \__|__/

import { MaterialReference } from "../../../engineer/data-pack/style/material.js";
import { GenerationStyle } from "../../../engineer/data-pack/style/style.js";
import { BooleanOption, NumberOption } from "../../../util/option.js";
import { RandomBoolean, RandomList, RandomNumber, Seed } from "../../../util/random.js";
import { Plane2 } from "../../../world/bi-geo/plane.js";
import { Prism } from "../../../world/geo/object.js";
import { Vec3 } from "../../../world/vector.js";
import { BuilderChild, BuilderResult, ChildrenManager, ObjectBuilder } from "../../builder.js";
import { MultiChildBuilder } from "../../collective.js";
import { EmptyBuilder } from "../../generic/empty.js";

@MultiChildBuilder((json) => {
    return {
        isStatic: BooleanOption.fromJson(json.isStatic),
        weight: NumberOption.fromJson(json.weight)
    }
})
export class FlexPrismBuilder<P extends Plane2 = Plane2> extends ObjectBuilder<Prism<P>, {}, {
    isStatic: BooleanOption,
    weight: NumberOption
}> implements ChildrenManager {

    constructor(
        public children: BuilderChild<ObjectBuilder<Prism<P>>, {
            isStatic: BooleanOption,
            weight: NumberOption
        }>[],
        materials: RandomList<MaterialReference> = new RandomList()
    ) {
        super({}, materials)
    }

    canAddChild(): boolean {
        return true
    }

    addChild(): void {
        this.children.push({
            builder: new EmptyBuilder(),
            options: {
                isStatic: new BooleanOption(RandomBoolean.constant(true)),
                weight: new NumberOption(RandomNumber.constant(1))
            }
        })
    }

    protected buildChildren(context: Prism<P>, style: GenerationStyle, seed: Seed): BuilderResult[] {
        const height = context.height

        let staticsHeight = 0
        let totalWeight = 0
        const children = this.children.map((child) => {
            const isStatic = child.options.isStatic.get(style, seed)
            const weight = child.options.weight.get(style, seed)
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
                    results.push(child.builder.build(new Prism(context.base.move(new Vec3(0, 0, z)), child.weight), style, seed))
                    z += child.weight
                }
            })
            return results
        }

        let results: BuilderResult[] = []
        let z = 0
        children.forEach((child) => {
            if (child.isStatic) {
                results.push(child.builder.build(new Prism(context.base.move(new Vec3(0, 0, z)), child.weight), style, seed))
                z += child.weight
            } else {
                results.push(child.builder.build(new Prism(context.base.move(new Vec3(0, 0, z)), (totalWeight / child.weight) * height), style, seed))
            }
        })
        return results
    }
}