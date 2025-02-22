import { Vec2 } from "../../../../../world/vector.js"
import { ReteNode } from "../../../../editors/rete.js"

export class StructureEngineerReteNode extends ReteNode {

    constructor(
        public builder: string | null,
        pos: Vec2,
        id?: string,
    ) {
        super(pos, id)
    }

    static fromJson(json: any): StructureEngineerReteNode {
        return new StructureEngineerReteNode(json.builder, Vec2.fromJson(json.pos), json.id)
    }

    toJson(): {} {
        return {
            id: this.id,
            pos: this.pos.toJson(),
            builder: this.builder
        }
    }
}