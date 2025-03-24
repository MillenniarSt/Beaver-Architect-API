//             _____
//         ___/     \___        |  |
//      ##/  _.- _.-    \##  -  |  |                       -
//      ##\#=_  '    _=#/##  |  |  |  /---\  |      |      |   ===\  |  __
//      ##   \\#####//   ##  |  |  |  |___/  |===\  |===\  |   ___|  |==/
//      ##       |       ##  |  |  |  |      |   |  |   |  |  /   |  |
//      ##       |       ##  |  \= \= \====  |   |  |   |  |  \___/  |
//      ##\___   |   ___/
//      ##    \__|__/

import { MaterialReference } from "../../engineer/data-pack/style/material.js";
import { GenerationStyle } from "../../engineer/data-pack/style/style.js";
import { Option } from "../../util/option.js";
import { RandomList, RandomNumber, Seed } from "../../util/random.js";
import { Plane2 } from "../../world/bi-geo/plane.js";
import { Prism } from "../../world/geo/object.js";
import { Plane3 } from "../../world/geo/surface.js";
import { Builder, BuilderResult, ObjectBuilder, SurfaceBuilder } from "../builder.js";
import { SingleChildBuilder } from "../collective.js";

@SingleChildBuilder((json) => { return {
    height: Option.fromJson(json.height)
} })
export class SurfaceToPrismBuilder<P extends Plane2 = Plane2> extends SurfaceBuilder<Plane3<P>, {
    height: Option<number>
}, {}> {

    constructor(
        protected child: ObjectBuilder<Prism<P>>,
        options: {
            height?: Option<number>
        } = {},
        materials: RandomList<MaterialReference> = new RandomList()
    ) {
        super({
            height: options.height ?? new Option(RandomNumber.constant(1))
        }, materials)
    }

    protected buildChildren(context: Plane3<P>, style: GenerationStyle, seed: Seed): BuilderResult[] {
        const prism = new Prism(context, this.options.height.get(style, seed))
        return [this.child.build(prism, style, seed)]
    }

    get children(): [{
        builder: Builder<Prism<P>>,
        options: {}
    }] {
        return [{
            builder: this.child,
            options: {}
        }]
    }

    toJsonData(): {} {
        return {
            child: this.child.toJson()
        }
    }
}