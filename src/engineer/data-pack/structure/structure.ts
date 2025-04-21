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
import { CheckUpdate, ObjectUpdate, Update } from "../../../connection/directives/update.js";
import { ClientDirector, Director } from "../../../connection/director.js";
import { getProject } from "../../../instance.js";
import { Engineer, EngineerDirective, ResourceReference } from "../../engineer.js";
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

    getMap(): Map<string, StructureEngineer> {
        return getProject(this.pack).dataPack.structures
    }
}
export class StructureEngineer extends Engineer<StructureEngineer, EnStructureUpdate> {

    builder: Builder

    constructor(ref: ResourceReference<StructureEngineer>, builder: Builder) {
        super(ref)
        this.builder = builder
    }

    // TODO
    getStyleDependency(): StyleDependency {
        return StyleDependency.empty()
    }

    setBuilder(director: Director, builder: Builder) {
        this.builder = builder
        this.update(director, { refreshBuilders: true })
    }

    protected get updatePath(): string {
        return 'data-pack/structure/update'
    }

    protected get updateInstance(): Update<EnStructureUpdate> {
        return enStructureUpdate
    }

    static create(director: Director, structure: StructureEngineer): void {
        getProject(structure.reference.pack).dataPack.structures.set(structure.reference.location, structure)
        structure.save()
        director.addDirective(EngineerDirective.push(structure.updatePath, structure.reference, structure.updateInstance))
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