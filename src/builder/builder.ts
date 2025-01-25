import { v4 } from "uuid";
import { getArchitect } from "../instance.js";
import { FormData, FormOutput } from "../util/form.js";
import { RandomList, Seed } from "../util/random.js";
import { Plane2 } from "../world/bi-geo/plane.js";
import { Line3 } from "../world/geo/line.js";
import { Object3 } from "../world/geo/object.js";
import { Plane3 } from "../world/geo/plane.js";
import { NamedBuilder } from "./collective.js";
import { MaterialReference, Style } from "../engineer/data-pack/style/style.js";

export abstract class Builder<T extends { toJson: () => {} } = any> {

    protected materials: RandomList<MaterialReference>

    constructor(readonly json: any = {}) {
        this.materials = json.materials ? new RandomList<MaterialReference>([]) : RandomList.fromJson(json.materials)
        this.fromJsonData(json.data ?? {})
    }

    abstract get children(): Builder[]

    // User Editing

    abstract form(): FormData

    abstract edit(output: FormOutput): void

    // Building

    protected abstract buildChildren(context: T, seed: Seed): BuilderResult[]

    build(context: T, seed: Seed): BuilderResult<T> {
        return new BuilderResult(context, this.materials.seeded(seed), this.buildChildren(context, seed))
    }

    // Json & Save

    abstract fromJsonData(data: any): void

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

}

export abstract class PlaneBuilder<P extends Plane2 = Plane2> extends Builder<Plane3<P>> {

}

export abstract class ObjectBuilder<O extends Object3 = Object3> extends Builder<O> {

}

export type ExportToArchitectUpdate = {
    isDone?: boolean
    fail?: string
}

export class BuilderResult<T extends { toJson: () => {} } = any> {

    constructor(
        readonly object: T,
        readonly material: MaterialReference | undefined = undefined,
        readonly children: BuilderResult[] = [],
    ) { }

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
            object: this.object.toJson(),
            material: this.material?.getMaterial(style).toJson(),
            children: this.children.map((child) => child.toArchitectData(style))
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

@NamedBuilder()
export class EmptyBuilder extends Builder<any> {

    get children(): Builder[] {
        return []
    }

    form(): FormData {
        return { inputs: [] }
    }

    edit(output: FormOutput): void {

    }

    protected buildChildren(context: any, seed: Seed): BuilderResult[] {
        return []
    }

    fromJsonData(data: any): void { }

    toJsonData(): {} { return {} }
}