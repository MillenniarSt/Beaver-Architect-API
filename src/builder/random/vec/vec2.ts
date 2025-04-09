//             _____
//         ___/     \___        |  |
//      ##/  _.- _.-    \##  -  |  |                       -
//      ##\#=_  '    _=#/##  |  |  |  /---\  |      |      |   ===\  |  __
//      ##   \\#####//   ##  |  |  |  |___/  |===\  |===\  |   ___|  |==/
//      ##       |       ##  |  |  |  |      |   |  |   |  |  /   |  |
//      ##       |       ##  |  \= \= \====  |   |  |   |  |  \___/  |
//      ##\___   |   ___/
//      ##    \__|__/

import { Vec2 } from "../../../world/vector";
import { ConstantRandom, NamedRandom, Random, Seed } from "../random";

@NamedRandom()
export class ConstantVec2 extends ConstantRandom<Vec2> {

    readonly type = 'vec2'

    constructor(
        public value: Vec2
    ) {
        super()
    }

    static fromJson(json: any): ConstantVec2 {
        return new ConstantVec2(Vec2.fromJson(json))
    }

    toJson(): {} {
        return this.value.toJson()
    }
}

@NamedRandom()
export class RandomVec2 extends Random<Vec2> {

    readonly type = 'vec2'

    constructor(
        public x: Random<number>,
        public y: Random<number>
    ) {
        super()
    }

    static fromJson(json: any): RandomVec2 {
        return new RandomVec2(Random.fromJson(json.x), Random.fromJson(json.y))
    }

    toConstant(seed: Seed): ConstantRandom<Vec2> {
        return new ConstantVec2(this.seeded(seed))
    }

    seeded(seed: Seed): Vec2 {
        return new Vec2(this.x.seeded(seed), this.y.seeded(seed))
    }

    toJson(): {} {
        return {
            x: this.x.toNamedJson(),
            y: this.y.toNamedJson()
        }
    }
}