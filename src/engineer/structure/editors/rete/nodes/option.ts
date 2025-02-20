import { Vec2 } from "../../../../../world/vector.js"
import { ReteNode } from "../../../../editors/rete.js"
import { Option } from '../../../../../util/option.js'

export class OptionReteNode extends ReteNode {

    constructor(
        protected option: Option,
        pos: Vec2,
        id?: string,
    ) {
        super(pos, id)
    }

    static fromJson(json: any): OptionReteNode {
        return new OptionReteNode(Option.fromJson(json.option),  Vec2.fromJson(json.pos), json.id)
    }

    toJson(): {} {
        return {
            id: this.id,
            pos: this.pos.toJson(),
            options: this.option.toNamedJson()
        }
    }
}