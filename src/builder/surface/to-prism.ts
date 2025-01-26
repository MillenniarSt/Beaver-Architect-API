import { MaterialReference } from "../../engineer/data-pack/style/style.js";
import { FormData, FormOutput } from "../../util/form.js";
import { RandomList, RandomNumber, Seed } from "../../util/random.js";
import { Plane2 } from "../../world/bi-geo/plane.js";
import { Prism } from "../../world/geo/object.js";
import { Plane3 } from "../../world/geo/surface.js";
import { Builder, BuilderResult, ObjectBuilder, SurfaceBuilder } from "../builder.js";
import { NamedBuilder } from "../collective.js";
import { EmptyObjectBuilder } from "../object/empty.js";

@NamedBuilder(PlaneToPrismBuilder.fromJson)
export class PlaneToPrismBuilder<P extends Plane2 = Plane2> extends SurfaceBuilder<Plane3<P>> {

    protected child: ObjectBuilder<Prism<P>> = new EmptyObjectBuilder()

    protected height: RandomNumber = RandomNumber.constant(1)

    constructor(data: {
        child?: ObjectBuilder<Prism<P>>
        height?: RandomNumber
    } = {},
        materials: RandomList<MaterialReference> = new RandomList()
    ) {
        super(materials)
        this.child = data.child ?? new EmptyObjectBuilder()
        this.height = data.height ?? RandomNumber.constant(1)
    }

    static fromJson(json: any): PlaneToPrismBuilder {
        const data = json.data
        return new PlaneToPrismBuilder({
            child: Builder.fromJson(data.child),
            height: RandomNumber.fromJson(data.height),
        }, RandomList.fromJson(json.materials, MaterialReference.fromJson))
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

    protected buildChildren(context: Plane3<P>, seed: Seed): BuilderResult[] {
        const prism = new Prism(context.plane, this.height.seeded(seed), context.pos)
        return [this.child.build(prism, seed)]
    }

    get children(): [Builder<Prism<P>>] {
        return [this.child]
    }

    toJsonData(): {} {
        return {
            child: this.child.toJson(),
            height: this.height.toJson()
        }
    }
}