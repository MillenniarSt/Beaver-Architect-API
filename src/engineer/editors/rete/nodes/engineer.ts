import { ObjectUpdate, VarUpdate } from "../../../../connection/directives/update.js"
import { Vec2 } from "../../../../world/vector.js"
import { ReteNode, ReteNodeUpdate } from "../rete.js"

export type StructureEngineerReteNodeUpdate = ReteNodeUpdate & {
    
}

export const structureEngineerReteNodeUpdate = new ObjectUpdate<StructureEngineerReteNodeUpdate>({
    pos: new VarUpdate()
})

export class StructureEngineerReteNode extends ReteNode {

    static fromJson(json: any): StructureEngineerReteNode {
        return new StructureEngineerReteNode(Vec2.fromJson(json.pos), json.id)
    }

    toJson(): {} {
        return {
            id: this.id,
            pos: this.pos.toJson()
        }
    }
}