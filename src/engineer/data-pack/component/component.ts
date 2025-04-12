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
import type { ClientDirector } from "../../../connection/director"
import { getProject } from "../../../instance"
import { mapToRecord } from "../../../util/util"
import { Engineer, ResourceReference } from "../../engineer"
import { StyleDependency } from "../style/dependency"

export class ComponentReference extends ResourceReference<Component> {

    get folder(): string {
        return 'data_pack\\components'
    }

    protected _get(): Component | undefined {
        return getProject(this.pack).dataPack.components.get(this.location)
    }
}

export class Component extends Engineer {

    constructor(
        ref: ResourceReference<Component>,
        readonly builder: Builder = EmptyBuilder.VOID,
        readonly parameters: Map<string, string> = new Map()
    ) {
        super(ref)
    }

    update(director: ClientDirector, update: {}): void {
        throw new Error("Method not implemented.")
    }

    getStyleDependency(): StyleDependency {
        return new StyleDependency(mapToRecord(this.parameters, (type) => type))
    }

    static loadFromRef(ref: ResourceReference<Component>): Component {
        const data = getProject(ref.pack).read(ref.path)
        return new Component(ref,
            builderFromJson(data.builder),
            new Map(Object.entries(data.parameters))
        )
    }

    toJson(): {} {
        return {
            builder: this.builder.toJson(),
            parameters: Object.fromEntries(Object.entries(this.parameters.values()))
        }
    }
}