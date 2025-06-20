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
import { BuilderFlatResult } from "../builder/builder.js";
import { getArchitectSide } from "../instance.js";
import { Seed } from "../builder/random/random.js";

export type ExportToArchitectUpdate = {
    isDone?: boolean
    fail?: string
}

export class BuilderExporter {

    constructor(
        readonly seed: Seed,
        readonly result: BuilderFlatResult
    ) { }

    exportToArchitect(onUpdate: (data: ExportToArchitectUpdate) => void): Promise<string | null> {
        return new Promise(async (resolve) => {
            const channel = `export:${v4()}`
            await getArchitectSide().openChannel<ExportToArchitectUpdate>(`export:${channel}`, {
                seed: this.seed.seed,
                result: this.result.materialsToJson()
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