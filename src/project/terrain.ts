//             _____
//         ___/     \___        |  |
//      ##/  _.- _.-    \##  -  |  |                       -
//      ##\#=_  '    _=#/##  |  |  |  /---\  |      |      |   ===\  |  __
//      ##   \\#####//   ##  |  |  |  |___/  |===\  |===\  |   ___|  |==/
//      ##       |       ##  |  |  |  |      |   |  |   |  |  /   |  |
//      ##       |       ##  |  \= \= \====  |   |  |   |  |  \___/  |
//      ##\___   |   ___/
//      ##    \__|__/

import { Builder, BuilderFlatResult } from "../builder/builder.js";
import { Seed } from "../builder/random/random.js";
import { GenerationStyle, StyleRules } from "../engineer/data-pack/style/rule.js";
import { Vec3 } from "../world/vector.js";
import { Rect3 } from "../world/geo/object.js";
import { IndexOutOfBounds, InternalServerError } from "../connection/errors.js";
import type { JsonFormat, ToJson } from "../util/util.js";
import { BUILDERS } from "../register/builder.js";
import { GeoRegistry } from "../register/geo.js";

export class Terrain implements ToJson {

    constructor(
        public chunk: ChunkGenerator,
        public chunkDimension: Vec3
    ) { }

    static fromJson(json: any): Terrain {
        return new Terrain(ChunkGenerator.fromJson(json.chunk), Vec3.fromJson(json.chunkDimension))
    }

    buildChunk(pos: Vec3, style: GenerationStyle, seed: Seed): BuilderFlatResult {
        return BuilderFlatResult.combine(this.chunk.tasks.map((task) => task.build(new Rect3(pos, this.chunkDimension), style, seed)))
    }

    buildChunkTask(pos: Vec3, style: GenerationStyle, seed: Seed, task: number): BuilderFlatResult {
        return this.chunk.getTask(task).build(new Rect3(pos, this.chunkDimension), style, seed)
    }

    toJson(): JsonFormat {
        return {
            chunk: this.chunk.toJson(),
            chunkDimension: this.chunkDimension.toJson()
        }
    }
}

export class ChunkGenerator implements ToJson {

    constructor(
        readonly tasks: ChunkGeneratorTask[]
    ) { }

    getTask(index: number): ChunkGeneratorTask {
        const task = this.tasks[index]
        if(task === undefined) {
            throw new IndexOutOfBounds(index, this.tasks.length, 'ChunkGenerator', 'Task')
        }
        return task
    }

    static fromJson(json: any): ChunkGenerator {
        return new ChunkGenerator(json.tasks.map((task: any) => ChunkGeneratorTask.fromJson(task)))
    }

    toJson(): JsonFormat {
        return {
            tasks: this.tasks.map((task) => task.toJson())
        }
    }
}

export class ChunkGeneratorTask implements ToJson {

    constructor(
        public builder: Builder<Rect3>,
        public parameters: StyleRules = new StyleRules(),
        public subtasks: ChunkGeneratorTask[] = []
    ) { }

    static fromJson(json: any): ChunkGeneratorTask {
        return new ChunkGeneratorTask(BUILDERS.fromJson(json.builder, GeoRegistry.RECT3), StyleRules.fromJson(json.parameters), json.subtasks.map((subtask: any) => ChunkGeneratorTask.fromJson(subtask)))
    }

    build(dimension: Rect3, style: GenerationStyle, seed: Seed): BuilderFlatResult {
        let result = this.builder.build(dimension, style, this.parameters.toGenerationStyle(seed), seed).toFlat()
        return BuilderFlatResult.combine([result, ...this.subtasks.map((subtask) => subtask.build(dimension, style, seed))])
    }

    toJson(): JsonFormat {
        return {
            builder: this.builder.toJson(),
            parameters: this.parameters.toJson(),
            subtasks: this.subtasks.map((subtask) => subtask.toJson())
        }
    }
}

export class ChunkOutOfBounds extends InternalServerError {

    constructor(readonly pos: Vec3, readonly bounds: Rect3) {
        super(`Chunk pos ${pos.toJson()} is out of bounds [${bounds.pos.toJson()} - ${bounds.size.toJson()}]`)
    }
}