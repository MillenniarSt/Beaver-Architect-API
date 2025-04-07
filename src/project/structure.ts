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
import type { StructureEngineer } from "../engineer/data-pack/structure/structure.js";
import { GenerationStyle } from "../engineer/data-pack/style/style.js";
import { Seed } from "../builder/random/random.js";
import { type Geo3 } from "../world/geo.js";

export class Structure {

    constructor(
        protected base: Geo3,
        protected engineer: StructureEngineer
    ) { }

    build(style: GenerationStyle, seed: Seed): BuilderResult {
        return this.engineer.builder.build(this.base, style, seed)
    }
}