import { FormData, FormOutput } from "../util/form.js";
import { RandomList, Seed } from "../util/random.js";
import { Line3 } from "../world/geo/line.js";
import { Object3 } from "../world/geo/object.js";
import { Surface } from "../world/geo/surface.js";
import { builderFromJson } from "./collective.js";
import { MaterialReference } from "../engineer/data-pack/style/material.js";
import { Option } from "../util/option.js";
import { GenerationStyle } from "../engineer/data-pack/style/style.js";
import { Geo3 } from "../world/geo.js";

export abstract class Builder<G extends Geo3 = any, O extends Record<string, Option> = Record<string, Option>> {

    constructor(
        readonly options: O,
        protected materials: RandomList<MaterialReference>
    ) {
        materials.itemToJson = (ref) => ref.toJson()
    }

    abstract get children(): Builder[]

    // User Editing

    abstract form(): FormData

    abstract edit(output: FormOutput): void

    // Building

    protected abstract buildChildren(context: G, style: GenerationStyle, seed: Seed): BuilderResult[]

    abstract build(context: G, style: GenerationStyle, seed: Seed): BuilderResult<G>

    // Json & Save

    static fromJson(json: any): Builder {
        return builderFromJson(json)
    }

    abstract toJsonData(): {}

    toJson() {
        return {
            name: this.constructor.name,
            materials: this.materials.toJson(),
            options: Object.fromEntries(Object.entries(this.options).map(([key, option]) => [key, option.toJson()])),
            data: this.toJsonData()
        }
    }

    // Utils

    /**
     * Do NOT change, implement instead ChildrenManager
     * @returns if Builder is an instance of ChildrenManager
     */
    canManageChildren(): boolean {
        return false
    }
}

export abstract class GenericBuilder<G extends Geo3 = any, O extends Record<string, Option> = Record<string, Option>> extends Builder<G, O> {

    constructor(
        readonly type: BuilderType,
        readonly options: O,
        protected materials: RandomList<MaterialReference>
    ) {
        super(options, materials)
    }

    build(context: G, style: GenerationStyle, seed: Seed): BuilderResult<G> {
        return new BuilderResult(this.type, context, this.materials.seeded(seed), this.buildChildren(context, style, seed))
    }
}

export abstract class LineBuilder<L extends Line3 = Line3, O extends Record<string, Option> = Record<string, Option>> extends Builder<L, O> {

    build(context: L, style: GenerationStyle, seed: Seed): BuilderResult<L> {
        return new BuilderResult('line', context, this.materials.seeded(seed), this.buildChildren(context, style, seed))
    }
}

export abstract class SurfaceBuilder<S extends Surface = Surface, O extends Record<string, Option> = Record<string, Option>> extends Builder<S, O> {

    build(context: S, style: GenerationStyle, seed: Seed): BuilderResult<S> {
        return new BuilderResult('surface', context, this.materials.seeded(seed), this.buildChildren(context, style, seed))
    }
}

export abstract class ObjectBuilder<O extends Object3 = Object3, Opt extends Record<string, Option> = Record<string, Option>> extends Builder<O, Opt> {

    build(context: O, style: GenerationStyle, seed: Seed): BuilderResult<O> {
        return new BuilderResult('object', context, this.materials.seeded(seed), this.buildChildren(context, style, seed))
    }
}

export type BuilderType = 'line' | 'surface' | 'object'

export class BuilderResult<T extends Geo3 = any> {

    constructor(
        readonly type: BuilderType,
        readonly object: T,
        readonly material: MaterialReference | undefined = undefined,
        readonly children: BuilderResult[] = [],
    ) { }

    static fromJson(json: any): BuilderResult {
        let object
        switch(json.type) {
            case 'line': object = Line3.fromJson(json.object); break
            case 'surface': object = Surface.fromJson(json.object); break
            case 'object': object = Object3.fromJson(json.object); break
            default: throw new Error(`BuilderResult: invalid type while parsing json: ${json.type}`)
        }
        return new BuilderResult(json.type, object, json.material ? MaterialReference.fromJson(json.material) : undefined, json.children.map((child: any) => BuilderResult.fromJson(child)))
    }

    toJson(): {} {
        return {
            type: this.type,
            object: this.object.toJson(),
            material: this.material?.toJson(),
            children: this.children.map((child) => child.toJson())
        }
    }
}

export abstract class ChildrenManager {

    canManageChildren(): boolean {
        return true
    }

    abstract canAddChild(): boolean

    abstract addChild(): void
}