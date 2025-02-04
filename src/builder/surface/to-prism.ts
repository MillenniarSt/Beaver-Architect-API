import { MaterialReference } from "../../engineer/data-pack/style/material.js";
import { GenerationStyle } from "../../engineer/data-pack/style/style.js";
import { FormData, FormOutput } from "../../util/form.js";
import { NumberOption } from "../../util/option.js";
import { RandomList, RandomNumber, Seed } from "../../util/random.js";
import { Plane2 } from "../../world/bi-geo/plane.js";
import { Prism } from "../../world/geo/object.js";
import { Plane3 } from "../../world/geo/surface.js";
import { Builder, BuilderResult, ObjectBuilder, SurfaceBuilder } from "../builder.js";
import { NamedBuilder } from "../collective.js";

@NamedBuilder(SurfaceToPrismBuilder.fromJson)
export class SurfaceToPrismBuilder<P extends Plane2 = Plane2> extends SurfaceBuilder<Plane3<P>, {
    height: NumberOption
}> {

    constructor(
        protected child: ObjectBuilder<Prism<P>>,
        options: {
            height?: NumberOption
        } = {},
        materials: RandomList<MaterialReference> = new RandomList()
    ) {
        super({
            height: options.height ?? new NumberOption(RandomNumber.constant(1))
        }, materials)
    }

    static fromJson(json: any): SurfaceToPrismBuilder {
        return new SurfaceToPrismBuilder(
            Builder.fromJson(json.data.child),
            {
                height: NumberOption.fromJson(json.options.height),
            },
            RandomList.fromJson(json.materials, MaterialReference.fromJson)
        )
    }

    form(): FormData {
        return {
            inputs: [
                // TODO
            ]
        }
    }

    edit(output: FormOutput): void {
        // TODO
    }

    protected buildChildren(context: Plane3<P>, style: GenerationStyle, seed: Seed): BuilderResult[] {
        const prism = new Prism(context, this.options.height.get(style, seed))
        console.debug(prism.base)
        return [this.child.build(prism, style, seed)]
    }

    get children(): [Builder<Prism<P>>] {
        return [this.child]
    }

    toJsonData(): {} {
        return {
            child: this.child.toJson()
        }
    }
}