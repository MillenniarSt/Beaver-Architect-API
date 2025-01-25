import { FormData, FormOutput } from "../../util/form.js";
import { RandomNumber, Seed } from "../../util/random.js";
import { Plane2 } from "../../world/bi-geo/plane.js";
import { Prism } from "../../world/geo/object.js";
import { Plane3 } from "../../world/geo/plane.js";
import { Builder, BuilderResult, ObjectBuilder, PlaneBuilder, EmptyBuilder } from "../builder.js";
import { builderFromJson } from "../collective.js";

export class PlaneToPrismBuilder<P extends Plane2 = Plane2> extends PlaneBuilder<P> {

    protected child: ObjectBuilder<Prism<P>> = new EmptyBuilder()

    protected height: RandomNumber = RandomNumber.constant(1)

    static create<P extends Plane2 = Plane2>(data: {
        child: ObjectBuilder<Prism<P>>
        height: RandomNumber
    }): PlaneToPrismBuilder<P> {
        const builder = new PlaneToPrismBuilder<P>()
        builder.child = data.child ?? new EmptyBuilder()
        builder.height = data.height ?? RandomNumber.constant(1)
        return builder
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
        const prism = new Prism(context.plane, context.y, this.height.seeded(seed))
        return [this.child.build(prism, seed)]
    }

    get children(): [Builder<Prism<P>>] {
        return [this.child]
    }

    fromJsonData(data: any): void {
        this.child = builderFromJson(data.child)
        this.height = RandomNumber.fromJson(data.height)
    }

    toJsonData(): {} {
        return {
            child: this.child.toJson(),
            height: this.height.toJson()
        }
    }
}