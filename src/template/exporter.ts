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
import { Exporter } from "../project/exporter.js"
import { Seed } from "../builder/random/random.js"
import { type Geo3 } from "../world/geo.js"
import { Component, ComponentReference } from "../engineer/data-pack/component/component.js"
import { GEOS } from "../register/geo.js"

export function templateBuilderExport<G extends Geo3>(builder: Builder<G>, base: G, style: Style) {
    templateComponentExport(new Component(new ComponentReference('@structure-template'), GEOS.get(base.type), builder), base, style)
}

export function templateComponentExport(component: Component, base: Geo3, style: Style) {
    const seed = new Seed()
    
    const result = component.build(style.toGenerationStyle(seed), base, seed)
    
    const exporter = new Exporter(seed, result)
    exporter.exportToArchitect((data) => console.log('Update exporting:', data))
}