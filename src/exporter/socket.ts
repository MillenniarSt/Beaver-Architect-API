//             _____
//         ___/     \___        |  |
//      ##/  _.- _.-    \##  -  |  |                       -
//      ##\#=_  '    _=#/##  |  |  |  /---\  |      |      |   ===\  |  __
//      ##   \\#####//   ##  |  |  |  |___/  |===\  |===\  |   ___|  |==/
//      ##       |       ##  |  |  |  |      |   |  |   |  |  /   |  |
//      ##       |       ##  |  \= \= \====  |   |  |   |  |  \___/  |
//      ##\___   |   ___/
//      ##    \__|__/

import type { BuilderFlatResult } from "../builder/builder.js"
import { Seed } from "../builder/random/random.js"
import { IdNotExists } from "../connection/errors.js"
import { PERMISSIONS } from "../connection/permission.js"
import type { MessageFunction, ServerOnMessage } from "../connection/server.js"
import type { ClientSide } from "../connection/sides.js"
import { StyleReference } from "../engineer/data-pack/style/style.js"
import type { ReferenceData } from "../engineer/engineer.js"
import { getArchitect, getArchitectSide, getProject } from "../instance.js"
import type { Terrain } from "../project/terrain.js"
import { Vec3 } from "../world/vector.js"

/**
 * Sum up messages paths and their data types required
 */
type MessagesStructure = {
    'terrain/generate-chunk': MessageFunction<ClientSide, { id: string, pos: [number, number, number], style: ReferenceData, seed: number, task?: number }>
}

export function registerSocketExporterMessages(onMessage: ServerOnMessage) {
    Object.entries(componentMessages()).forEach(([key, f]) => onMessage.set(`exporter/socket/${key}`, f))
}

/**
 * Starts with 'exporter/socket/...'
*/
function componentMessages(): MessagesStructure {
    return {
        'terrain/generate-chunk': async (data, client, id) => {
            const terrain = getTerrain(data)
            const seed = new Seed(data.seed)
            let result: BuilderFlatResult
            if(data.task) {
                result = terrain.buildChunkTask(Vec3.fromJson(data.pos), new StyleReference(data.style).get().toGenerationStyle(seed), seed, data.task)
            } else {
                result = terrain.buildChunk(Vec3.fromJson(data.pos), new StyleReference(data.style).get().toGenerationStyle(seed), seed)
            }
            client.respond(id, await getArchitectSide().request('exporter/get', { seed: seed.seed, result: result.materialsToJson() }))
        }
    }
}

function getTerrain(data: { id: string }): Terrain {
    const terrain = getProject().terrains[data.id]
    if(!terrain) {
        throw new IdNotExists(data.id, 'Terrain')
    }
    return terrain
}