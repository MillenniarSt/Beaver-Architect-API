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
import { type Geo3 } from "../../world/geo.js";
import { Builder, BuilderResult, BuilderStructure } from "../builder.js";
import type { GenerationStyle } from "../../engineer/data-pack/style/rule.js";
import type { GeoRegistry } from "../../register/geo.js";
import type { JsonFormat } from "../../util/util.js";

export class EmptyBuilder<G extends Geo3 = any> extends Builder<G, {}, {}> {

    get type(): string {
        return 'empty'
    }

    static readonly VOID = new EmptyBuilder()

    private constructor() {
        super({}, {})
    }

    static fromJson(): EmptyBuilder {
        return EmptyBuilder.VOID
    }

    getStructure(parentGeo: GeoRegistry): BuilderStructure {
        return new BuilderStructure(parentGeo, {}, {})
    }

    build(context: G, style: GenerationStyle, parameters: GenerationStyle, seed: Seed): BuilderResult<G> {
        return new BuilderResult(context, [])
    }

    toData(): JsonFormat {
        return undefined
    }
}