//             _____
//         ___/     \___        |  |
//      ##/  _.- _.-    \##  -  |  |                       -
//      ##\#=_  '    _=#/##  |  |  |  /---\  |      |      |   ===\  |  __
//      ##   \\#####//   ##  |  |  |  |___/  |===\  |===\  |   ___|  |==/
//      ##       |       ##  |  |  |  |      |   |  |   |  |  /   |  |
//      ##       |       ##  |  \= \= \====  |   |  |   |  |  \___/  |
//      ##\___   |   ___/
//      ##    \__|__/

import { Builder } from "../../../builder/builder.js";
import { builderFromJson } from "../../../builder/collective.js";
import { BuilderDirective, CheckUpdate, ObjectUpdate } from "../../../connection/directives/update.js";
import { ClientDirector } from "../../../connection/director.js";
import { getProject } from "../../../instance.js";
import { Engineer, ResourceReference } from "../../engineer.js";
import { StyleDependency } from "../style/dependency.js";

export type EnStructureUpdate = {
    refreshBuilders?: boolean
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
export class StructureEngineer extends Engineer {

    builder: Builder

    constructor(ref: ResourceReference<StructureEngineer>, dependency: StyleDependency, builder: Builder) {
        super(ref, dependency)
        this.builder = builder
    }

    setBuilder(director: ClientDirector, builder: Builder) {
        this.builder = builder
        this.update(director, { refreshBuilders: true })
    }

    update(director: ClientDirector, update: EnStructureUpdate): void {
        director.addDirective(BuilderDirective.update('data-pack/structures/update', this.reference, enStructureUpdate, update))
    }

    static loadFromRef(ref: ResourceReference<StructureEngineer>): StructureEngineer {
        const data = getProject(ref.pack).read(ref.path)
        return new StructureEngineer(ref,
            StyleDependency.fromJson(data.dependency),
            builderFromJson(data.builder)
        )
    }

    toJson(): {} {
        return {
            dependency: this.dependency.toJson(),
            builder: this.builder.toJson()
        }
    }
}