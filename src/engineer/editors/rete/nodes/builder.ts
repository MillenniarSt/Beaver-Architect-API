//             _____
//         ___/     \___        |  |
//      ##/  _.- _.-    \##  -  |  |                       -
//      ##\#=_  '    _=#/##  |  |  |  /---\  |      |      |   ===\  |  __
//      ##   \\#####//   ##  |  |  |  |___/  |===\  |===\  |   ___|  |==/
//      ##       |       ##  |  |  |  |      |   |  |   |  |  /   |  |
//      ##       |       ##  |  \= \= \====  |   |  |   |  |  \___/  |
//      ##\___   |   ___/
//      ##    \__|__/

import { Builder } from "../../../../builder/builder.js"
import type { Option } from "../../../../builder/option.js"
import { ObjectUpdate, VarUpdate } from "../../../../connection/directives/update.js"
import { InternalServerError } from "../../../../connection/errors.js"
import { idToLabel } from "../../../../util/form.js"
import { type Geo3Function, isGeoCompatible } from "../../../../world/geo.js"
import { Vec2 } from "../../../../world/vector.js"
import { ReteNode, type ReteNodeUpdate } from "../rete.js"

const typedBuilders: Map<string, NodeBuilderType<any>> = new Map()

/**
 * Use this as an @Annotation on a Builder to register it
 */
export function NodeTypedBuilder<B extends Builder = Builder>(type: {
    label?: string,
    object: Geo3Function,
    options?: BuilderTypeOption[],
    outputs?: Record<string, BuilderTypeOutput<B>>,
    get: NodeBuilderGetter<B>
}) {
    return function (constructor: { new (...args: any): B }) {
        typedBuilders.set(constructor.name, new NodeBuilderType(constructor.name, type.label ?? idToLabel(type.label!), type.object, type.options ?? [], type.outputs ?? {}, type.get))
    }
}

export function getBuilderReteType(type: string): NodeBuilderType | undefined {
    return typedBuilders.get(type)
}

export type BuilderTypeOption = { 
    id: string, 
    label?: string
}

export type BuilderTypeOutput<B extends Builder = Builder> = { 
    label?: string, 
    multiple?: boolean, 
    object: Geo3Function, 
    getChildren: (builder: B) => Builder[]
}

export type NodeBuilderGetter<B extends Builder = Builder> = (getChild: (output: string) => Builder, getChildren: (output: string) => Builder[], getOption: (id: string) => Option | null) => B

export class NodeBuilderType<B extends Builder = Builder> {

    constructor(
        readonly id: string,
        readonly label: string,
        readonly object: Geo3Function,
        readonly options: BuilderTypeOption[],
        readonly outputs: Record<string, BuilderTypeOutput<B>>,
        readonly get: NodeBuilderGetter<B>
    ) { }

    isCompatibleChild(port: string, type: NodeBuilderType): boolean {
        return isGeoCompatible(this.outputs[port].object, type.object)
    }

    toJson() {
        return {
            id: this.id,
            label: this.label,
            object: this.object?.name,
            options: this.options,
            outputs: this.outputs
        }
    }
}

export type BuilderReteNodeUpdate = ReteNodeUpdate & {
    type?: string
}

export const builderReteNodeUpdate = new ObjectUpdate<BuilderReteNodeUpdate>({
    pos: new VarUpdate(),
    type: new VarUpdate()
})

export class BuilderReteNode<B extends Builder = Builder> extends ReteNode {

    constructor(
        public type: NodeBuilderType<B>,
        pos: Vec2,
        id?: string,
    ) {
        super(pos, id)
    }

    static fromJson(json: any): BuilderReteNode {
        return new BuilderReteNode(json.type, Vec2.fromJson(json.pos), json.id)
    }

    shouldReplaceChild(port: string): boolean {
        return !(this.type.outputs[port].multiple ?? false)
    }

    isValidChild(port: string, type: NodeBuilderType): boolean {
        return this.type.isCompatibleChild(port, type)
    }

    toJson(): {} {
        return {
            id: this.id,
            pos: this.pos.toJson(),
            type: this.type.id
        }
    }
}

export class IncompatibleReteBuilderTypes extends InternalServerError {

    constructor(readonly parent: NodeBuilderType, readonly child: NodeBuilderType, readonly port: string) {
        super(`Builders have incompatible types on port '${port}', type '${parent.label}' is incompatible with '${child.label}'`)
    }
}