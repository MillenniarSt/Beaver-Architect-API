//             _____
//         ___/     \___        |  |
//      ##/  _.- _.-    \##  -  |  |                       -
//      ##\#=_  '    _=#/##  |  |  |  /---\  |      |      |   ===\  |  __
//      ##   \\#####//   ##  |  |  |  |___/  |===\  |===\  |   ___|  |==/
//      ##       |       ##  |  |  |  |      |   |  |   |  |  /   |  |
//      ##       |       ##  |  \= \= \====  |   |  |   |  |  \___/  |
//      ##\___   |   ___/
//      ##    \__|__/

import { Seed } from "../random/random.js";
import { Plane2 } from "../../world/bi-geo/plane.js";
import { Prism } from "../../world/geo/object.js";
import { Plane3 } from "../../world/geo/surface.js";
import { Builder, BuilderResult, OneChildBuilder } from "../builder.js";
import { ConstantNumber } from "../random/number.js";
import { Option } from "../option.js";
import type { GenerationStyle } from "../../engineer/data-pack/style/rule.js";
import { GeoRegistry } from "../../register/geo.js";
import { RandomTypeRegistry } from "../../register/random.js";

export type SurfaceToPrismBuilderOptions = {
    height: Option<number>
}

export const SURFACE_TO_PRISM_STRUCTURE = {
    geo: GeoRegistry.PLANE3, childGeo: GeoRegistry.PRISM, options: {
        height: RandomTypeRegistry.NUMBER
    }
}

export class PlaneToPrismBuilder<P extends Plane2 = Plane2> extends OneChildBuilder<Plane3<P>, Prism<P>, SurfaceToPrismBuilderOptions> {

    get type(): string {
        return 'plane_to_prism'
    }

    get structure() {
        return SURFACE_TO_PRISM_STRUCTURE
    }

    constructor(
        child: Builder<Prism<P>>,
        options: Partial<SurfaceToPrismBuilderOptions> = {}
    ) {
        super(child, {
            height: options.height ?? Option.random(new ConstantNumber(1))
        })
    }

    static fromData(child: Builder<Prism>, options: Record<string, Option>): PlaneToPrismBuilder {
        return new PlaneToPrismBuilder(child, options)
    }

    protected buildChildren(context: Plane3<P>, style: GenerationStyle, parameters: GenerationStyle, seed: Seed): BuilderResult[] {
        const prism = new Prism(context, this.options.height.get(style, parameters, seed))
        return [this.child.builder.build(prism, style, parameters, seed)]
    }

    buildToCpp(): string {
        return `BuilderResult result;
{
    Geo context = new Prism(context, ${this.options.height.toCppGetter()})
    ${this.child.builder.toCpp()}
}
BuilderResult child = new BuilderResult()`
    }
}