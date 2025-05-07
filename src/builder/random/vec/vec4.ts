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
import { Vec3, Vec4 } from "../../../world/vector";
import { ConstantRandom, Random, Seed } from "../random";

export class ConstantVec4 extends ConstantRandom<Vec4> {

    get type(): string {
        return 'c_vec4'
    }

    constructor(
        public value: Vec4
    ) {
        super()
    }

    static fromJson(json: any): ConstantVec4 {
        return new ConstantVec4(Vec4.fromJson(json))
    }

    toData(): {} {
        return this.value.toJson()
    }
}

export class RandomVec4 extends Random<Vec4> {

    get type(): string {
        return 'vec4'
    }

    constructor(
        public a: Random<number>,
        public b: Random<number>,
        public c: Random<number>,
        public d: Random<number>
    ) {
        super()
    }

    static fromJson(json: any): RandomVec4 {
        return new RandomVec4(RandomTypeRegistry.NUMBER.randomFromJson(json.a), RandomTypeRegistry.NUMBER.randomFromJson(json.b), RandomTypeRegistry.NUMBER.randomFromJson(json.c), RandomTypeRegistry.NUMBER.randomFromJson(json.d))
    }

    edit(data: any): void {
        
    }

    seeded(seed: Seed): Vec4 {
        return new Vec4(this.a.seeded(seed), this.b.seeded(seed), this.c.seeded(seed), this.d.seeded(seed))
    }

    toData(): {} {
        return {
            a: this.a.toJson(),
            b: this.b.toJson(),
            c: this.c.toJson(),
            d: this.d.toJson()
        }
    }
}

export class RandomQuaternion extends Random<Vec4> {

    get type(): string {
        return 'quaternion'
    }

    constructor(
        public w: Random<number>,
        public axis: Random<Vec3>
    ) {
        super()
    }

    static fromJson(json: any): RandomQuaternion {
        return new RandomQuaternion(RandomTypeRegistry.NUMBER.randomFromJson(json.w), RandomTypeRegistry.VEC3.randomFromJson(json.axis))
    }

    edit(data: any): void {
        
    }

    seeded(seed: Seed): Vec4 {
        const axis = this.axis.seeded(seed)
        return new Vec4(this.w.seeded(seed), axis.x, axis.y, axis.z)
    }

    toData(): {} {
        return {
            w: this.w.toJson(),
            axis: this.axis.toJson()
        }
    }
}