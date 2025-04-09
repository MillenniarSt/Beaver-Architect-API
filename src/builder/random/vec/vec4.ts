//             _____
//         ___/     \___        |  |
//      ##/  _.- _.-    \##  -  |  |                       -
//      ##\#=_  '    _=#/##  |  |  |  /---\  |      |      |   ===\  |  __
//      ##   \\#####//   ##  |  |  |  |___/  |===\  |===\  |   ___|  |==/
//      ##       |       ##  |  |  |  |      |   |  |   |  |  /   |  |
//      ##       |       ##  |  \= \= \====  |   |  |   |  |  \___/  |
//      ##\___   |   ___/
//      ##    \__|__/

import { Vec3, Vec4 } from "../../../world/vector";
import { ConstantRandom, NamedRandom, Random, Seed } from "../random";

@NamedRandom()
export class ConstantVec4 extends ConstantRandom<Vec4> {

    readonly type = 'vec4'

    constructor(
        public value: Vec4
    ) {
        super()
    }

    static fromJson(json: any): ConstantVec4 {
        return new ConstantVec4(Vec4.fromJson(json))
    }

    toJson(): {} {
        return this.value.toJson()
    }
}

@NamedRandom()
export class RandomVec4 extends Random<Vec4> {

    readonly type = 'vec4'

    constructor(
        public a: Random<number>,
        public b: Random<number>,
        public c: Random<number>,
        public d: Random<number>
    ) {
        super()
    }

    static fromJson(json: any): RandomVec4 {
        return new RandomVec4(Random.fromJson(json.a), Random.fromJson(json.b), Random.fromJson(json.c), Random.fromJson(json.d))
    }

    toConstant(seed: Seed): ConstantRandom<Vec4> {
        return new ConstantVec4(this.seeded(seed))
    }

    seeded(seed: Seed): Vec4 {
        return new Vec4(this.a.seeded(seed), this.b.seeded(seed), this.c.seeded(seed), this.d.seeded(seed))
    }

    toJson(): {} {
        return {
            a: this.a.toNamedJson(),
            b: this.b.toNamedJson(),
            c: this.c.toNamedJson(),
            d: this.d.toNamedJson()
        }
    }
}

@NamedRandom()
export class RandomQuaternion extends Random<Vec4> {

    readonly type = 'vec4'

    constructor(
        public w: Random<number>,
        public axis: Random<Vec3>
    ) {
        super()
    }

    static fromJson(json: any): RandomQuaternion {
        return new RandomQuaternion(Random.fromJson(json.w), Random.fromJson(json.axis))
    }

    toConstant(seed: Seed): ConstantRandom<Vec4> {
        return new ConstantVec4(this.seeded(seed))
    }

    seeded(seed: Seed): Vec4 {
        const axis = this.axis.seeded(seed)
        return new Vec4(this.w.seeded(seed), axis.x, axis.y, axis.z)
    }

    toJson(): {} {
        return {
            w: this.w.toNamedJson(),
            axis: this.axis.toNamedJson()
        }
    }
}