//             _____
//         ___/     \___        |  |
//      ##/  _.- _.-    \##  -  |  |                       -
//      ##\#=_  '    _=#/##  |  |  |  /---\  |      |      |   ===\  |  __
//      ##   \\#####//   ##  |  |  |  |___/  |===\  |===\  |   ___|  |==/
//      ##       |       ##  |  |  |  |      |   |  |   |  |  /   |  |
//      ##       |       ##  |  \= \= \====  |   |  |   |  |  \___/  |
//      ##\___   |   ___/
//      ##    \__|__/

import { v4 } from "uuid";
import { BuilderResultGroup, BuilderResult } from "../builder/builder.js";
import { ArchitectStyle, GenerationStyle } from "../engineer/data-pack/style/style.js";
import { getArchitectSide } from "../instance.js";
import { Seed } from "../builder/random/random.js";
import type { Geo3 } from "../world/geo.js";
import { IdNotExists } from "../connection/errors.js";
import type { ToJson } from "../util/util.js";
import { Line3 } from "../world/geo/line.js";
import { Surface } from "../world/geo/surface.js";
import { Object3 } from "../world/geo/object.js";

export type ExportToArchitectUpdate = {
    isDone?: boolean
    fail?: string
}

export class Exporter {

    constructor(
        readonly seed: Seed,
        readonly result: BuilderArchitectResult,
        readonly style: ArchitectStyle
    ) { }

    exportToArchitect(onUpdate: (data: ExportToArchitectUpdate) => void): Promise<string | null> {
        return new Promise(async (resolve) => {
            const channel = `export:${v4()}`
            await getArchitectSide().openChannel<ExportToArchitectUpdate>(`export:${channel}`, {
                seed: this.seed.seed,
                result: this.result.toJson()
            }, (data) => {
                if (data.isDone) {
                    resolve(null)
                } else if (data.fail) {
                    resolve(data.fail)
                }
                onUpdate(data)
            })
        })
    }
}

export class BuilderArchitectResult<G extends Geo3 = Geo3> implements ToJson {

    constructor(
        readonly object: G,
        readonly settings: Record<string, any>,
        readonly children: BuilderArchitectResult[]
    ) { }

    static fromJson(json: any): BuilderArchitectResult {
        let object
        switch (json.type) {
            case 'line': object = Line3.fromJson(json.object); break
            case 'surface': object = Surface.fromJson(json.object); break
            case 'object': object = Object3.fromJson(json.object); break
            default: throw new Error(`BuilderResult: invalid type while parsing json: ${json.type}`)
        }
        return new BuilderArchitectResult(object, json.settings, json.children.map((child: any) => BuilderArchitectResult.fromJson(child)))
    }

    static fromBuilderResult(result: BuilderResult, groups: Record<string, BuilderResultGroup>, style: GenerationStyle, parameters: GenerationStyle, seed: Seed): BuilderArchitectResult {
        return new BuilderArchitectResult(
            result.object,
            Object.fromEntries(Object.entries(result.architectRandom).map(([key, option]) => [key, option.get(style, parameters, seed)])),
            [
                ...result.children.map((child) => BuilderArchitectResult.fromBuilderResult(child, groups, style, parameters, seed)),
                ...result.groups.map((groupId) => {
                    const group = groups[groupId]
                    if (!group)
                        throw new IdNotExists(groupId, 'BuilderArchitectResult', 'fromBuilderResult', 'groups')
                    return BuilderArchitectResult.fromBuilderResult(group.result, groups, style, group.style.toGenerationStyle(seed), seed)
                })
            ]
        )
    }

    toJson(): {} {
        return {
            type: this.object.type,
            object: this.object.toJson(),
            settings: this.settings,
            children: this.children.map((child) => child.toJson())
        }
    }
}