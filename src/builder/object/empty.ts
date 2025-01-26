import { MaterialReference } from "../../engineer/data-pack/style/style.js";
import { FormData, FormOutput } from "../../util/form.js";
import { RandomList, Seed } from "../../util/random.js";
import { Object3 } from "../../world/geo/object.js";
import { Builder, BuilderResult, ObjectBuilder } from "../builder.js";
import { NamedBuilder } from "../collective.js";

@NamedBuilder(EmptyObjectBuilder.fromJson)
export class EmptyObjectBuilder<O extends Object3 = Object3> extends ObjectBuilder<O> {

    constructor(materials: RandomList<MaterialReference> = new RandomList()) {
        super(materials)
    }

    static fromJson(json: any): EmptyObjectBuilder {
        return new EmptyObjectBuilder(RandomList.fromJson(json.materials, MaterialReference.fromJson))
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