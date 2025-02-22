import { ClientDirector } from "../../../../connection/director.js";
import { ReteEditor } from "../../../editors/rete.js";
import { StructureEngineer } from "../../structure.js";
import { BuilderReteNode, getBuilderType } from "./nodes/builder.js";
import { OptionReteNode } from "./nodes/option.js";
import { StructureEngineerReteNode } from "./nodes/engineer.js";
import { Builder } from "../../../../builder/builder.js";
import { v4 } from "uuid";
import { Vec2 } from "../../../../world/vector.js";
import { ResourceReference } from "../../../engineer.js";
import { getProject } from "../../../../instance.js";
import { ClientSide } from "../../../../connection/sides.js";

export class StructureReteEditor extends ReteEditor<StructureEngineer> {

    constructor(
        engineer: StructureEngineer,
        readonly base: StructureEngineerReteNode,
        readonly builders: Map<string, BuilderReteNode>,
        readonly options: Map<string, OptionReteNode>
    ) {
        super(engineer)
    }

    static create(engineer: StructureEngineer): StructureReteEditor {
        let builders: Map<string, BuilderReteNode> = new Map()
        let options: Map<string, OptionReteNode> = new Map()

        function recursive(builder: Builder, parent: string | null = null, pos: Vec2 = Vec2.ZERO): string {
            const id = v4()
            const type = getBuilderType(builder.type)
            builders.set(id, new BuilderReteNode(
                type,
                parent, 
                Object.fromEntries(type.options.map((option, i) => {
                    const node = new OptionReteNode(builder.options[option.id], pos.add(new Vec2(50, 30)))
                    options.set(node.id, node)
                    return [option.id, node.id]
                })),
                Object.fromEntries(type.outputs.map((output, i) => [output.id, output.getChildren(builder).map((child, i) => recursive(child, id, pos.add(new Vec2(120, i * 100))))])),
                pos,
                id
            ))
            return id
        }
        const baseBuilder = recursive(engineer.builder)

        return new StructureReteEditor(engineer, new StructureEngineerReteNode(baseBuilder, new Vec2(-100, 0)), builders, options)
    }

    static fromJson(json: any, engineer: StructureEngineer): StructureReteEditor {
        return new StructureReteEditor(engineer, StructureEngineerReteNode.fromJson(json.base), 
            new Map(Object.entries(json.builders).map(([key, builder]) => [key, BuilderReteNode.fromJson(builder)])),
            new Map(Object.entries(json.options).map(([key, option]) => [key, OptionReteNode.fromJson(option)]))
        )
    }

    static get(ref: ResourceReference<StructureEngineer>): StructureReteEditor {
        const engineer = ref.get()
        try {
            return StructureReteEditor.fromJson(getProject().read(ref.getEditorPath('rete')), engineer)
        } catch(e) {
            return StructureReteEditor.create(engineer)
        }
    }

    update(director: ClientDirector, update: {}): void {
        
    }

    apply(client: ClientSide): void {
        if(this.base.builder === null) {
            client.warn('Connect a Builder to the Engineer')
        } else {
            const oldBuilder = this.engineer.builder
            ClientDirector.execute(client, 
                async (director) => this.engineer.setBuilder(director, this.getBuilder(this.base.builder!).get(
                    (id) => this.getBuilder(id),
                    (id) => this.getOption(id)
                )),
                async (director) => this.engineer.setBuilder(director, oldBuilder)
            )
        }
    }

    getBuilder(id: string): BuilderReteNode {
        return this.builders.get(id)!
    }

    getOption(id: string): OptionReteNode {
        return this.options.get(id)!
    }

    toJson(): {} {
        return {
            base: this.base.toJson(),
            builders: Object.entries(Array.of(this.builders.values()).map(([id, node]) => [id, node.toJson()])),
            options: Object.entries(Array.of(this.builders.values()).map(([id, node]) => [id, node.toJson()]))
        }
    }
}