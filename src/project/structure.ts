import { BuilderResult } from "../builder/builder.js";
import { StructureEngineer } from "../engineer/structure/structure.js";
import { Seed } from "../util/random.js";

export class Structure<T extends { toJson: () => {} } = any> {

    constructor(
        protected base: T,
        protected engineer: StructureEngineer<T>
    ) { }

    build(seed: Seed): BuilderResult<T> {
        return this.engineer.builder.build(this.base, seed)
    }
}