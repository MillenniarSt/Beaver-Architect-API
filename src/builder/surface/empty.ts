import { MaterialReference } from "../../engineer/data-pack/style/style.js";
import { FormData, FormOutput } from "../../util/form.js";
import { RandomList, Seed } from "../../util/random.js";
import { Surface } from "../../world/geo/surface.js";
import { Builder, BuilderResult, SurfaceBuilder } from "../builder.js";
import { NamedBuilder } from "../collective.js";

@NamedBuilder(EmptySurfaceBuilder.fromJson)
export class EmptySurfaceBuilder<S extends Surface = Surface> extends SurfaceBuilder<S> {

    constructor(materials: RandomList<MaterialReference> = new RandomList()) {
        super(materials)
    }

    static fromJson(json: any): EmptySurfaceBuilder {
        return new EmptySurfaceBuilder(RandomList.fromJson(json.materials, MaterialReference.fromJson))
    }

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

    toJsonData(): {} { return {} }
}