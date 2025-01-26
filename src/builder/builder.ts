import { v4 } from "uuid";
import { getArchitect } from "../instance.js";
import { FormData, FormOutput } from "../util/form.js";
import { RandomList, Seed } from "../util/random.js";
import { Line3 } from "../world/geo/line.js";
import { Object3 } from "../world/geo/object.js";
import { Surface } from "../world/geo/surface.js";
import { builderFromJson } from "./collective.js";
import { MaterialReference, Style } from "../engineer/data-pack/style/style.js";

export abstract class Builder<T extends { toJson: () => {} } = any> {

    constructor(
        protected materials: RandomList<MaterialReference>
    ) {
        materials.itemToJson = (ref) => ref.toJson()
    }

    abstract get children(): Builder[]

    // User Editing

    abstract form(): FormData

    abstract edit(output: FormOutput): void

    // Building

    protected abstract buildChildren(context: T, seed: Seed): BuilderResult[]

    abstract build(context: T, seed: Seed): BuilderResult<T>

    // Json & Save

    static fromJson(json: any): Builder {
        return builderFromJson(json)
    }

    abstract toJsonData(): {}

    toJson() {
        return {
            name: this.constructor.name,
            materials: this.materials.toJson(),
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

export abstract class LineBuilder<L extends Line3 = Line3> extends Builder<L> {

    build(context: L, seed: Seed): BuilderResult<L> {
        return new BuilderResult('line', context, this.materials.seeded(seed), this.buildChildren(context, seed))
    }
}

export abstract class SurfaceBuilder<S extends Surface = Surface> extends Builder<S> {

    build(context: S, seed: Seed): BuilderResult<S> {
        return new BuilderResult('surface', context, this.materials.seeded(seed), this.buildChildren(context, seed))
    }
}

export abstract class ObjectBuilder<O extends Object3 = Object3> extends Builder<O> {

    build(context: O, seed: Seed): BuilderResult<O> {
        return new BuilderResult('object', context, this.materials.seeded(seed), this.buildChildren(context, seed))
    }
}

export type ExportToArchitectUpdate = {
    isDone?: boolean
    fail?: string
}

export class BuilderResult<T extends { toJson: () => {} } = any> {

    constructor(
        readonly type: 'line' | 'surface' | 'object',
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

    exportToArchitect(style: Style, seed: Seed, onUpdate: (data: ExportToArchitectUpdate) => void): Promise<string | null> {
        return new Promise(async (resolve) => {
            const channel = `export:${v4()}`
            await getArchitect().server.openChannel<ExportToArchitectUpdate>(`export:${channel}`, {
                seed: seed.seed,
                data: this.toArchitectData(style)
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

    toArchitectData(style: Style): {} {
        return {
            type: this.type,
            object: this.object.toJson(),
            material: this.material?.getMaterial(style).toJson(),
            children: this.children.map((child) => child.toArchitectData(style))
        }
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