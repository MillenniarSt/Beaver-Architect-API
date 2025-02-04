import { MaterialReference } from "../../engineer/data-pack/style/material.js";
import { GenerationStyle } from "../../engineer/data-pack/style/style.js";
import { FormData, FormOutput } from "../../util/form.js";
import { RandomList, Seed } from "../../util/random.js";
import { Builder, BuilderResult, BuilderType, GenericBuilder } from "../builder.js";
import { NamedBuilder } from "../collective.js";

@NamedBuilder(EmptyBuilder.fromJson)
export class EmptyBuilder<T extends BuilderType = any, G extends { toJson: () => {} } = any> extends GenericBuilder<T, G, {}> {

    constructor(type: T, materials: RandomList<MaterialReference> = new RandomList()) {
        super(type, {}, materials)
    }

    static fromJson(json: any): EmptyBuilder {
        return new EmptyBuilder(json.data.type, RandomList.fromJson(json.materials, MaterialReference.fromJson))
    }

    get children(): Builder[] {
        return []
    }

    form(): FormData {
        return { inputs: [] }
    }

    edit(output: FormOutput): void {

    }

    protected buildChildren(context: any, style: GenerationStyle, seed: Seed): BuilderResult[] {
        return []
    }

    toJsonData(): {} {
        return {
            type: this.type
        }
    }
}