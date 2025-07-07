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
import { Geo, type Geo3 } from "../world/geo.js";
import { joinBiLists, parseRecord, recordToJson, type JsonFormat, type ToJson } from "../util/util.js";
import { type GenerationStyle } from "../engineer/data-pack/style/rule.js";
import { RegistryChild } from "../register/register.js";
import { GEO_FORMS, GeoRegistry, GEOS } from "../register/geo.js";
import { RANDOM_TYPES, type RandomTypeRegistry } from "../register/random.js";
import { BufferListScheme, BufferObjectScheme, BufferStringScheme, type BufferFormat, type BufferScheme } from "../util/buffer.js";

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

    toCpp(name: string = 'result'): string {
        return `{
    ${this.buildToCpp()}
    ${name}.children.push_back(child)
}`
    }

    buildToCpp(): string {
        return 'SUS'
    }
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

    get length(): number {
        return this.entries.length
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

    static fromJson(json: any): BuilderStructure {
        return new BuilderStructure(
            GEOS.get(json.geo), 
            parseRecord(json.children, (child: any) => { return { options: parseRecord(child.options, (option: any) => RANDOM_TYPES.get(option)), builders: child.builders.map((builder: any) => BuilderStructure.fromJson(builder)), multiple: child.multiple } }),
            parseRecord(json.options, (option: any) => RANDOM_TYPES.get(option))
        )
    }

    toJson(): JsonFormat {
        return {
            geo: this.geo.id,
            children: parseRecord(this.children, (child) => { return { options: parseRecord(child.options, (option) => option.id), builders: child.builders.map((builder) => builder.toJson()), multiple: child.multiple } }),
            options: parseRecord(this.options, (option) => option.id)
        }
    }
}

export class BuilderResult<G extends Geo3 = Geo3> implements ToJson {

    constructor(
        readonly object: G,
        readonly children: BuilderResult[] = [],
        readonly material?: { random: string, data: JsonFormat },
        readonly output?: { key: string, data: JsonFormat },
        readonly resolution?: number
    ) { }

    static fromJson(json: any): BuilderResult {
        return new BuilderResult(GEO_FORMS.fromJson(json.object) as Geo3, json.children.map((child: any) => BuilderResult.fromJson(child)), json.material, json.resolution)
    }

    toFlat(): BuilderFlatResult {
        let result = BuilderFlatResult.combine(this.children.map((child) => child.toFlat()))
        if(this.material) {
            result.materials.push({ geo: this.object, random: this.material.random, data: this.material.data })
        }
        if(this.output) {
            result.outputs[this.output.key] = this.output.data
        }
        return result
    }

    toJson(): JsonFormat {
        return {
            object: this.object.toUniversalJson(),
            material: this.material,
            children: this.children.map((child) => child.toJson()),
            resolution: this.resolution
        }
    }
}

export class BuilderFlatResult implements ToJson {

    static readonly materialsBufferScheme = new BufferListScheme(new BufferObjectScheme([
        ['geo', GEO_FORMS.bufferScheme],
        ['random', new BufferStringScheme()],
        ['data', new BufferStringScheme()]
    ]))

    constructor(
        public materials: { geo: Geo, random: string, data: JsonFormat }[] = [],
        public outputs: Record<string, JsonFormat> = {}
    ) { }

    static combine(results: BuilderFlatResult[]): BuilderFlatResult {
        return new BuilderFlatResult(joinBiLists(results.map((result) => result.materials)), Object.fromEntries(joinBiLists(results.map((result) => Object.entries(result.outputs)))))
    }

    static fromJson(json: any): BuilderFlatResult {
        return new BuilderFlatResult(json.map((material: any) => { return { geo: GEO_FORMS.fromJson(material.geo), random: material.random, data: material.data } }), json.outputs)
    }

    join(result: BuilderFlatResult) {
        this.materials.concat(result.materials)
        this.outputs = { ...this.outputs, ...result.outputs }
    }

    materialsToJson(): JsonFormat {
        return this.materials.map((material) => { return { geo: material.geo.toUniversalJson(), random: material.random, data: material.data } })
    }

    materialsToBufferFormat() {
        return this.materials.map((material) => { return { 
            geo: {
                key: material.geo.form,
                value: material.geo.toUniversalData()
            },
            random: material.random,
            data: JSON.stringify(material.data)
        } })
    }

    outputsToJson(): JsonFormat {
        return this.outputs
    }

    toJson(): JsonFormat {
        return {
            materials: this.materialsToJson(),
            outputs: this.outputsToJson()
        }
    }

    writeMaterialsBufferScheme(buffer: Buffer, offset: number): number {
        return BuilderFlatResult.materialsBufferScheme.write(buffer, offset, this.materials.map((material) => { return { 
            geo: material.geo.toUniversalJson(),
            random: material.random,
            data: JSON.stringify(material.data)
        } }))
    }
}