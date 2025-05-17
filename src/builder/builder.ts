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
import { parseRecord, recordToJson, type JsonFormat, type ToJson } from "../util/util.js";
import { type GenerationStyle } from "../engineer/data-pack/style/rule.js";
import { RegistryChild } from "../register/register.js";
import { GEO_FORMS, GeoRegistry } from "../register/geo.js";
import type { RandomTypeRegistry } from "../register/random.js";

export abstract class Builder<
    Geo extends Geo3 = Geo3,
    Children extends Record<string, BuilderChild> = Record<string, BuilderChild>,
    Options extends Record<string, Option> = Record<string, Option>
> extends RegistryChild {

    constructor(
        readonly children: Children,
        readonly options: Options
    ) {
        super()
    }

    abstract getStructure(parentGeo: GeoRegistry): BuilderStructure

    abstract build(context: Geo, style: GenerationStyle, parameters: GenerationStyle, seed: Seed): BuilderResult<Geo>
}

export abstract class StandardBuilder<
    Geo extends Geo3 = Geo3,
    Children extends Record<string, BuilderChild> = Record<string, BuilderChild>,
    Options extends Record<string, Option> = Record<string, Option>
> extends Builder<Geo, Children, Options> {

    constructor(children: Children, options: Options) {
        super(children, options)
    }

    abstract get structure(): { geo: GeoRegistry, children: { [C in keyof Children]: { options: Record<string, RandomTypeRegistry>, geo: GeoRegistry, multiple: boolean } }, options: { [ O in keyof Options]: RandomTypeRegistry } }

    getStructure(parentGeo: GeoRegistry): BuilderStructure {
        return new BuilderStructure(this.structure.geo, parseRecord(this.structure.children, (child, key) => { return { options: child.options, builders: this.children[key].entries.map((entry) => entry.builder.getStructure(child.geo)), multiple: child.multiple } }), this.structure.options)
    }

    build(context: Geo, style: GenerationStyle, parameters: GenerationStyle, seed: Seed): BuilderResult<Geo> {
        return new BuilderResult(
            context,
            this.buildChildren(context, style, parameters, seed)
        )
    }

    protected abstract buildChildren(context: Geo, style: GenerationStyle, parameters: GenerationStyle, seed: Seed): BuilderResult[]

    toData(): JsonFormat {
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
        options: Options
    ) {
        super({ child: new BuilderSingleChild(child, {}) }, options)
    }

    get child(): BuilderSingleChild<ChildGeo, {}> {
        return this.children.child
    }

    abstract get structure(): { geo: GeoRegistry, childGeo: GeoRegistry, options: { [ O in keyof Options]: RandomTypeRegistry } }

    getStructure(parentGeo: GeoRegistry): BuilderStructure {
        return new BuilderStructure(this.structure.geo, { child: { options: {}, builders: [this.child.builder.getStructure(this.structure.childGeo)], multiple: false } }, this.structure.options)
    }

    build(context: Geo, style: GenerationStyle, parameters: GenerationStyle, seed: Seed): BuilderResult<Geo> {
        return new BuilderResult(
            context,
            this.buildChildren(context, style, parameters, seed)
        )
    }

    protected abstract buildChildren(context: Geo, style: GenerationStyle, parameters: GenerationStyle, seed: Seed): BuilderResult[]

    toData(): JsonFormat {
        return {
            child: this.child.toJson(),
            options: recordToJson(this.options)
        }
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

export class BuilderStructure implements ToJson {

    constructor(
        readonly geo: GeoRegistry,
        readonly children: Record<string, { options: Record<string, RandomTypeRegistry>, builders: BuilderStructure[], multiple: boolean }>,
        readonly options: Record<string, RandomTypeRegistry>
    ) { }

    toJson(): JsonFormat {
        return {
            geo: this.geo.id,
            children: parseRecord(this.children, (child) => { return { options: parseRecord(child.options, (option) => option.id), builder: child.builders.map((builder) => builder.toJson()) } }),
            options: parseRecord(this.options, (option) => option.id)
        }
    }
}

export class BuilderResult<G extends Geo3 = Geo3> implements ToJson {

    constructor(
        readonly object: G,
        readonly children: BuilderResult[] = [],
        readonly material?: JsonFormat,
        readonly resolution?: number
    ) { }

    static fromJson(json: any): BuilderResult {
        return new BuilderResult(GEO_FORMS.get(json.form).fromJson(json.object) as Geo3, json.children.map((child: any) => BuilderResult.fromJson(child)), json.material, json.resolution)
    }

    toJson(): JsonFormat {
        return {
            object: this.object.toUniversalJson(),
            materials: this.material,
            children: this.children.map((child) => child.toJson()),
            resolution: this.resolution
        }
    }
}