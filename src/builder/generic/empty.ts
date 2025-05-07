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
import { Builder, BuilderResult } from "../builder.js";
import type { GenerationStyle } from "../../engineer/data-pack/style/rule.js";

export class EmptyBuilder<G extends Geo3 = any> extends Builder<G, {}, {}> {

    get type(): string {
        return 'empty'
    }

    static readonly VOID = new EmptyBuilder()

    private constructor() {
        super({}, {})
    }

    static fromData(): EmptyBuilder {
        return EmptyBuilder.VOID
    }

    protected buildChildren(context: any, style: GenerationStyle, parameters: GenerationStyle, seed: Seed): BuilderResult[] {
        return []
    }
}