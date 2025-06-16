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
import { BuilderExporter } from "../exporter/builder.js"
import { Seed } from "../builder/random/random.js"
import { type Geo3 } from "../world/geo.js"
import { Component, ComponentReference } from "../engineer/data-pack/component/component.js"
import { GEOS } from "../register/geo.js"
import type { Terrain } from "../project/terrain.js"
import { CppTerrainExporter } from "../exporter/cpp.js"
import { Vec3 } from "../world/vector.js"
import { getArchitectSide } from "../instance.js"
import { TcpTerrainExporter } from "../exporter/tcp.js"

export function templateBuilderExport<G extends Geo3>(builder: Builder<G>, base: G, style: Style) {
    templateComponentExport(new Component(new ComponentReference('@structure-template'), GEOS.get(base.type), builder), base, style)
}

export function templateComponentExport(component: Component, base: Geo3, style: Style) {
    const seed = new Seed()

    const result = component.build(style.toGenerationStyle(seed), base, seed)

    const exporter = new BuilderExporter(seed, result.toFlat())
    exporter.exportToArchitect((data) => console.log('Update exporting:', data))
}

export function templateTerrainCppExport(terrain: Terrain) {
    const exporter = new CppTerrainExporter(terrain)
    exporter.exportToCpp()
}

export function templateTerrainChunkExport(terrain: Terrain, style: Style, pos: Vec3 = Vec3.ZERO) {
    const seed = new Seed()
    const startDate = new Date()
    const result = terrain.buildChunk(pos, style.toGenerationStyle(seed), seed)
    console.log(`Terrain Chunk built: took ${(new Date().getTime() - startDate.getTime())} ms`)
    getArchitectSide().request('exporter/get', { seed: seed.seed, result: result.materialsToJson(), time: startDate.getTime() }).then(() => {
        console.log(`Terrain Chunk Export finished: took ${(new Date().getTime() - startDate.getTime())} ms`)
    })
}

export function templateTerrainChunkTpcExport(terrain: Terrain, style: Style, pos: Vec3 = Vec3.ZERO) {
    const exporter = new TcpTerrainExporter(10010, terrain, style, new Seed())
    exporter.open().then((opened) => {
        if (opened) {
            const startDate = new Date()
            exporter.buildChunk(pos).then(() => console.log(`Terrain Chunk build finish: took ${(new Date().getTime() - startDate.getTime())} ms`))
        }
    })
}