//             _____
//         ___/     \___        |  |
//      ##/  _.- _.-    \##  -  |  |                       -
//      ##\#=_  '    _=#/##  |  |  |  /---\  |      |      |   ===\  |  __
//      ##   \\#####//   ##  |  |  |  |___/  |===\  |===\  |   ___|  |==/
//      ##       |       ##  |  |  |  |      |   |  |   |  |  /   |  |
//      ##       |       ##  |  \= \= \====  |   |  |   |  |  \___/  |
//      ##\___   |   ___/
//      ##    \__|__/

import { RandomTypeRegistry } from "../../../register/random";
import { Vec2 } from "../../../world/vector";
import { ConstantRandom, Random, Seed } from "../random";

export class ConstantVec2 extends ConstantRandom<Vec2> {

    get type(): string {
        return 'c_vec2'
    }

    constructor(
        public value: Vec2
    ) {
        super()
    }

    static fromJson(json: any): ConstantVec2 {
        return new ConstantVec2(Vec2.fromJson(json))
    }

    toData(): {} {
        return this.value.toJson()
    }
}

export class RandomVec2 extends Random<Vec2> {

    get type(): string {
        return 'vec2'
    }

    constructor(
        public x: Random<number>,
        public y: Random<number>
    ) {
        super()
    }

    static fromJson(json: any): RandomVec2 {
        return new RandomVec2(RandomTypeRegistry.NUMBER.randomFromJson(json.x), RandomTypeRegistry.NUMBER.randomFromJson(json.y))
    }

    edit(data: any): void {
        
    }

    seeded(seed: Seed): Vec2 {
        return new Vec2(this.x.seeded(seed), this.y.seeded(seed))
    }

    toData(): {} {
        return {
            x: this.x.toJson(),
            y: this.y.toJson()
        }
    }
}