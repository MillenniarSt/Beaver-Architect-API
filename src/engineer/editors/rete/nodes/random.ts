//             _____
//         ___/     \___        |  |
//      ##/  _.- _.-    \##  -  |  |                       -
//      ##\#=_  '    _=#/##  |  |  |  /---\  |      |      |   ===\  |  __
//      ##   \\#####//   ##  |  |  |  |___/  |===\  |===\  |   ___|  |==/
//      ##       |       ##  |  |  |  |      |   |  |   |  |  /   |  |
//      ##       |       ##  |  \= \= \====  |   |  |   |  |  \___/  |
//      ##\___   |   ___/
//      ##    \__|__/

import { Vec2 } from "../../../../world/vector.js"
import { ReteNode, type ReteNodeUpdate } from "../rete.js"
import { ObjectUpdate, VarUpdate } from "../../../../connection/directives/update.js"
import { Random } from "../../../../builder/random/random.js"

export type RandomReteNodeUpdate = ReteNodeUpdate & {
    
}

export const randomReteNodeUpdate = new ObjectUpdate<RandomReteNodeUpdate>({
    pos: new VarUpdate()
})

export class RandomReteNode extends ReteNode {

    constructor(
        public random: Random,
        pos: Vec2,
        id?: string,
    ) {
        super(pos, id)
    }

    static fromJson(json: any): RandomReteNode {
        return new RandomReteNode(Random.fromJson(json.random),  Vec2.fromJson(json.pos), json.id)
    }

    toJson(): {} {
        return {
            id: this.id,
            pos: this.pos.toJson(),
            random: this.random.toNamedJson()
        }
    }
}