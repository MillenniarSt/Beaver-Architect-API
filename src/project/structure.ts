//             _____
//         ___/     \___        |  |
//      ##/  _.- _.-    \##  -  |  |                       -
//      ##\#=_  '    _=#/##  |  |  |  /---\  |      |      |   ===\  |  __
//      ##   \\#####//   ##  |  |  |  |___/  |===\  |===\  |   ___|  |==/
//      ##       |       ##  |  |  |  |      |   |  |   |  |  /   |  |
//      ##       |       ##  |  \= \= \====  |   |  |   |  |  \___/  |
//      ##\___   |   ___/
//      ##    \__|__/

import { BuilderResult } from "../builder/builder.js";
import { GenerationStyle } from "../engineer/data-pack/style/style.js";
import { StructureEngineer } from "../engineer/structure/structure.js";
import { Seed } from "../util/random.js";
import { Geo3 } from "../world/geo.js";

export class Structure<G extends Geo3 = Geo3> {

    constructor(
        protected base: G,
        protected engineer: StructureEngineer<G>
    ) { }

    build(style: GenerationStyle, seed: Seed): BuilderResult<G> {
        return this.engineer.builder.build(this.base, style, seed)
    }
}