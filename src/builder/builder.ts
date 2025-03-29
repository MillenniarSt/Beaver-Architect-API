//             _____
//         ___/     \___        |  |
//      ##/  _.- _.-    \##  -  |  |                       -
//      ##\#=_  '    _=#/##  |  |  |  /---\  |      |      |   ===\  |  __
//      ##   \\#####//   ##  |  |  |  |___/  |===\  |===\  |   ___|  |==/
//      ##       |       ##  |  |  |  |      |   |  |   |  |  /   |  |
//      ##       |       ##  |  \= \= \====  |   |  |   |  |  \___/  |
//      ##\___   |   ___/
//      ##    \__|__/

import { RandomList, Seed } from "../util/random.js";
import { Line3 } from "../world/geo/line.js";
import { Object3 } from "../world/geo/object.js";
import { Surface } from "../world/geo/surface.js";
import { builderFromJson } from "./collective.js";
import { MaterialReference } from "../engineer/data-pack/style/material.js";
import { Option } from "../util/option.js";
import { GenerationStyle } from "../engineer/data-pack/style/style.js";
import { type Geo3 } from "../world/geo.js";

export type BuilderChild<B extends Builder, O extends Record<string, Option>> = {
    builder: B
    options: O
}

export abstract class Builder<G extends Geo3 = any, O extends Record<string, Option> = Record<string, Option>, C extends Record<string, Option> = Record<string, Option>> {

    constructor(
        readonly options: O,
        public materials: RandomList<MaterialReference>
    ) {
        materials.itemToJson = (ref) => ref.toJson()
    }

    abstract get children(): BuilderChild<Builder, C>[]

    // Building

    protected abstract buildChildren(context: G, style: GenerationStyle, seed: Seed): BuilderResult[]

    build(context: G, style: GenerationStyle, seed: Seed): BuilderResult<G> {
        return new BuilderResult(context, this.materials.seeded(seed), this.buildChildren(context, style, seed))
    }

    // Json & Save

    static fromJson(json: any): Builder {
        return builderFromJson(json)
    }

    toJson() {
        return {
            name: this.constructor.name,
            materials: this.materials.toJson(),
            options: Object.fromEntries(Object.entries(this.options).map(([key, option]) => [key, option.toJson()])),
            children: this.children.map((child: any) => { return {
                builder: child.builder.toJson(),
                options: Object.fromEntries(Object.entries(child.options).map(([key, option]: [string, any]) => [key, option.toJson()]))
            } })
        }
    }

    // Utils

    get type(): string {
        return this.constructor.name
    }
}

export abstract class LineBuilder<L extends Line3 = Line3, O extends Record<string, Option> = Record<string, Option>, C extends Record<string, Option> = Record<string, Option>> extends Builder<L, O, C> { }

export abstract class SurfaceBuilder<S extends Surface = Surface, O extends Record<string, Option> = Record<string, Option>, C extends Record<string, Option> = Record<string, Option>> extends Builder<S, O, C> { }

export abstract class ObjectBuilder<O extends Object3 = Object3, Opt extends Record<string, Option> = Record<string, Option>, C extends Record<string, Option> = Record<string, Option>> extends Builder<O, Opt, C> { }

export class BuilderResult<T extends Geo3 = any> {

    constructor(
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
        return new BuilderResult(object, json.material ? MaterialReference.fromJson(json.material) : undefined, json.children.map((child: any) => BuilderResult.fromJson(child)))
    }

    toJson(): {} {
        return {
            type: this.object.type,
            object: this.object.toJson(),
            material: this.material?.toJson(),
            children: this.children.map((child) => child.toJson())
        }
    }
}

export abstract class ChildrenManager {

    abstract canAddChild(): boolean

    abstract addChild(): void
}