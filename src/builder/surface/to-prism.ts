//             _____
//         ___/     \___        |  |
//      ##/  _.- _.-    \##  -  |  |                       -
//      ##\#=_  '    _=#/##  |  |  |  /---\  |      |      |   ===\  |  __
//      ##   \\#####//   ##  |  |  |  |___/  |===\  |===\  |   ___|  |==/
//      ##       |       ##  |  |  |  |      |   |  |   |  |  /   |  |
//      ##       |       ##  |  \= \= \====  |   |  |   |  |  \___/  |
//      ##\___   |   ___/
//      ##    \__|__/

import { GenerationStyle } from "../../engineer/data-pack/style/style.js";
import { Seed } from "../random/random.js";
import { Plane2 } from "../../world/bi-geo/plane.js";
import { Prism } from "../../world/geo/object.js";
import { Plane3 } from "../../world/geo/surface.js";
import { Builder, BuilderResult, ObjectBuilder, SurfaceBuilder } from "../builder.js";
import { ConstantNumber } from "../random/number.js";
import { Option } from "../option.js";
import { builderFromJson } from "../collective.js";

export class SurfaceToPrismBuilder<P extends Plane2 = Plane2> extends SurfaceBuilder<Plane3<P>> {

    static readonly type = 'prismToFaces'

    constructor(
        protected child: ObjectBuilder<Prism<P>>,
        options: {
            height?: Option<number>
        } = {}
    ) {
        super({
            height: options.height ?? Option.random(new ConstantNumber(1))
        })
    }

    static fromJson(json: any): SurfaceToPrismBuilder {
        return new SurfaceToPrismBuilder(
            builderFromJson(json.child),
            {
                height: Option.fromJson(json.height)
            }
        )
    }

    protected buildChildren(context: Plane3<P>, style: GenerationStyle, parameters: GenerationStyle, seed: Seed): BuilderResult[] {
        const prism = new Prism(context, this.options.height.get(style, parameters, seed))
        return [this.child.build(prism, style, parameters, seed)]
    }

    additionalJson() {
        return {
            child: this.child.toJson()
        }
    }
}