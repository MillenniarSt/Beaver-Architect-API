//             _____
//         ___/     \___        |  |
//      ##/  _.- _.-    \##  -  |  |                       -
//      ##\#=_  '    _=#/##  |  |  |  /---\  |      |      |   ===\  |  __
//      ##   \\#####//   ##  |  |  |  |___/  |===\  |===\  |   ___|  |==/
//      ##       |       ##  |  |  |  |      |   |  |   |  |  /   |  |
//      ##       |       ##  |  \= \= \====  |   |  |   |  |  \___/  |
//      ##\___   |   ___/
//      ##    \__|__/

import { Builder } from "../../builder/builder.js";
import { builderFromJson } from "../../builder/collective.js";
import { ClientDirector } from "../../connection/director.js";
import { getProject } from "../../instance.js";
import { Geo3 } from "../../world/geo.js";
import { Engineer, ResourceReference } from "../engineer.js";

export class StructureReference extends ResourceReference<StructureEngineer> {

    get folder(): string {
        return 'data_pack\\styles'
    }

    protected _get(): StructureEngineer | undefined {
        return getProject(this.pack).dataPack.engineers.structures.get(this.location)
    }
}
export class StructureEngineer<G extends Geo3 = Geo3> extends Engineer {

    builder: Builder<G>

    constructor(ref: ResourceReference<StructureEngineer>, builder: Builder<G>) {
        super(ref)
        this.builder = builder
    }

    update(director: ClientDirector, update: {}): void {
        throw new Error("Method not implemented.")
    }

    static loadFromRef(ref: ResourceReference<StructureEngineer>): StructureEngineer {
        const data = getProject(ref.pack).read(ref.path)
        return new StructureEngineer(ref,
            builderFromJson(data.builder)
        )
    }

    toJson(): {} {
        return {
            builder: this.builder.toJson()
        }
    }
}