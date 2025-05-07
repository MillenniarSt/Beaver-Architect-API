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
import { Option } from "./option.js";
import { type Geo3 } from "../world/geo.js";
import { parseRecord, recordToJson, type ToJson } from "../util/util.js";
import { type GenerationStyle } from "../engineer/data-pack/style/rule.js";
import { RegistryChild } from "../register/register.js";
import { GEO_FORMS } from "../register/geo.js";

export abstract class Builder<
    Geo extends Geo3 = Geo3, 
    Children extends Record<string, BuilderChild> = Record<string, BuilderChild>, 
    Options extends Record<string, Option> = Record<string, Option>
> extends RegistryChild {

    constructor(
        readonly children: Children,
        readonly options: Options,
        readonly architectOptions: Record<string, Option> = {}
    ) {
        super()
    }

    protected abstract buildChildren(context: Geo, style: GenerationStyle, parameters: GenerationStyle, seed: Seed): BuilderResult[]

    build(context: Geo, style: GenerationStyle, parameters: GenerationStyle, seed: Seed): BuilderResult<Geo> {
        return new BuilderResult(
            context,
            parseRecord(this.architectOptions, (option) => option.get(style, parameters, seed)),
            this.buildChildren(context, style, parameters, seed)
        )
    }

    toData(): {} {
        return {
            children: recordToJson(this.children),
            options: recordToJson(this.options)
        }
    }
}

export type OneChildBuilderChildren<ChildGeo extends Geo3 = Geo3> = { child: BuilderSingleChild<ChildGeo, {}> }

export abstract class OneChildBuilder<Geo extends Geo3 = Geo3, ChildGeo extends Geo3 = Geo3, Options extends Record<string, Option> = Record<string, Option>> extends Builder<Geo, OneChildBuilderChildren<ChildGeo>, Options> {

    constructor(
        child: Builder<ChildGeo>,
        options: Options,
        architectOptions: Record<string, Option> = {}
    ) {
        super({ child: new BuilderSingleChild(child, {}) }, options, architectOptions)
    }

    get child(): BuilderSingleChild<ChildGeo, {}> {
        return this.children.child
    }
}

export type BuilderChildEntry<Geo extends Geo3 = Geo3, Options extends Record<string, Option> = Record<string, Option>> = {
    builder: Builder<Geo>,
    options: Options
}

export abstract class BuilderChild<Geo extends Geo3 = Geo3, Options extends Record<string, Option> = Record<string, Option>> implements ToJson {

    abstract get entries(): BuilderChildEntry<Geo, Options>[]

    abstract toJson(): {}
}

export class BuilderMultipleChild<Geo extends Geo3 = Geo3, Options extends Record<string, Option> = Record<string, Option>> extends BuilderChild<Geo, Options> {

    constructor(
        readonly entries: BuilderChildEntry<Geo, Options>[]
    ) {
        super()
    }

    toJson(): {} {
        return this.entries.map((entry) => {
            return { builder: entry.builder.toJson(), options: recordToJson(entry.options) }
        })
    }
}

export class BuilderSingleChild<Geo extends Geo3 = Geo3, Options extends Record<string, Option> = Record<string, Option>> extends BuilderChild<Geo, Options> {

    constructor(
        readonly builder: Builder<Geo>,
        readonly options: Options
    ) {
        super()
    }

    get entries(): BuilderChildEntry<Geo, Options>[] {
        return [{ builder: this.builder, options: this.options }]
    }

    toJson(): {} {
        return { builder: this.builder.toJson(), options: recordToJson(this.options) }
    }
}

export class BuilderResult<G extends Geo3 = Geo3> implements ToJson {

    constructor(
        readonly object: G,
        readonly architectOpt: Record<string, any>,
        readonly children: BuilderResult[] = []
    ) { }

    static fromJson(json: any): BuilderResult {
        return new BuilderResult(GEO_FORMS.get(json.form).fromJson(json.object) as Geo3, json.architectOpt, json.children.map((child: any) => BuilderResult.fromJson(child)))
    }

    toJson(): {} {
        return {
            object: this.object.toUniversalJson(),
            architectOpt: this.architectOpt,
            children: this.children.map((child) => child.toJson())
        }
    }
}