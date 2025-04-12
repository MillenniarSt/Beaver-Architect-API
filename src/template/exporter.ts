//             _____
//         ___/     \___        |  |
//      ##/  _.- _.-    \##  -  |  |                       -
//      ##\#=_  '    _=#/##  |  |  |  /---\  |      |      |   ===\  |  __
//      ##   \\#####//   ##  |  |  |  |___/  |===\  |===\  |   ___|  |==/
//      ##       |       ##  |  |  |  |      |   |  |   |  |  /   |  |
//      ##       |       ##  |  \= \= \====  |   |  |   |  |  \___/  |
//      ##\___   |   ___/
//      ##    \__|__/

import { Builder } from "../builder/builder.js"
import { Style } from "../engineer/data-pack/style/style.js"
import { StructureEngineer, StructureReference } from "../engineer/data-pack/structure/structure.js"
import { Exporter } from "../project/exporter.js"
import { Structure } from "../project/structure.js"
import { Seed } from "../builder/random/random.js"
import { type Geo3 } from "../world/geo.js"

export function templateBuilderExport<G extends Geo3>(builder: Builder<G>, base: G, style: Style) {
    templateStructureExport(new Structure(base, new StructureEngineer(new StructureReference('@structure-template'), builder)), style)
}

export function templateStructureExport(structure: Structure, style: Style) {
    const seed = new Seed()
    
    const result = structure.build(style.toGenerationStyle(seed), seed)
    
    const exporter = new Exporter(seed, result)
    exporter.exportToArchitect((data) => console.log('Update exporting:', data))
}