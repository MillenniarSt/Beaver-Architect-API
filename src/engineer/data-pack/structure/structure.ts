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
import { builderFromJson } from "../../../builder/collective-decorator.js";
import { BuilderDirective, CheckUpdate, ObjectUpdate } from "../../../connection/directives/update.js";
import { ClientDirector } from "../../../connection/director.js";
import type { Side } from "../../../connection/sides.js";
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
        return getProject(this.pack).dataPack.structures.get(this.location)
    }
}
export class StructureEngineer extends Engineer {

    builder: Builder

    constructor(ref: ResourceReference<StructureEngineer>, dependency: StyleDependency, builder: Builder) {
        super(ref, dependency)
        this.builder = builder
    }

    buildDependency(): void {
        this._dependency = StyleDependency.empty()
        this.refreshBuilderDependency(this.builder)
    }

    protected refreshBuilderDependency(builder: Builder) {
        builder.materials.list.forEach((material) => {
            if(material.isReference()) {
                this.dependency.materials.add({ id: material.getRef()! })
            }
            Object.entries(builder.options).forEach(([id, option]) => {
                if(option.isReference()) {
                    this.dependency.options.add({ id: option.getRef()! })
                }
            })
            builder.children.forEach((child) => {
                Object.entries(child.options).forEach(([id, option]) => {
                    if(option.isReference()) {
                        this.dependency.options.add({ id: option.getRef()! })
                    }
                })
                this.refreshBuilderDependency(child.builder)
            })
        })
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