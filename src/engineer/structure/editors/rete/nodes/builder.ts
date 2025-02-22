import { Builder } from "../../../../../builder/builder.js"
import { idToLabel } from "../../../../../util/form.js"
import { Option } from "../../../../../util/option.js"
import { RandomList } from "../../../../../util/random.js"
import { Vec2 } from "../../../../../world/vector.js"
import { MaterialReference } from "../../../../data-pack/style/material.js"
import { ReteNode } from "../../../../editors/rete.js"
import { OptionReteNode } from "./option.js"

const typedBuilders: Map<string, NodeBuilderType<any>> = new Map()

/**
 * Use this as an @Annotation on a Builder to register it
 */
export function NodeTypedBuilder<B extends Builder = Builder>(type: {
    label?: string,
    object?: string,
    options?: BuilderTypeOption[],
    outputs?: BuilderTypeOutput<B>[],
    get: NodeBuilderGetter<B>
}) {
    return function (constructor: { new (...args: any): B }) {
        typedBuilders.set(constructor.name, new NodeBuilderType(constructor.name, type.label ?? idToLabel(type.label!), type.object ?? null, type.options ?? [], type.outputs ?? [], type.get))
    }
}

export function getBuilderType(type: string): NodeBuilderType {
    return typedBuilders.get(type)!
}

export type BuilderTypeOption = { 
    id: string, 
    label?: string
}

export type BuilderTypeOutput<B extends Builder = Builder> = { 
    id: string, 
    label?: string, 
    multiple?: boolean, 
    object?: string | null, 
    getChildren: (builder: B) => Builder[]
}

export type NodeBuilderGetter<B extends Builder = Builder> = (getChildren: (output: string) => Builder[], getOption: (id: string) => Option | null, materials: RandomList<MaterialReference>) => B

export class NodeBuilderType<B extends Builder = Builder> {

    constructor(
        readonly id: string,
        readonly label: string,
        readonly object: string | null,
        readonly options: BuilderTypeOption[],
        readonly outputs: BuilderTypeOutput<B>[],
        readonly get: NodeBuilderGetter<B>
    ) { }

    toJson() {
        return {
            id: this.id,
            label: this.label,
            object: this.object,
            options: this.options,
            outputs: this.outputs
        }
    }
}

export class BuilderReteNode<B extends Builder = Builder> extends ReteNode {

    constructor(
        public type: NodeBuilderType<B>,
        public parent: string | null,
        public options: Record<string, string | null>,
        public children: Record<string, string[]>,
        pos: Vec2,
        id?: string,
    ) {
        super(pos, id)
    }

    static fromJson(json: any): BuilderReteNode {
        return new BuilderReteNode(json.type, json.parent, json.options, json.children, Vec2.fromJson(json.pos), json.id)
    }

    get(getBuilder: (id: string) => BuilderReteNode, getOption: (id: string) => OptionReteNode): B {
        return this.type.get(
            (output) => this.children[output].map((child) => getBuilder(child).get(getBuilder, getOption)),
            (option) => this.options[option] ? getOption(this.options[option]).option : null,
            new RandomList()
        )
    }

    toJson(): {} {
        return {
            id: this.id,
            pos: this.pos.toJson(),
            type: this.type.id,
            parent: this.parent,
            options: this.options,
            children: this.children
        }
    }
}