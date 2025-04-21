//             _____
//         ___/     \___        |  |
//      ##/  _.- _.-    \##  -  |  |                       -
//      ##\#=_  '    _=#/##  |  |  |  /---\  |      |      |   ===\  |  __
//      ##   \\#####//   ##  |  |  |  |___/  |===\  |===\  |   ___|  |==/
//      ##       |       ##  |  |  |  |      |   |  |   |  |  /   |  |
//      ##       |       ##  |  \= \= \====  |   |  |   |  |  \___/  |
//      ##\___   |   ___/
//      ##    \__|__/

import { Builder } from "../../../builder/builder"
import { builderFromJson } from "../../../builder/collective"
import { EmptyBuilder } from "../../../builder/generic/empty"
import { ObjectUpdate, type Update } from "../../../connection/directives/update"
import type { ClientDirector } from "../../../connection/director"
import { getProject } from "../../../instance"
import { Engineer, EngineerDirective, ResourceReference } from "../../engineer"
import { StyleDependency } from "../style/dependency"

export type ComponentUpdate = {

}

export const componentUpdate = new ObjectUpdate<ComponentUpdate>({

})

export class ComponentReference extends ResourceReference<Component> {

    get folder(): string {
        return 'data_pack\\components'
    }

    getMap(): Map<string, Component> {
        return getProject(this.pack).dataPack.components
    }
}

export class Component extends Engineer<Component, ComponentUpdate> {

    constructor(
        ref: ResourceReference<Component>,
        readonly builder: Builder = EmptyBuilder.VOID,
        readonly parameters: StyleDependency
    ) {
        super(ref)
    }

    protected get updatePath(): string {
        return 'data-pack/component/update'
    }

    protected get updateInstance(): Update<ComponentUpdate> {
        return componentUpdate
    }

    getStyleDependency(): StyleDependency {
        return this.parameters
    }

    static create(director: ClientDirector, component: Component): void {
        getProject(component.reference.pack).dataPack.components.set(component.reference.location, component)
        component.save()
        director.addDirective(EngineerDirective.push(component.updatePath, component.reference, component.updateInstance))
    }

    static loadFromRef(ref: ResourceReference<Component>): Component {
        const data = getProject(ref.pack).read(ref.path)
        return new Component(ref,
            builderFromJson(data.builder),
            StyleDependency.fromJson(data.parameters)
        )
    }

    toJson(): {} {
        return {
            builder: this.builder.toJson(),
            parameters: this.parameters.toJson()
        }
    }
}