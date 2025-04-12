//             _____
//         ___/     \___        |  |
//      ##/  _.- _.-    \##  -  |  |                       -
//      ##\#=_  '    _=#/##  |  |  |  /---\  |      |      |   ===\  |  __
//      ##   \\#####//   ##  |  |  |  |___/  |===\  |===\  |   ___|  |==/
//      ##       |       ##  |  |  |  |      |   |  |   |  |  /   |  |
//      ##       |       ##  |  \= \= \====  |   |  |   |  |  \___/  |
//      ##\___   |   ___/
//      ##    \__|__/

import { Seed } from "./random/random.js";
import { Line3 } from "../world/geo/line.js";
import { Object3 } from "../world/geo/object.js";
import { Surface } from "../world/geo/surface.js";
import { Option } from "./option.js";
import { type Geo3 } from "../world/geo.js";
import { parseRecord, recordFromJson, recordToJson, type ToJson } from "../util/util.js";
import { StyleRules, type GenerationStyle } from "../engineer/data-pack/style/rule.js";

export type BuilderChild<B extends Builder, O extends Record<string, Option> = any> = {
    builder: B
    options: O
}

export interface BuilderFunction<B extends Builder = any> extends Function {

    type: string

    fromJson(json: any): B
}

export abstract class Builder<G extends Geo3 = any, O extends Record<string, Option> = Record<string, Option>> implements ToJson {

    static readonly type: string

    get type(): string {
        return (this.constructor as BuilderFunction).type
    }

    constructor(
        readonly options: O,
        readonly architectOptions: Record<string, Option> = {}
    ) { }

    // Building

    protected abstract buildChildren(context: G, style: GenerationStyle, parameters: GenerationStyle, seed: Seed): BuilderResult[]

    build(context: G, style: GenerationStyle, parameters: GenerationStyle, seed: Seed): BuilderResult<G> {
        return new BuilderResult(
            context,
            parseRecord(this.architectOptions, (option) => option.get(style, parameters, seed)), 
            this.buildChildren(context, style, parameters, seed)
        )
    }

    // Json & Save

    toJson(): {} {
        return {
            type: this.type,
            options: Object.fromEntries(Object.entries(this.options).map(([key, option]) => [key, option.toJson()])),
            ...this.additionalJson()
        }
    }

    protected childrenToJson(children: BuilderChild<Builder>[]) {
        return children.map((child: any) => { return {
            builder: child.builder.toJson(),
            options: recordToJson(child.options)
        } })
    }

    protected abstract additionalJson(): Record<string, any>
}

export abstract class LineBuilder<L extends Line3 = Line3, O extends Record<string, Option> = Record<string, Option>> extends Builder<L, O> { }

export abstract class SurfaceBuilder<S extends Surface = Surface, O extends Record<string, Option> = Record<string, Option>> extends Builder<S, O> { }

export abstract class ObjectBuilder<O extends Object3 = Object3, Opt extends Record<string, Option> = Record<string, Option>> extends Builder<O, Opt> { }

export class BuilderResult<G extends Geo3 = Geo3> implements ToJson {

    constructor(
        readonly object: G,
        readonly architectOpt: Record<string, any>,
        readonly children: BuilderResult[] = []
    ) { }

    static fromJson(json: any): BuilderResult {
        let object
        switch(json.type) {
            case 'line': object = Line3.fromJson(json.object); break
            case 'surface': object = Surface.fromJson(json.object); break
            case 'object': object = Object3.fromJson(json.object); break
            default: throw new Error(`BuilderResult: invalid type while parsing json: ${json.type}`)
        }
        return new BuilderResult(object, json.architectOpt, json.children.map((child: any) => BuilderResult.fromJson(child)))
    }

    toJson(): {} {
        return {
            type: this.object.type,
            object: this.object.toJson(),
            architectOpt: this.architectOpt,
            children: this.children.map((child) => child.toJson())
        }
    }
}