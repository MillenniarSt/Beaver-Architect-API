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
import { BuilderDirective, CheckUpdate, ObjectUpdate } from "../../connection/directives/update.js";
import { ClientDirector } from "../../connection/director.js";
import { getProject } from "../../instance.js";
import { Geo3 } from "../../world/geo.js";
import { Engineer, ResourceReference } from "../engineer.js";

export type EnStructureUpdate = {
    refreshBuilders: boolean
}

export const enStructureUpdate = new ObjectUpdate<EnStructureUpdate>({
    refreshBuilders: new CheckUpdate()
})

export class StructureReference extends ResourceReference<StructureEngineer> {

    get folder(): string {
        return 'data_pack\\structures'
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

    update(director: ClientDirector, update: EnStructureUpdate): void {
        director.addDirective(BuilderDirective.update('data-pack/structures/update', this.reference, enStructureUpdate, update))
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