import { BuilderResult } from "../builder/builder.js";
import { GenerationStyle } from "../engineer/data-pack/style/style.js";
import { StructureEngineer } from "../engineer/structure/structure.js";
import { Seed } from "../util/random.js";

export class Structure<T extends { toJson: () => {} } = any> {

    constructor(
        protected base: T,
        protected engineer: StructureEngineer<T>
    ) { }

    build(style: GenerationStyle, seed: Seed): BuilderResult<T> {
        return this.engineer.builder.build(this.base, style, seed)
    }
}