import { Builder } from "../../../../builder/builder.js"
import { ListUpdate, ListUpdateObject, ObjectUpdate, VarUpdate } from "../../../../connection/directives/update.js"
import { InternalServerWarn } from "../../../../connection/errors.js"
import { idToLabel } from "../../../../util/form.js"
import { Option } from "../../../../util/option.js"
import { RandomList } from "../../../../util/random.js"
import { Geo3Function, isGeoCompatible } from "../../../../world/geo.js"
import { Vec2 } from "../../../../world/vector.js"
import { MaterialReference } from "../../../data-pack/style/material.js"
import { ReteNode, ReteNodeUpdate } from "../rete.js"
import { RandomReteNode } from "./random.js"

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

export type NodeBuilderGetter<B extends Builder = Builder> = (getChildren: (output: string) => Builder[], getOption: (id: string) => Option | null, materials: RandomList<MaterialReference>) => B

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

    get(getBuilder: (id: string) => BuilderReteNode, getOption: (id: string) => RandomReteNode): B {
        return this.type.get(
            (output) => this.children[output].map((child) => getBuilder(child).get(getBuilder, getOption)),
            (option) => this.options[option] ? new Option(getOption(this.options[option]).random) : null,
            new RandomList()
        )
    }

    toJson(): {} {
        return {
            id: this.id,
            pos: this.pos.toJson(),
            type: this.type.id
        }
    }
}

export class IncompatibleReteBuilderTypes extends InternalServerWarn {

    constructor(readonly parent: NodeBuilderType, readonly child: NodeBuilderType, readonly port: string) {
        super(`Builders have incompatible types on port '${port}', type '${parent.label}' is incompatible with '${child.label}'`)
    }
}