import { v4 } from "uuid";
import { BuilderResult } from "../builder/builder.js";
import { PostGenerationStyle } from "../engineer/data-pack/style/style.js";
import { getArchitect } from "../instance.js";
import { Seed } from "../util/random.js";

export type ExportToArchitectUpdate = {
    isDone?: boolean
    fail?: string
}

export class Exporter {

    constructor(
        readonly seed: Seed,
        readonly builderResult: BuilderResult,
        readonly style: PostGenerationStyle
    ) { }

    exportToArchitect(onUpdate: (data: ExportToArchitectUpdate) => void): Promise<string | null> {
        return new Promise(async (resolve) => {
            const channel = `export:${v4()}`
            await getArchitect().server.openChannel<ExportToArchitectUpdate>(`export:${channel}`, {
                seed: this.seed.seed,
                materials: Object.entries(this.style.materials).map(([id, material]) => {
                    return {
                        id: id,
                        data: material.toJson()
                    }
                }),
                result: this.builderResult.toJson()
            }, (data) => {
                if(data.isDone) {
                    resolve(null)
                } else if(data.fail) {
                    resolve(data.fail)
                }
                onUpdate(data)
            })
        })
    }
}